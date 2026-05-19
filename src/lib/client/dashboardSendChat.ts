import type { ChatAttachmentInput, ChatMessage } from '$lib/types/dashboard';
import { readChatSseStream } from '$lib/client/readChatSse';
import { accumulateChatSse } from '$lib/client/dashboardChatSseReducer';
import { ElevenLabsPcmPlayer, type PcmPlayerHooks } from '$lib/client/elevenLabsPcmPlayer';
import type { ImmersiveVoicePhase } from '$lib/shared/immersiveVoice';
import {
	isPendingConversationId,
	type StreamFinishResult
} from '$lib/client/dashboardStreamLifecycle';

export type DashboardSendDeps = {
	streamKey: string;
	getMessages: () => ChatMessage[];
	text: string;
	attachments: ChatAttachmentInput[];
	getProjectComposeMode: () => boolean;
	getActiveProjectId: () => string | null;
	getSelectedModel: () => string;
	getModelSupportsTools: () => boolean;
	getEnabledToolNames: () => readonly string[];
	setInputValue: (v: string) => void;
	setAttachments: (a: ChatAttachmentInput[]) => void;
	onStreamMessages: (streamKey: string, messages: ChatMessage[], errorMessage: string) => void;
	onStreamTitle: (streamKey: string, conversationId: string, title: string) => void;
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
	d.onStreamMessages(d.streamKey, nextMessages, '');

	const payloadAttachments = d.attachments.map((a) => ({
		type: a.type,
		name: a.name,
		dataUrl: a.dataUrl,
		content: a.content,
		mimeType: a.mimeType
	}));
	d.setAttachments([]);

	let res: Response;
	try {
		const payload: Record<string, unknown> = {
			message: text || ' ',
			model: d.getSelectedModel() || undefined,
			attachments: payloadAttachments
		};
		if (!isPendingConversationId(d.streamKey)) {
			payload.conversationId = d.streamKey;
		}
		if (d.getProjectComposeMode() && d.getActiveProjectId()) {
			payload.projectId = d.getActiveProjectId();
		}
		if (d.getModelSupportsTools()) {
			payload.enabledToolNames = [...d.getEnabledToolNames()];
		}
		if (d.voiceModeEnabled) payload.voiceMode = true;
		res = await fetch('/api/v1/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
	} catch {
		d.onStreamFailed(d.streamKey, 'Network error. Please try again.');
		return;
	}

	if (!res.ok || !res.body) {
		d.onStreamFailed(d.streamKey, 'Failed to send message');
		return;
	}

	const assistantId = crypto.randomUUID();
	let acc = {
		messages: nextMessages,
		assistantContent: '',
		doneConversationId: null as string | null,
		errorMessage: ''
	};

	const useVoice = Boolean(d.voiceModeEnabled || d.immersive);
	const pcm = d.immersive?.pcm ?? (useVoice ? new ElevenLabsPcmPlayer() : null);
	if (pcm) {
		if (d.immersive) pcm.setHooks(d.immersive.pcmHooks);
		await pcm.unlock();
	}
	d.immersive?.onPhase('thinking');

	try {
		for await (const ev of readChatSseStream(res.body)) {
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
			acc = accumulateChatSse(acc, ev, assistantId);
			d.onStreamMessages(d.streamKey, acc.messages, acc.errorMessage);
		}
		d.immersive?.onPhase('idle');
		await d.onStreamFinish({
			streamKey: d.streamKey,
			conversationId: acc.doneConversationId ?? (isPendingConversationId(d.streamKey) ? null : d.streamKey),
			modelId: d.getSelectedModel(),
			wasProjectCompose: d.getProjectComposeMode(),
			projectId: d.getActiveProjectId()
		});
	} catch {
		pcm?.stop();
		d.immersive?.onPhase('error');
		d.onStreamFailed(d.streamKey, 'Stream interrupted');
	}
}
