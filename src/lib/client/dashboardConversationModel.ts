import type { Conversation } from '$lib/types/dashboard';

export function patchConversationModelId(
	conversations: Conversation[],
	projectConversations: Conversation[],
	id: string,
	modelId: string
): { conversations: Conversation[]; projectConversations: Conversation[] } {
	const patch = (list: Conversation[]) => list.map((c) => (c.id === id ? { ...c, modelId } : c));
	return { conversations: patch(conversations), projectConversations: patch(projectConversations) };
}
