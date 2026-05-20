import type { ChatMessage, Conversation, Project } from '$lib/types/dashboard';
import { parseImageGenerationToolResult } from '$lib/shared/imageGenerationToolResult';

function inferToolNameFromContent(content: string): string {
	if (parseImageGenerationToolResult(content)) return 'generate_image';
	try {
		const j = JSON.parse(content) as { ok?: boolean };
		if (typeof j.ok === 'boolean') return 'generate_image';
	} catch {
		// not JSON tool payload
	}
	return 'tool';
}

export type ConversationThread = {
	messages: ChatMessage[];
	modelId: string | null;
};

export async function fetchConversationThread(conversationId: string): Promise<ConversationThread | null> {
	const res = await fetch(`/api/v1/conversations/${conversationId}/messages`);
	if (!res.ok) return null;
	const json = await res.json();
	const conv = json.conversation as { modelId?: string | null };
	const messages = json.messages.map(
		(m: { id: string; role: string; content: string; createdAt: string; toolCallId?: string }) => ({
			...m,
			role: m.role as ChatMessage['role'],
			createdAt: new Date(m.createdAt),
			...(m.role === 'tool' && m.content
				? { toolCall: { name: inferToolNameFromContent(m.content), result: m.content } }
				: {})
		})
	);
	return { messages, modelId: conv.modelId ?? null };
}

/** @deprecated Use fetchConversationThread */
export async function fetchConversationMessages(conversationId: string): Promise<ChatMessage[] | null> {
	const thread = await fetchConversationThread(conversationId);
	return thread?.messages ?? null;
}

export async function fetchProjectConversations(projectId: string): Promise<Conversation[] | null> {
	const res = await fetch(`/api/v1/projects/${projectId}`);
	if (!res.ok) return null;
	const json = await res.json();
	return json.conversations as Conversation[];
}

export async function deleteConversationApi(id: string): Promise<boolean> {
	const res = await fetch(`/api/v1/conversations/${id}`, { method: 'DELETE' });
	return res.ok;
}

export async function renameConversationApi(id: string, title: string): Promise<boolean> {
	const res = await fetch(`/api/v1/conversations/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ title })
	});
	return res.ok;
}

export async function saveProjectPromptApi(
	projectId: string,
	systemPrompt: string
): Promise<boolean> {
	const res = await fetch(`/api/v1/projects/${projectId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ systemPrompt })
	});
	return res.ok;
}

export async function moveConversationToProject(
	conversationId: string,
	projectId: string | null
): Promise<boolean> {
	const res = await fetch(`/api/v1/conversations/${conversationId}/move`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ projectId })
	});
	return res.ok;
}

export async function fetchNewConversationSummary(
	conversationId: string
): Promise<{ title: string; projectId: string | null; modelId: string | null } | null> {
	const res = await fetch(`/api/v1/conversations/${conversationId}/messages`);
	if (!res.ok) return null;
	const json = await res.json();
	const c = json.conversation as { title: string; projectId?: string | null; modelId?: string | null };
	return { title: c.title, projectId: c.projectId ?? null, modelId: c.modelId ?? null };
}
