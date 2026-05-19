import { patchConversationModelId } from '$lib/client/dashboardConversationModel';
import { pickDashboardModelId } from '$lib/client/dashboardPickModel';
import { fetchConversationThread } from '$lib/client/dashboardRemote';
import type { ChatMessage, Conversation, Model } from '$lib/types/dashboard';

export async function loadConversationThread(opts: {
	conversationId: string;
	models: Model[];
	defaultModelId: string;
	conversations: Conversation[];
	projectConversations: Conversation[];
	onMessages: (messages: ChatMessage[]) => void;
	onSelectedModel: (modelId: string) => void;
	onListsPatched: (lists: { conversations: Conversation[]; projectConversations: Conversation[] }) => void;
}): Promise<void> {
	const cached =
		opts.conversations.find((c) => c.id === opts.conversationId) ??
		opts.projectConversations.find((c) => c.id === opts.conversationId);
	if (cached?.modelId) {
		opts.onSelectedModel(pickDashboardModelId(opts.models, cached.modelId, opts.defaultModelId));
	}
	const thread = await fetchConversationThread(opts.conversationId);
	if (!thread) return;
	opts.onMessages(thread.messages);
	if (!thread.modelId) return;
	opts.onSelectedModel(pickDashboardModelId(opts.models, thread.modelId, opts.defaultModelId));
	opts.onListsPatched(
		patchConversationModelId(opts.conversations, opts.projectConversations, opts.conversationId, thread.modelId)
	);
}
