import {
	fetchConversationThread,
	fetchNewConversationSummary,
	fetchProjectConversations
} from '$lib/client/dashboardRemote';
import {
	isPlaceholderConversationTitle,
	pollConversationTitle
} from '$lib/client/pollConversationTitle';
import {
	flushMessageCache,
	migrateMessageCache,
	patchStreamingSet
} from '$lib/client/dashboardMessageCache';
import type { Conversation } from '$lib/types/dashboard';
import type { DashboardStreamStore, StreamFinishResult } from './dashboardStreamLifecycle.types';

function patchConversationTitle(
	store: DashboardStreamStore,
	streamKey: string,
	conversationId: string,
	title: string
): void {
	const patch = (list: Conversation[]) =>
		list.map((c) => (c.id === streamKey || c.id === conversationId ? { ...c, title } : c));
	store.setConversations(patch(store.getConversations()));
	store.setProjectConversations(patch(store.getProjectConversations()));
}

export async function finishDashboardStream(
	store: DashboardStreamStore,
	result: StreamFinishResult
): Promise<void> {
	const { streamKey, conversationId, modelId, wasProjectCompose, projectId } = result;
	store.setStreamingIds(patchStreamingSet(store.getStreamingIds(), streamKey, false));
	store.setStreamingTurnCostUsd(0);
	if (!conversationId) return;

	let cache = store.getMessageCache();
	if (streamKey !== conversationId) cache = migrateMessageCache(cache, streamKey, conversationId);
	store.setMessageCache(cache);

	const viewing = store.getActiveConversationId() === streamKey;
	if (viewing) store.setActiveConversationId(conversationId);
	if (viewing) {
		const thread = await fetchConversationThread(conversationId);
		if (thread) {
			store.setMessages(thread.messages);
			store.setMessageCache(flushMessageCache(store.getMessageCache(), conversationId, thread.messages));
		} else if (cache[conversationId]) {
			store.setMessages(cache[conversationId]);
		}
	}

	if (modelId) store.onConversationModelSaved(conversationId, modelId);

	const replaceId = (list: Conversation[]) =>
		list.map((c) => (c.id === streamKey ? { ...c, id: conversationId } : c));

	if (wasProjectCompose && projectId) {
		if (viewing) {
			store.setProjectComposeMode(false);
			store.setActiveProjectId(null);
		}
		const list = await fetchProjectConversations(projectId);
		if (list) store.setProjectConversations(list);
		return;
	}

	if (store.getConversations().some((c) => c.id === streamKey)) {
		const meta = await fetchNewConversationSummary(conversationId);
		const initialTitle = meta?.title?.trim() ?? '';
		const displayTitle = isPlaceholderConversationTitle(initialTitle) ? '' : initialTitle;
		store.setConversations(
			replaceId(store.getConversations()).map((c) =>
				c.id === conversationId
					? {
							...c,
							title: displayTitle || c.title,
							modelId: meta?.modelId ?? modelId
						}
					: c
			)
		);
		if (isPlaceholderConversationTitle(initialTitle)) {
			void pollConversationTitle(conversationId).then((polled) => {
				if (!polled) return;
				patchConversationTitle(store, streamKey, conversationId, polled);
			});
		}
	}
}
