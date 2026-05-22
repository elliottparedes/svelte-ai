import type { Conversation, Project } from '$lib/types/dashboard';

export function computeChatContextExtraTokens(input: {
	projectComposeMode: boolean;
	activeProjectId: string | null;
	activeConversationId: string | null;
	projects: Project[];
	projectConversations: Conversation[];
	conversations: Conversation[];
}): number {
	if (input.projectComposeMode && input.activeProjectId) {
		const sp = input.projects.find((p) => p.id === input.activeProjectId)?.systemPrompt ?? '';
		return Math.ceil(sp.length / 4);
	}
	const cid = input.activeConversationId;
	if (!cid) return 0;
	const conv =
		input.projectConversations.find((c) => c.id === cid) ??
		input.conversations.find((c) => c.id === cid);
	const pid = conv?.projectId;
	if (!pid) return 0;
	const sp = input.projects.find((p) => p.id === pid)?.systemPrompt ?? '';
	return Math.ceil(sp.length / 4);
}
