import type { Conversation } from '$lib/types/dashboard';

export function patchConversationSummaryMeta(
	list: Conversation[],
	conversationId: string,
	summaryThroughMessageId: string,
	summaryChars: number
): Conversation[] {
	return list.map((c) =>
		c.id === conversationId ? { ...c, summaryThroughMessageId, summaryChars } : c
	);
}

export function activeConversationSummaryMeta(
	conversations: Conversation[],
	projectConversations: Conversation[],
	activeId: string | null
): { summaryThroughMessageId: string | null; summaryChars: number } {
	if (!activeId) return { summaryThroughMessageId: null, summaryChars: 0 };
	const conv =
		conversations.find((c) => c.id === activeId) ??
		projectConversations.find((c) => c.id === activeId);
	return {
		summaryThroughMessageId: conv?.summaryThroughMessageId ?? null,
		summaryChars: conv?.summaryChars ?? 0
	};
}
