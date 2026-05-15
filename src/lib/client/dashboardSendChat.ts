import type { ChatAttachmentInput, ChatMessage, Conversation } from '$lib/types/dashboard';
import { readChatSseStream } from '$lib/client/readChatSse';
import { accumulateChatSse } from '$lib/client/dashboardChatSseReducer';
import {
	fetchNewConversationSummary,
	fetchProjectConversations
} from '$lib/client/dashboardRemote';

export type DashboardSendDeps = {
	getMessages: () => ChatMessage[];
	text: string;
	attachments: ChatAttachmentInput[];
	getActiveConversationId: () => string | null;
	getProjectComposeMode: () => boolean;
	getActiveProjectId: () => string | null;
	getSelectedModel: () => string;
	getConversations: () => Conversation[];
	getProjectConversations: () => Conversation[];
	setInputValue: (v: string) => void;
	setAttachments: (a: ChatAttachmentInput[]) => void;
	setStreaming: (v: boolean) => void;
	setError: (v: string) => void;
	setMessages: (m: ChatMessage[]) => void;
	setActiveConversationId: (id: string | null) => void;
	setProjectComposeMode: (v: boolean) => void;
	setActiveProjectId: (v: string | null) => void;
	setConversations: (c: Conversation[]) => void;
	setProjectConversations: (c: Conversation[]) => void;
};

export async function sendDashboardChatMessage(d: DashboardSendDeps): Promise<void> {
	const text = d.text.trim();
	if (!text && d.attachments.length === 0) return;

	d.setStreaming(true);
	d.setError('');
	d.setInputValue('');

	const attachmentSummary = d.attachments
		.map((a) => {
			const label = a.type === 'image' ? 'Image' : a.type === 'file' ? 'PDF' : 'File';
			return `[${label}: ${a.name}]`;
		})
		.join(' ');
	const displayContent = text + (attachmentSummary ? ' ' + attachmentSummary : '');
	d.setMessages([
		...d.getMessages(),
		{ id: crypto.randomUUID(), role: 'user', content: displayContent, createdAt: new Date() }
	]);

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
			conversationId: d.getActiveConversationId() ?? undefined,
			message: text || ' ',
			model: d.getSelectedModel() || undefined,
			attachments: payloadAttachments
		};
		if (d.getProjectComposeMode() && d.getActiveProjectId()) {
			payload.projectId = d.getActiveProjectId();
		}
		res = await fetch('/api/v1/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
	} catch {
		d.setStreaming(false);
		d.setError('Network error. Please try again.');
		return;
	}

	if (!res.ok || !res.body) {
		d.setStreaming(false);
		d.setError('Failed to send message');
		return;
	}

	const assistantId = crypto.randomUUID();
	let acc = {
		messages: d.getMessages(),
		assistantContent: '',
		doneConversationId: null as string | null,
		errorMessage: ''
	};

	try {
		for await (const ev of readChatSseStream(res.body)) {
			acc = accumulateChatSse(acc, ev, assistantId);
			d.setMessages(acc.messages);
			d.setError(acc.errorMessage);
		}
		const currentConvId = acc.doneConversationId ?? d.getActiveConversationId();
		d.setActiveConversationId(currentConvId);
		if (d.getProjectComposeMode() && currentConvId) {
			d.setProjectComposeMode(false);
			const projId = d.getActiveProjectId();
			d.setActiveProjectId(null);
			if (projId) {
				const list = await fetchProjectConversations(projId);
				if (list) d.setProjectConversations(list);
			}
		} else if (
			currentConvId &&
			!d.getConversations().find((c) => c.id === currentConvId) &&
			!d.getActiveProjectId()
		) {
			const meta = await fetchNewConversationSummary(currentConvId);
			if (meta && meta.projectId == null) {
				d.setConversations([
					{ id: currentConvId, title: meta.title, createdAt: new Date() },
					...d.getConversations()
				]);
			}
		}
	} finally {
		d.setStreaming(false);
	}
}
