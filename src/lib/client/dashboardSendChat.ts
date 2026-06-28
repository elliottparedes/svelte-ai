import type { ChatAttachmentInput, ChatMessage } from '$lib/types/dashboard';
import { readChatSseStream } from '$lib/client/readChatSse';
import { accumulateChatSse } from '$lib/client/dashboardChatSseReducer';
import { ElevenLabsPcmPlayer, type PcmPlayerHooks } from '$lib/client/elevenLabsPcmPlayer';
import type { ImmersiveVoicePhase } from '$lib/shared/immersiveVoice';
import {
	isPendingConversationId,
	type StreamFinishResult
} from '$lib/client/dashboardStreamLifecycle';
import {
	imageGenToolSucceeded,
	refetchMessagesAfterImageGen
} from '$lib/client/refetchConversationAfterImageGen';
import { runClientCodeTool } from '$lib/client/runClientCodeTool';
export type DashboardSendDeps = {
	streamKey: string;
	getMessages: () => ChatMessage[];
	text: string;
	attachments: ChatAttachmentInput[];
	getProjectComposeMode: () => boolean;
	getActiveProjectId: () => string | null;
	getDeepReasoning: () => boolean;
	getModelSupportsTools: () => boolean;
	/** Pro tier: send explicit OpenRouter model id (no auto-routing). */
	getExplicitModelId?: () => string | undefined;
	onRouting?: (modelId: string) => void;
	getEnabledToolNames: () => readonly string[];
	setInputValue: (v: string) => void;
	setAttachments: (a: ChatAttachmentInput[]) => void;
	onStreamMessages: (
		streamKey: string,
		messages: ChatMessage[],
		errorMessage: string,
		isCompacting: boolean,
		streamingTurnCostUsd?: number
	) => void;
	onStreamSummaryDone?: (
		streamKey: string,
		conversationId: string,
		summaryThroughMessageId: string,
		summaryChars: number
	) => void;
	onStreamTitle: (streamKey: string, conversationId: string, title: string) => void;
	onStreamReplyDone?: (streamKey: string, conversationId: string) => void;
	onStreamFinish: (result: StreamFinishResult) => Promise<void>;
	onStreamFailed: (streamKey: string, errorMessage: string) => void;
	voiceModeEnabled?: boolean;
	/** Immersive orb UI: drives phase + reuses one PCM player. */
	immersive?: {
		onPhase: (phase: ImmersiveVoicePhase) => void;
		pcm: ElevenLabsPcmPlayer;
		pcmHooks: PcmPlayerHooks;
	};
};

