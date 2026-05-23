import { error, json, type RequestHandler } from '@sveltejs/kit';
import {
	CHAT_TITLE_ENABLED,
	CHAT_TITLE_MODEL,
	OPENROUTER_API_KEY,
	OPENROUTER_DEFAULT_MODEL,
	OPENROUTER_HTTP_REFERER,
	TELEGRAM_TOKEN_ENCRYPTION_KEY
} from '$lib/server/db/config';
import { handleDomainError } from '$lib/server/domain/DomainError';
import { OpenRouterProvider } from '$lib/server/infrastructure/OpenRouterProvider';
import { ToolExecutor } from '$lib/server/infrastructure/ToolExecutor';
import { MessageRepository } from '$lib/server/repositories/MessageRepository';
import { ChatRepository } from '$lib/server/repositories/ChatRepository';
import { ProjectRepository } from '$lib/server/repositories/ProjectRepository';
import { TelegramBotRepository } from '$lib/server/repositories/TelegramBotRepository';
import { TelegramChatBindingRepository } from '$lib/server/repositories/TelegramChatBindingRepository';
import { UsageDailyRepository } from '$lib/server/repositories/UsageDailyRepository';
import { ConversationService } from '$lib/server/services/ConversationService';
import { ConversationTitleService } from '$lib/server/services/ConversationTitleService';
import { buildConversationSummaryDeps } from '$lib/server/services/conversationSummaryDeps';
import { ModelRoutingService } from '$lib/server/services/ModelRoutingService';
import { TelegramIngressService } from '$lib/server/services/TelegramIngressService';
import { UsageMeteringService } from '$lib/server/services/UsageMeteringService';
import {
	hydrateOpenRouterCapabilities,
	isOpenRouterCapabilitiesHydrated
} from '$lib/server/model/modelCapabilities';
import { logger } from '$lib/server/logger';
import { telegramWebhookUpdateSchema } from '$lib/server/validation/telegram.schema';

function buildIngress(): TelegramIngressService {
	const provider = new OpenRouterProvider(OPENROUTER_API_KEY, OPENROUTER_HTTP_REFERER || undefined);
	const chatRepo = new ChatRepository();
	const titleService = CHAT_TITLE_ENABLED
		? new ConversationTitleService(
				OPENROUTER_API_KEY,
				CHAT_TITLE_MODEL,
				OPENROUTER_HTTP_REFERER || undefined
			)
		: undefined;
	const { summaryService, summaryConfig } = buildConversationSummaryDeps();
	const conversationService = new ConversationService(
		provider,
		chatRepo,
		new MessageRepository(),
		new ToolExecutor(),
		new ProjectRepository(),
		undefined,
		titleService,
		summaryService,
		summaryConfig
	);
	return new TelegramIngressService(
		new TelegramBotRepository(),
		new TelegramChatBindingRepository(),
		chatRepo,
		conversationService,
		new UsageMeteringService(new UsageDailyRepository()),
		new ModelRoutingService(),
		TELEGRAM_TOKEN_ENCRYPTION_KEY,
		OPENROUTER_DEFAULT_MODEL
	);
}

export const POST: RequestHandler = async ({ params, request }) => {
	if (!params.botId) error(400, 'Invalid webhook path');
	logger.info('Telegram webhook hit', { botId: params.botId });
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const parsed = telegramWebhookUpdateSchema.safeParse(body);
	if (!parsed.success) return json({ ok: true, ignored: true });
	const provider = new OpenRouterProvider(OPENROUTER_API_KEY, OPENROUTER_HTTP_REFERER || undefined);
	if (!isOpenRouterCapabilitiesHydrated()) {
		try {
			const models = await provider.listModels();
			if (models.length > 0) hydrateOpenRouterCapabilities(models);
		} catch {
			// ignore hydration errors for webhook ingestion
		}
	}
	try {
		await buildIngress().handleWebhook(
			params.botId,
			request.headers.get('x-telegram-bot-api-secret-token'),
			parsed.data
		);
		return json({ ok: true });
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		logger.error('Telegram webhook failed', {
			botId: params.botId,
			error: msg,
			hasSecretHeader: Boolean(request.headers.get('x-telegram-bot-api-secret-token'))
		});
		handleDomainError(err);
	}
};
