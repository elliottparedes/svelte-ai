import { DomainError } from '../domain/DomainError';
import type { ChatAttachment } from '../domain/ChatProvider.interface';
import { decryptSecret } from '../infrastructure/secretCrypto';
import { sendTelegramMessage } from '../infrastructure/telegramApiClient';
import { markdownToTelegramHtml } from '../infrastructure/telegramMarkdownHtml';
import { logger } from '../logger';
import type { ChatRepository } from '../repositories/ChatRepository';
import { TelegramChatBindingRepository } from '../repositories/TelegramChatBindingRepository';
import { TelegramBotRepository } from '../repositories/TelegramBotRepository';
import { buildPhotoAttachment, isResetCommand, parseToolNames } from './telegramIngressHelpers';
import { ModelRoutingService } from './ModelRoutingService';
import type { ConversationService } from './ConversationService';
import { UsageMeteringService } from './UsageMeteringService';

type TelegramUpdate = {
	update_id: number;
	message?: {
		text?: string;
		caption?: string;
		photo?: Array<{ file_id: string; file_size?: number }>;
		chat: { id: string | number };
	};
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
		const message = update.message;
		if (!message) return { ok: true, ignored: true };
		const chatId = String(message.chat.id);
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
		const token = decryptSecret(bot.tokenCiphertext, this.encryptionKey);
		const prompt = (message.text ?? message.caption ?? '').trim();
		let attachment: ChatAttachment | null = null;
		try {
			attachment = await buildPhotoAttachment(token, message.photo);
		} catch (err) {
			logger.warn('Telegram image attachment failed', {
				botId: bot.id,
				chatId,
				error: err instanceof Error ? err.message : String(err)
			});
			await sendTelegramMessage(token, chatId, 'I could not read that image. Please send another one.');
			return { ok: true, ignored: true };
		}
		const attachments = attachment ? [attachment] : undefined;
		if (!prompt && !attachments?.length) return { ok: true, ignored: true };
		if (isResetCommand(prompt)) {
			if (binding?.conversationId) {
				await this.bindingRepo.deleteByConversationId(binding.conversationId);
			}
			await sendTelegramMessage(
				token,
				chatId,
				'Conversation reset. Send a new message to start a fresh thread.'
			);
			logger.info('Telegram chat reset', { botId: bot.id, chatId });
			return { ok: true };
		}
		await this.usage.assertBotWithinDailyLimit(bot.userId, bot);
		const enabledToolNames = parseToolNames(bot.enabledToolNames);
		const effectivePrompt = prompt || 'Please help with this image.';
		const modelId = this.modelRouter.resolve({
			prompt: effectivePrompt,
			requestedModel: bot.defaultModelId ?? undefined,
			attachments,
			enabledToolNames,
			defaultModel: this.defaultModel
		});
		await this.usage.recordInbound(bot.userId, bot.id, modelId, effectivePrompt);
		let out = '';
		let toolCalls = 0;
		let resolvedConversationId = activeBinding?.conversationId;
		for await (const event of this.conversationService.processPrompt(
			bot.userId,
			activeBinding?.conversationId,
			effectivePrompt,
			attachments,
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
