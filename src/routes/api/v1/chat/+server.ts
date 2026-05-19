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
	VISION_RELAY_MAX_TOKENS,
	CHAT_TITLE_MODEL,
	CHAT_TITLE_ENABLED,
	ELEVENLABS_API_KEY,
	ELEVENLABS_VOICE_ID,
	ELEVENLABS_MODEL_ID,
	isElevenLabsConfigured
} from '$lib/server/db/config';
import { ChatStreamVoiceRelay } from '$lib/server/services/ChatStreamVoiceRelay';
import { pumpChatSseWithVoice } from '$lib/server/services/chatSseVoicePump';
import { TtsVoiceService } from '$lib/server/services/TtsVoiceService';
import { logger } from '$lib/server/logger';
import { VisionRelayService } from '$lib/server/services/VisionRelayService';
import { ConversationTitleService } from '$lib/server/services/ConversationTitleService';
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

	const { conversationId, message, model, attachments, projectId, enabledToolNames, voiceMode } =
		parseResult.data;
	const useVoice = Boolean(voiceMode && isElevenLabsConfigured());
	const effectiveModel = model?.trim() || OPENROUTER_DEFAULT_MODEL;
	logger.info('Chat request', {
		userId: user.id,
		conversationId,
		model: effectiveModel,
		attachmentCount: attachments?.length ?? 0,
		projectId,
		voiceMode: useVoice
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
	const titleService = CHAT_TITLE_ENABLED
		? new ConversationTitleService(
				OPENROUTER_API_KEY,
				CHAT_TITLE_MODEL,
				OPENROUTER_HTTP_REFERER || undefined
			)
		: undefined;
	const service = new ConversationService(
		provider,
		new ChatRepository(),
		new MessageRepository(),
		new ToolExecutor(),
		new ProjectRepository(),
		visionRelay,
		titleService
	);

	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			const started = performance.now();
			let resolvedConversationId: string | undefined;
			try {
				const writeLine = (line: string) => controller.enqueue(encoder.encode(line));
				let voice: ChatStreamVoiceRelay | null = null;
				if (useVoice) {
					const ttsVoice = new TtsVoiceService(ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID);
					voice = new ChatStreamVoiceRelay(
						{
							apiKey: ELEVENLABS_API_KEY,
							voiceId: ttsVoice.resolveVoiceId(user),
							modelId: ELEVENLABS_MODEL_ID
						},
						(b64) => writeLine(`data: ${JSON.stringify({ type: 'audio', data: b64 })}\n\n`)
					);
					await voice.connect();
				}
				resolvedConversationId = await pumpChatSseWithVoice(
					service.processPrompt(
						user.id,
						conversationId,
						message,
						attachments,
						effectiveModel,
						projectId,
						enabledToolNames
					),
					writeLine,
					voice
				);
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
