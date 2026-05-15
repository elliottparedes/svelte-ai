import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { chatPromptSchema } from '$lib/server/validation/conversation.schema';
import { OpenRouterProvider } from '$lib/server/infrastructure/OpenRouterProvider';
import { ChatRepository } from '$lib/server/repositories/ChatRepository';
import { MessageRepository } from '$lib/server/repositories/MessageRepository';
import { ProjectRepository } from '$lib/server/repositories/ProjectRepository';
import { ConversationService } from '$lib/server/services/ConversationService';
import { ToolExecutor } from '$lib/server/infrastructure/ToolExecutor';
import {
	OPENROUTER_API_KEY,
	OPENROUTER_HTTP_REFERER,
	OPENROUTER_DEFAULT_MODEL,
	VISION_RELAY_ENABLED,
	VISION_RELAY_MODEL,
	VISION_RELAY_MAX_TOKENS
} from '$lib/server/db/config';
import { logger } from '$lib/server/logger';
import { VisionRelayService } from '$lib/server/services/VisionRelayService';
import {
	hydrateOpenRouterCapabilities,
	isOpenRouterCapabilitiesHydrated
} from '$lib/server/model/modelCapabilities';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	const parseResult = chatPromptSchema.safeParse(body);
	if (!parseResult.success) {
		error(400, parseResult.error.issues.map((i) => i.message).join(', '));
	}

	const { conversationId, message, model, attachments, projectId } = parseResult.data;
	const effectiveModel = model?.trim() || OPENROUTER_DEFAULT_MODEL;
	logger.info('Chat request', {
		userId: user.id,
		conversationId,
		model: effectiveModel,
		attachmentCount: attachments?.length ?? 0,
		projectId
	});

	const provider = new OpenRouterProvider(
		OPENROUTER_API_KEY,
		OPENROUTER_HTTP_REFERER || undefined
	);
	if (!isOpenRouterCapabilitiesHydrated()) {
		try {
			const list = await provider.listModels();
			if (list.length > 0) hydrateOpenRouterCapabilities(list);
		} catch (err) {
			logger.warn('OpenRouter capabilities cache miss', { error: String(err) });
		}
	}
	const visionRelay = VISION_RELAY_ENABLED
		? new VisionRelayService(
				OPENROUTER_API_KEY,
				VISION_RELAY_MODEL,
				VISION_RELAY_MAX_TOKENS,
				OPENROUTER_HTTP_REFERER || undefined
			)
		: undefined;
	const service = new ConversationService(
		provider,
		new ChatRepository(),
		new MessageRepository(),
		new ToolExecutor(),
		new ProjectRepository(),
		visionRelay
	);

	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			const started = performance.now();
			let resolvedConversationId: string | undefined;
			try {
				for await (const chunk of service.processPrompt(
					user.id,
					conversationId,
					message,
					attachments,
					effectiveModel,
					projectId
				)) {
					if (chunk.type === 'done') resolvedConversationId = chunk.conversationId;
					controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
				}
				logger.info('Chat stream complete', {
					userId: user.id,
					conversationId: resolvedConversationId,
					durationMs: Math.round(performance.now() - started)
				});
				controller.close();
			} catch (err) {
				const msg = err instanceof Error ? err.message : 'Stream error';
				logger.error('Chat stream error', {
					error: msg,
					userId: user.id,
					conversationId: resolvedConversationId,
					durationMs: Math.round(performance.now() - started)
				});
				controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`));
				controller.close();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
