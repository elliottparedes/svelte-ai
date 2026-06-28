import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { chatPromptSchema, chatResumeToolSchema } from '$lib/server/validation/conversation.schema';
import { OpenRouterProvider } from '$lib/server/infrastructure/OpenRouterProvider';
import { ChatRepository } from '$lib/server/repositories/ChatRepository';
import { MessageRepository } from '$lib/server/repositories/MessageRepository';
import { ConversationTurnRepository } from '$lib/server/repositories/ConversationTurnRepository';
import { ProjectRepository } from '$lib/server/repositories/ProjectRepository';
import { ConversationService } from '$lib/server/services/ConversationService';
import { ToolExecutor } from '$lib/server/infrastructure/ToolExecutor';
import {
	OPENROUTER_API_KEY,
	OPENROUTER_HTTP_REFERER,
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
import { buildConversationSummaryDeps } from '$lib/server/services/conversationSummaryDeps';
import { IntelligentModelRouter } from '$lib/server/services/IntelligentModelRouter';
import { buildRoutingHistorySnippet } from '$lib/server/services/conversationRoutingSnippet';
import {
	hydrateOpenRouterCapabilities,
	isOpenRouterCapabilitiesHydrated
} from '$lib/server/model/modelCapabilities';
import { ChatQuotaService } from '$lib/server/services/ChatQuotaService';
import { DomainError, handleDomainError } from '$lib/server/domain/DomainError';
import { parseSubscriptionTier } from '$lib/shared/subscriptionTier';
import { ChatTurnUsageAccumulator } from '$lib/server/services/chatTurnUsageAccumulator';
import { createConversationTurnAuditState } from '$lib/server/services/conversationTurnAudit';
import { resumeClientToolConversation } from '$lib/server/services/resumeClientToolConversation';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');
	const browserTimeZone = request.headers.get('x-user-timezone')?.trim() || undefined;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	const isResume = !!body && typeof body === 'object' && 'resumeTool' in body;
	if (!isResume) {
		try {
			await new ChatQuotaService().assertCanSend(user);
		} catch (err) {
			handleDomainError(err);
		}
	}

	if (isResume) {
		const parsed = chatResumeToolSchema.safeParse(body);
		if (!parsed.success) error(400, parsed.error.issues.map((i) => i.message).join(', '));
		return await handleResumeRequest(parsed.data, user.id, browserTimeZone);
	}
	const parsedBody = chatPromptSchema.safeParse(body);
	if (!parsedBody.success) error(400, parsedBody.error.issues.map((i) => i.message).join(', '));
	const { conversationId, message, model, attachments, projectId, enabledToolNames, voiceMode, deepReasoning } = parsedBody.data;
	const useVoice = Boolean(voiceMode && isElevenLabsConfigured());

	const messageRepo = new MessageRepository();
	const turnRepo = new ConversationTurnRepository();
	const turnAudit = createConversationTurnAuditState();
	let recentSnippet: string | undefined;
	if (conversationId) {
		const recent = await messageRepo.findByConversationId(conversationId, 4);
		recentSnippet = buildRoutingHistorySnippet(recent);
	}
	const subscriptionTier = parseSubscriptionTier(user.subscriptionTier);
	const usageAcc = new ChatTurnUsageAccumulator();
	const routeResult = await new IntelligentModelRouter().route({
		userId: user.id,
		conversationId,
		prompt: message,
		requestedModel: model,
		subscriptionTier,
		deepReasoning: subscriptionTier === 'pro' ? false : deepReasoning,
		attachments,
		enabledToolNames,
		recentSnippet
	});
	usageAcc.add(routeResult.routerUsage);
	const effectiveModel = routeResult.modelId;
	logger.info('Chat request', {
		userId: user.id,
		conversationId,
		model: effectiveModel,
		routeSource: routeResult.source,
		routeTier: routeResult.tier,
		routerCostUsd: routeResult.routerUsage?.costUsd,
		attachmentCount: attachments?.length ?? 0,
		projectId,
		voiceMode: useVoice,
		deepReasoning: Boolean(deepReasoning)
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
	const { summaryService, summaryConfig } = buildConversationSummaryDeps();
	const service = new ConversationService(
		provider,
		new ChatRepository(),
		messageRepo,
		new ToolExecutor(),
		new ProjectRepository(),
		visionRelay,
		titleService,
		summaryService,
		summaryConfig,
		turnRepo
	);

	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			const started = performance.now();
			let resolvedConversationId: string | undefined;
			try {
				const writeLine = (line: string) => controller.enqueue(encoder.encode(line));
				writeLine(
					`data: ${JSON.stringify({
						type: 'routing',
						modelId: routeResult.modelId,
						source: routeResult.source,
						tier: routeResult.tier
					})}\n\n`
				);
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
						enabledToolNames,
						usageAcc,
						browserTimeZone,
						routeResult.source,
						routeResult.tier,
						Boolean(deepReasoning),
						JSON.stringify({
							browserTimeZone: browserTimeZone ?? null,
							projectId: projectId ?? null,
							voiceMode: useVoice,
							attachmentCount: attachments?.length ?? 0
						}),
						turnAudit
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
				if (err instanceof DomainError) {
					if (turnAudit.turnId) {
						const snap = usageAcc.snapshot();
						await turnRepo.finalize(turnAudit.turnId, {
							assistantMessageId: turnAudit.assistantMessageId,
							responseChars: turnAudit.assistantChars,
							llmCostUsd: snap.costUsd,
							toolCostUsd: usageAcc.toolCostUsd,
							totalCostUsd: usageAcc.totalCostUsd,
							promptTokens: snap.promptTokens,
							completionTokens: snap.completionTokens,
							toolCallsJson: turnAudit.toolCalls.length ? JSON.stringify(turnAudit.toolCalls) : null,
							status: 'error',
							errorMessage: err.message
						});
					}
					controller.enqueue(
						encoder.encode(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`)
					);
					controller.close();
					return;
				}
				const msg = err instanceof Error ? err.message : 'Stream error';
				logger.error('Chat stream error', {
					error: msg,
					userId: user.id,
					conversationId: resolvedConversationId,
					durationMs: Math.round(performance.now() - started)
				});
				if (turnAudit.turnId) {
					const snap = usageAcc.snapshot();
					await turnRepo.finalize(turnAudit.turnId, {
						assistantMessageId: turnAudit.assistantMessageId,
						responseChars: turnAudit.assistantChars,
						llmCostUsd: snap.costUsd,
						toolCostUsd: usageAcc.toolCostUsd,
						totalCostUsd: usageAcc.totalCostUsd,
						promptTokens: snap.promptTokens,
						completionTokens: snap.completionTokens,
						toolCallsJson: turnAudit.toolCalls.length ? JSON.stringify(turnAudit.toolCalls) : null,
						status: 'error',
						errorMessage: msg
					});
				}
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

async function handleResumeRequest(
	data: import('$lib/server/validation/conversation.schema').ChatResumeToolInput,
	userId: string,
	browserTimeZone: string | undefined
) {
	const provider = new OpenRouterProvider(OPENROUTER_API_KEY, OPENROUTER_HTTP_REFERER || undefined);
	const messageRepo = new MessageRepository();
	const turnRepo = new ConversationTurnRepository();
	const latestTurn = await turnRepo.findLatestByConversationId(data.conversationId);
	const usageAcc = new ChatTurnUsageAccumulator();
	const turnAudit = createConversationTurnAuditState();
	usageAcc.hydrate(
		{
			costUsd: data.resumeTool.usageSnapshot.llmCostUsd,
			promptTokens: data.resumeTool.usageSnapshot.promptTokens,
			completionTokens: data.resumeTool.usageSnapshot.completionTokens
		},
		data.resumeTool.usageSnapshot.externalItems as never[]
	);
	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			const writeLine = (line: string) => controller.enqueue(encoder.encode(line));
			for await (const event of resumeClientToolConversation({
				userId,
				conversationId: data.conversationId,
				modelId: latestTurn?.modelId ?? 'default',
				turnId: data.resumeTool.turnId,
				toolCallId: data.resumeTool.toolCallId,
				toolName: data.resumeTool.name,
				toolArguments: data.resumeTool.arguments,
				toolResult: data.resumeTool.result,
				enabledToolNamesJson: latestTurn?.enabledToolNamesJson,
				sandboxFiles: data.resumeTool.sandboxFiles,
				browserTimeZone: data.browserTimeZone ?? browserTimeZone,
				chatRepo: new ChatRepository(),
				messageRepo,
				projectRepo: new ProjectRepository(),
				provider,
				toolExecutor: new ToolExecutor(),
				usageAcc,
				turnAudit,
				turnRepo
			})) {
				writeLine(`data: ${JSON.stringify(event)}\n\n`);
			}
			controller.close();
		}
	});
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
}
