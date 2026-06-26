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

function parseToolArgs(raw: string | null | undefined): Record<string, unknown> | undefined {
	if (!raw) return undefined;
	try {
		return JSON.parse(raw) as Record<string, unknown>;
	} catch {
		return undefined;
	}
}

export type ConversationThread = {
	messages: ChatMessage[];
	modelId: string | null;
	summaryThroughMessageId: string | null;
	summaryChars: number;
};

export async function fetchConversationThread(conversationId: string): Promise<ConversationThread | null> {
	const res = await fetch(`/api/v1/conversations/${conversationId}/messages`);
	if (!res.ok) return null;
	const json = await res.json();
	const conv = json.conversation as {
		modelId?: string | null;
		summaryThroughMessageId?: string | null;
		summaryChars?: number;
	};
	const messages = json.messages.map(
		(m: {
			id: string;
			role: string;
			content: string;
			reasoningContent?: string | null;
			createdAt: string;
			turnId?: string | null;
			turnSequence?: number | null;
			toolCallId?: string;
			toolName?: string | null;
			toolArgumentsJson?: string | null;
			costUsd?: number | string | null;
			toolCostUsd?: number | string | null;
			toolUsageJson?: string | null;
			promptTokens?: number | null;
			completionTokens?: number | null;
		}) => {
			const costRaw = m.costUsd;
			const toolCostRaw = m.toolCostUsd;
			const costUsd =
				typeof costRaw === 'number'
					? costRaw > 0
						? costRaw
						: undefined
					: typeof costRaw === 'string' && costRaw !== ''
						? Number(costRaw) || undefined
						: undefined;
			const toolCostUsd =
				typeof toolCostRaw === 'number'
					? toolCostRaw > 0
						? toolCostRaw
						: undefined
					: typeof toolCostRaw === 'string' && toolCostRaw !== ''
						? Number(toolCostRaw) || undefined
						: undefined;
			return {
				...m,
				role: m.role as ChatMessage['role'],
				reasoningContent: m.reasoningContent ?? undefined,
				createdAt: new Date(m.createdAt),
				turnId: m.turnId ?? undefined,
				turnSequence: m.turnSequence ?? undefined,
				toolCallId: m.toolCallId ?? undefined,
				toolName: m.toolName ?? undefined,
				toolArgumentsJson: m.toolArgumentsJson ?? undefined,
				costUsd,
				toolCostUsd,
				toolUsageJson: m.toolUsageJson ?? undefined,
				promptTokens: m.promptTokens ?? undefined,
				completionTokens: m.completionTokens ?? undefined,
				...(m.role === 'tool' && m.content
					? {
							toolCall: {
								name: m.toolName ?? inferToolNameFromContent(m.content),
								arguments: parseToolArgs(m.toolArgumentsJson),
								result: m.content
							}
						}
					: {})
			};
		}
	);
	return {
		messages,
		modelId: conv.modelId ?? null,
		summaryThroughMessageId: conv.summaryThroughMessageId ?? null,
		summaryChars: conv.summaryChars ?? 0
	};
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

export async function reportConversationIssueApi(
	conversationId: string,
	clientContext?: Record<string, unknown>
): Promise<{ ok: true; reportId: string; turnId: string } | null> {
	const res = await fetch(`/api/v1/conversations/${conversationId}/report-issue`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ clientContext })
	});
	if (!res.ok) return null;
	return (await res.json()) as { ok: true; reportId: string; turnId: string };
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