export async function sendDashboardChatMessage(d: DashboardSendDeps): Promise<void> {
	const text = d.text.trim();
	if (!text && d.attachments.length === 0) return;
	const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone?.trim();

	d.setInputValue('');
	const attachmentSummary = d.attachments
		.map((a) => {
			const label = a.type === 'image' ? 'Image' : a.type === 'file' ? 'PDF' : 'File';
			return `[${label}: ${a.name}]`;
		})
		.join(' ');
	const displayContent = text + (attachmentSummary ? ' ' + attachmentSummary : '');
	const nextMessages: ChatMessage[] = [
		...d.getMessages(),
		{ id: crypto.randomUUID(), role: 'user', content: displayContent, createdAt: new Date() }
	];
	d.onStreamMessages(d.streamKey, nextMessages, '', false);

	const payloadAttachments = d.attachments.map((a) => ({
		type: a.type,
		name: a.name,
		dataUrl: a.dataUrl,
		content: a.content,
		mimeType: a.mimeType
	}));
	d.setAttachments([]);

	const basePayload: Record<string, unknown> = { message: text || ' ', attachments: payloadAttachments };
	if (d.getDeepReasoning()) basePayload.deepReasoning = true;
	const explicitModel = d.getExplicitModelId?.()?.trim();
	if (explicitModel) basePayload.model = explicitModel;
	if (!isPendingConversationId(d.streamKey)) basePayload.conversationId = d.streamKey;
	if (d.getProjectComposeMode() && d.getActiveProjectId()) basePayload.projectId = d.getActiveProjectId();
	if (d.getModelSupportsTools()) basePayload.enabledToolNames = [...d.getEnabledToolNames()];
	if (d.voiceModeEnabled) basePayload.voiceMode = true;

	const assistantId = crypto.randomUUID();
	let acc = {
		messages: nextMessages,
		assistantContent: '',
		assistantReasoning: '',
		doneConversationId: null as string | null,
		errorMessage: '',
		routedModelId: null as string | null,
		isCompacting: false,
		summaryThroughMessageId: null as string | null,
		summaryChars: 0,
		streamingTurnCostUsd: 0
	};

	const useVoice = Boolean(d.voiceModeEnabled || d.immersive);
	const pcm = d.immersive?.pcm ?? (useVoice ? new ElevenLabsPcmPlayer() : null);
	if (pcm) {
		if (d.immersive) pcm.setHooks(d.immersive.pcmHooks);
		await pcm.unlock();
	}
	d.immersive?.onPhase('thinking');

	const CHAT_STREAM_MS = 5 * 60 * 1000;
	let streamTimer: ReturnType<typeof setTimeout> | undefined;
	const streamTimedOut = new Promise<never>((_, reject) => {
		streamTimer = setTimeout(
			() => reject(new Error('Chat stream timed out')),
			CHAT_STREAM_MS
		);
	});

	let imageGenNeedsRefetch = false;
	let activeConversationId = !isPendingConversationId(d.streamKey) ? d.streamKey : '';
	let pendingResume:
		| {
				turnId: string;
				toolCallId: string;
				name: string;
				arguments: Record<string, unknown>;
				result: string;
				sandboxFiles: { name: string; content: string }[];
				usageSnapshot: {
					llmCostUsd: number;
					promptTokens: number;
					completionTokens: number;
					externalItems: { provider: string; toolName: string; costUsd: number }[];
				};
		  }
		| null = null;

	try {
		do {
			const payload = pendingResume
				? {
						conversationId: activeConversationId,
						resumeTool: pendingResume,
						browserTimeZone
					}
				: basePayload;
			const res = await fetch('/api/v1/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(browserTimeZone ? { 'X-User-Timezone': browserTimeZone } : {})
				},
				body: JSON.stringify(payload)
			});
			if (!res.ok || !res.body) throw new Error('Failed to send message');
			pendingResume = null;
			const readAll = (async () => {
				for await (const ev of readChatSseStream(res.body!)) {
					if (ev.type === 'title') {
						d.onStreamTitle(d.streamKey, ev.conversationId, ev.title);
						continue;
					}
					if (ev.type === 'audio' && pcm && ev.data) {
						const bin = atob(ev.data);
						const bytes = new Uint8Array(bin.length);
						for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
						pcm.playPcm(bytes);
						continue;
					}
					if (ev.type === 'tool_result' && ev.name === 'generate_image' && imageGenToolSucceeded(ev.result)) {
						imageGenNeedsRefetch = true;
					}
					acc = accumulateChatSse(acc, ev, assistantId);
					if (ev.type === 'tool_call' && ev.execution === 'client' && ev.turnId && ev.conversationId) {
						activeConversationId = ev.conversationId;
						pendingResume = {
							turnId: ev.turnId,
							toolCallId: ev.toolCallId,
							name: ev.name,
							arguments: ev.arguments ?? {},
							result: await runClientCodeTool(String(ev.arguments?.code ?? ''), ev.sandboxFiles ?? []),
							sandboxFiles: ev.sandboxFiles ?? [],
							usageSnapshot: ev.usageSnapshot ?? {
								llmCostUsd: 0,
								promptTokens: 0,
								completionTokens: 0,
								externalItems: []
							}
						};
					}
					if (ev.type === 'done') d.onStreamReplyDone?.(d.streamKey, ev.conversationId);
					if (ev.type === 'summary_done') {
						d.onStreamSummaryDone?.(
							d.streamKey,
							ev.conversationId,
							ev.summaryThroughMessageId,
							ev.summaryChars
						);
					}
					if (ev.type === 'routing' && ev.modelId) d.onRouting?.(ev.modelId);
					d.onStreamMessages(
						d.streamKey,
						acc.messages,
						acc.errorMessage,
						acc.isCompacting,
						acc.streamingTurnCostUsd
					);
				}
			})();
			await Promise.race([readAll, streamTimedOut]);
		} while (pendingResume);

		if (imageGenNeedsRefetch) {
			try {
				const persisted = await refetchMessagesAfterImageGen(acc.doneConversationId);
				if (persisted) {
					acc.messages = persisted;
					d.onStreamMessages(
					d.streamKey,
					acc.messages,
					acc.errorMessage,
					acc.isCompacting,
					acc.streamingTurnCostUsd
				);
				}
			} catch {
				// Image is saved server-side; user can reload the chat if refetch fails.
			}
		}

		d.immersive?.onPhase('idle');
		try {
			await d.onStreamFinish({
				streamKey: d.streamKey,
				conversationId:
					acc.doneConversationId ?? (isPendingConversationId(d.streamKey) ? null : d.streamKey),
				modelId: acc.routedModelId ?? '',
				wasProjectCompose: d.getProjectComposeMode(),
				projectId: d.getActiveProjectId()
			});
		} catch {
			d.onStreamFailed(d.streamKey, 'Failed to finalize response');
		}
	} catch (err) {
		pcm?.stop();
		d.immersive?.onPhase('error');
		const msg = err instanceof Error && err.message.includes('timed out')
			? 'Request timed out. You can try again.'
			: 'Stream interrupted';
		d.onStreamFailed(d.streamKey, msg);
	} finally {
		if (streamTimer) clearTimeout(streamTimer);
	}
}
