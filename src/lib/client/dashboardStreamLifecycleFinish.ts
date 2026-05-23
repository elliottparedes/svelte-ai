import {
	fetchNewConversationSummary,
	fetchProjectConversations
} from '$lib/client/dashboardRemote';
import {
	flushMessageCache,
	migrateMessageCache,
	patchStreamingSet
} from '$lib/client/dashboardMessageCache';
import type { Conversation } from '$lib/types/dashboard';
import type { DashboardStreamStore, StreamFinishResult } from './dashboardStreamLifecycle.types';

export async function finishDashboardStream(
	store: DashboardStreamStore,
	result: StreamFinishResult
): Promise<void> {
	const { streamKey, conversationId, modelId, wasProjectCompose, projectId } = result;
	store.setStreamingIds(patchStreamingSet(store.getStreamingIds(), streamKey, false));
	if (!conversationId) return;

	let cache = store.getMessageCache();
	if (streamKey !== conversationId) cache = migrateMessageCache(cache, streamKey, conversationId);
	store.setMessageCache(cache);

	const viewing = store.getActiveConversationId() === streamKey;
	if (viewing) store.setActiveConversationId(conversationId);
	if (viewing && cache[conversationId]) store.setMessages(cache[conversationId]);

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
		store.setConversations(
			replaceId(store.getConversations()).map((c) =>
				c.id === conversationId
					? { ...c, title: meta?.title ?? c.title, modelId: meta?.modelId ?? modelId }
					: c
			)
		);
	}
}
