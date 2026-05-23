import { patchConversationModelId } from '$lib/client/dashboardConversationModel';
import { patchConversationSummaryMeta } from '$lib/client/dashboardConversationSummary';
import { fetchConversationThread } from '$lib/client/dashboardRemote';
import type { ChatMessage, Conversation } from '$lib/types/dashboard';

export async function loadConversationThread(opts: {
	conversationId: string;
	conversations: Conversation[];
	projectConversations: Conversation[];
	onMessages: (messages: ChatMessage[]) => void;
	onLastRoutedModel: (modelId: string) => void;
	onSummaryMeta: (summaryThroughMessageId: string | null, summaryChars: number) => void;
	onListsPatched: (lists: { conversations: Conversation[]; projectConversations: Conversation[] }) => void;
}): Promise<void> {
	const cached =
		opts.conversations.find((c) => c.id === opts.conversationId) ??
		opts.projectConversations.find((c) => c.id === opts.conversationId);
	if (cached?.modelId) opts.onLastRoutedModel(cached.modelId);
	const thread = await fetchConversationThread(opts.conversationId);
	if (!thread) return;
	opts.onMessages(thread.messages);
	opts.onSummaryMeta(thread.summaryThroughMessageId, thread.summaryChars);
	if (thread.modelId) {
		opts.onLastRoutedModel(thread.modelId);
		const modelLists = patchConversationModelId(
			opts.conversations,
			opts.projectConversations,
			opts.conversationId,
			thread.modelId
		);
		opts.onListsPatched({
			conversations: thread.summaryThroughMessageId
				? patchConversationSummaryMeta(
						modelLists.conversations,
						opts.conversationId,
						thread.summaryThroughMessageId,
						thread.summaryChars
					)
				: modelLists.conversations,
			projectConversations: thread.summaryThroughMessageId
				? patchConversationSummaryMeta(
						modelLists.projectConversations,
						opts.conversationId,
						thread.summaryThroughMessageId,
						thread.summaryChars
					)
				: modelLists.projectConversations
		});
	} else if (thread.summaryThroughMessageId) {
		opts.onListsPatched({
			conversations: patchConversationSummaryMeta(
				opts.conversations,
				opts.conversationId,
				thread.summaryThroughMessageId,
				thread.summaryChars
			),
			projectConversations: patchConversationSummaryMeta(
				opts.projectConversations,
				opts.conversationId,
				thread.summaryThroughMessageId,
				thread.summaryChars
			)
		});
	}
}
