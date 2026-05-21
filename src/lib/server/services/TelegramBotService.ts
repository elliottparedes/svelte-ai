import { DomainError } from '../domain/DomainError';
import type { TelegramBot, UpdateTelegramBotInput } from '../domain/TelegramBot.types';
import { encryptSecret, maskToken } from '../infrastructure/secretCrypto';
import { getTelegramMe, setTelegramWebhook } from '../infrastructure/telegramApiClient';
import { buildTelegramWebhookUrl } from '../infrastructure/telegramWebhook.util';
import { logger } from '../logger';
import { TelegramBotRepository } from '../repositories/TelegramBotRepository';
import { syncTelegramBotWebhook, type TelegramWebhookStatus } from './telegramBotWebhook';

type BotConfig = {
	encryptionKey: string;
	webhookBaseUrl?: string;
};

type CreateInput = {
	userId: string;
	name: string;
	token: string;
	projectId?: string | null;
	defaultModelId?: string | null;
	enabledToolNames?: readonly string[];
	dailyMessageLimit?: number;
};

type UpdateInput = Omit<CreateInput, 'userId' | 'name' | 'token'> & {
	name?: string;
	token?: string;
	status?: string;
};

export class TelegramBotService {
	constructor(
		private readonly repo: TelegramBotRepository,
		private readonly config: BotConfig
	) {}

	async listByUser(userId: string) {
		return (await this.repo.findByUserId(userId)).map((bot) => this.toView(bot));
	}

	async getById(userId: string, botId: string) {
		return this.toView(await this.requireOwnership(userId, botId));
	}

	async create(input: CreateInput) {
		const me = await getTelegramMe(input.token);
		const bot = await this.repo.create({
			userId: input.userId,
			name: input.name,
			projectId: input.projectId ?? null,
			tokenCiphertext: encryptSecret(input.token, this.config.encryptionKey),
			tokenHint: maskToken(input.token),
			webhookSecret: crypto.randomUUID().replaceAll('-', ''),
			defaultModelId: input.defaultModelId ?? null,
			enabledToolNames: input.enabledToolNames ? JSON.stringify([...input.enabledToolNames]) : null,
			dailyMessageLimit: input.dailyMessageLimit ?? 200
		});
		const updated = await this.repo.update(bot.id, { botUsername: me.username ?? null });
		await this.configureWebhook(input.token, updated.id, updated.webhookSecret);
		return this.toView(updated);
	}

	async update(userId: string, botId: string, input: UpdateInput) {
		const bot = await this.requireOwnership(userId, botId);
		const patch: UpdateTelegramBotInput = {};
		if (input.name !== undefined) patch.name = input.name;
		if (input.projectId !== undefined) patch.projectId = input.projectId;
		if (input.defaultModelId !== undefined) patch.defaultModelId = input.defaultModelId;
		if (input.status !== undefined) patch.status = input.status;
		if (input.dailyMessageLimit !== undefined) patch.dailyMessageLimit = input.dailyMessageLimit;
		if (input.enabledToolNames !== undefined) {
			patch.enabledToolNames = JSON.stringify([...input.enabledToolNames]);
		}
		if (input.token) {
			const me = await getTelegramMe(input.token);
			patch.tokenCiphertext = encryptSecret(input.token, this.config.encryptionKey);
			patch.tokenHint = maskToken(input.token);
			patch.webhookSecret = crypto.randomUUID().replaceAll('-', '');
			patch.botUsername = me.username ?? null;
			await this.configureWebhook(input.token, bot.id, patch.webhookSecret);
		}
		const updated = await this.repo.update(bot.id, patch);
		return this.toView(updated);
	}

	async remove(userId: string, botId: string): Promise<void> {
		await this.requireOwnership(userId, botId);
		await this.repo.deleteByUserId(botId, userId);
	}

	async syncWebhook(userId: string, botId: string): Promise<TelegramWebhookStatus> {
		const bot = await this.requireOwnership(userId, botId);
		return syncTelegramBotWebhook(bot, null, this.config.encryptionKey, this.config.webhookBaseUrl);
	}

	async requireOwnership(userId: string, botId: string): Promise<TelegramBot> {
		const bot = await this.repo.findById(botId);
		if (!bot || bot.userId !== userId) throw new DomainError('Telegram bot not found', 404);
		return bot;
	}

	private async configureWebhook(token: string, botId: string, webhookSecret: string): Promise<void> {
		const base = this.config.webhookBaseUrl?.trim();
		if (!base) {
			logger.warn('Telegram webhook not registered: TELEGRAM_WEBHOOK_BASE_URL is empty', { botId });
			return;
		}
		const webhookUrl = buildTelegramWebhookUrl(base, botId);
		await setTelegramWebhook(token, webhookUrl, webhookSecret);
		logger.info('Telegram webhook registered', { botId, webhookUrl });
	}

	private toView(bot: TelegramBot) {
		const base = this.config.webhookBaseUrl?.trim();
		return {
			id: bot.id,
			userId: bot.userId,
			projectId: bot.projectId,
			name: bot.name,
			botUsername: bot.botUsername,
			tokenHint: bot.tokenHint,
			status: bot.status,
			defaultModelId: bot.defaultModelId,
			enabledToolNames: parseEnabledNames(bot.enabledToolNames),
			dailyMessageLimit: bot.dailyMessageLimit,
			expectedWebhookUrl: base ? buildTelegramWebhookUrl(base, bot.id) : null,
			webhookBaseConfigured: Boolean(base),
			createdAt: bot.createdAt,
			updatedAt: bot.updatedAt
		};
	}
}

function parseEnabledNames(raw: string | null): string[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((item): item is string => typeof item === 'string');
	} catch {
		return [];
	}
}
