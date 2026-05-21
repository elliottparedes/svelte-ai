import { DomainError } from '../domain/DomainError';
import { decryptSecret } from '../infrastructure/secretCrypto';
import { sendTelegramMessage } from '../infrastructure/telegramApiClient';
import { markdownToTelegramHtml } from '../infrastructure/telegramMarkdownHtml';
import { logger } from '../logger';
import type { ChatRepository } from '../repositories/ChatRepository';
import { TelegramChatBindingRepository } from '../repositories/TelegramChatBindingRepository';
import { TelegramBotRepository } from '../repositories/TelegramBotRepository';
import { ModelRoutingService } from './ModelRoutingService';
import type { ConversationService } from './ConversationService';
import { UsageMeteringService } from './UsageMeteringService';

type TelegramUpdate = {
	update_id: number;
	message?: { text: string; chat: { id: string | number } };
};

export class TelegramIngressService {
	constructor(
		private readonly botRepo: TelegramBotRepository,
		private readonly bindingRepo: TelegramChatBindingRepository,
		private readonly chatRepo: ChatRepository,
		private readonly conversationService: ConversationService,
		private readonly usage: UsageMeteringService,
		private readonly modelRouter: ModelRoutingService,
		private readonly encryptionKey: string,
		private readonly defaultModel: string
	) {}

	async handleWebhook(
		botId: string,
		headerSecret: string | null,
		update: TelegramUpdate
	): Promise<{ ok: boolean; ignored?: boolean }> {
		const bot = await this.botRepo.findById(botId);
		if (!bot || bot.status !== 'active') throw new DomainError('Telegram bot not found', 404);
		if (headerSecret !== bot.webhookSecret) {
			const hint = headerSecret
				? 'Webhook secret mismatch'
				: 'Telegram sent no secret header — click Register webhook in Profile';
			throw new DomainError(hint, 401);
		}
		if (!update.message?.text?.trim()) return { ok: true, ignored: true };
		const chatId = String(update.message.chat.id);
		const binding = await this.bindingRepo.findByBotAndChatId(bot.id, chatId);
		const linkedConv =
			binding?.conversationId != null
				? await this.chatRepo.findById(binding.conversationId)
				: null;
		const activeBinding =
			binding && linkedConv && linkedConv.userId === bot.userId ? binding : null;
		if (activeBinding?.lastUpdateId && Number(activeBinding.lastUpdateId) >= update.update_id) {
			return { ok: true, ignored: true };
		}
		await this.usage.assertBotWithinDailyLimit(bot.userId, bot);
		const prompt = update.message.text.trim();
		const enabledToolNames = parseToolNames(bot.enabledToolNames);
		const modelId = this.modelRouter.resolve({
			prompt,
			requestedModel: bot.defaultModelId ?? undefined,
			enabledToolNames,
			defaultModel: this.defaultModel
		});
		await this.usage.recordInbound(bot.userId, bot.id, modelId, prompt);
		const token = decryptSecret(bot.tokenCiphertext, this.encryptionKey);
		let out = '';
		let toolCalls = 0;
		let resolvedConversationId = activeBinding?.conversationId;
		for await (const event of this.conversationService.processPrompt(
			bot.userId,
			activeBinding?.conversationId,
			prompt,
			undefined,
			modelId,
			bot.projectId ?? undefined,
			enabledToolNames
		)) {
			if (event.type === 'chunk') out += event.content;
			if (event.type === 'tool_call') toolCalls += 1;
			if (event.type === 'done') resolvedConversationId = event.conversationId;
		}
		const reply = out.trim() || 'I could not generate a response this time.';
		const clipped = reply.slice(0, 4096);
		await sendTelegramMessage(token, chatId, markdownToTelegramHtml(clipped), {
			parseMode: 'HTML',
			fallbackText: clipped
		});
		await this.usage.recordOutbound(bot.userId, bot.id, modelId, reply, toolCalls);
		if (!resolvedConversationId) throw new DomainError('Conversation resolution failed', 500);
		if (!binding) {
			await this.bindingRepo.create({
				botId: bot.id,
				telegramChatId: chatId,
				conversationId: resolvedConversationId,
				lastUpdateId: String(update.update_id)
			});
		} else {
			await this.bindingRepo.updateByBotAndChatId(bot.id, chatId, {
				lastUpdateId: String(update.update_id),
				conversationId: resolvedConversationId
			});
		}
		logger.info('Telegram webhook processed', {
			botId: bot.id,
			chatId,
			conversationId: resolvedConversationId,
			modelId
		});
		return { ok: true };
	}
}

function parseToolNames(raw: string | null): string[] | undefined {
	if (!raw?.trim()) return undefined;
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return undefined;
		return parsed.filter((item): item is string => typeof item === 'string');
	} catch {
		return undefined;
	}
}
