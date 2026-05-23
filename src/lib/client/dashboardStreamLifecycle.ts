import {
	flushMessageCache,
	patchStreamingSet
} from '$lib/client/dashboardMessageCache';
import { patchConversationSummaryMeta } from '$lib/client/dashboardConversationSummary';
import type { ChatMessage, Conversation } from '$lib/types/dashboard';
import {
	isPendingConversationId,
	PENDING_CONV_PREFIX,
	type DashboardStreamStore,
	type StreamFinishResult
} from './dashboardStreamLifecycle.types';
export {
	isPendingConversationId,
	PENDING_CONV_PREFIX,
	type DashboardStreamStore,
	type StreamFinishResult
} from './dashboardStreamLifecycle.types';
export { finishDashboardStream } from './dashboardStreamLifecycleFinish';

export function beginDashboardStream(store: DashboardStreamStore, modelId: string): string {
	const existing = store.getActiveConversationId();
	if (existing) {
		store.setStreamingIds(patchStreamingSet(store.getStreamingIds(), existing, true));
		return existing;
	}
	const tempId = `${PENDING_CONV_PREFIX}${crypto.randomUUID()}`;
	const placeholder: Conversation = {
		id: tempId,
		title: '',
		createdAt: new Date(),
		modelId,
		projectId: store.getProjectComposeMode() ? store.getActiveProjectId() : null
	};
	if (store.getProjectComposeMode() && store.getActiveProjectId()) {
		store.setProjectConversations([placeholder, ...store.getProjectConversations()]);
	} else {
		store.setConversations([placeholder, ...store.getConversations()]);
	}
	store.setActiveConversationId(tempId);
	store.setStreamingIds(patchStreamingSet(store.getStreamingIds(), tempId, true));
	return tempId;
}

export function updateDashboardStreamMessages(
	store: DashboardStreamStore,
	streamKey: string,
	messages: ChatMessage[],
	errorMessage: string,
	isCompacting = false
): void {
	store.setMessageCache(flushMessageCache(store.getMessageCache(), streamKey, messages));
	if (store.getActiveConversationId() === streamKey) {
		store.setMessages(messages);
		store.setError(errorMessage);
		store.setIsCompacting(isCompacting);
	}
}

export function applyDashboardStreamSummaryDone(
	store: DashboardStreamStore,
	streamKey: string,
	conversationId: string,
	summaryThroughMessageId: string,
	summaryChars: number
): void {
	const patch = (list: Conversation[]) =>
		list.map((c) =>
			c.id === conversationId || c.id === streamKey
				? { ...c, summaryThroughMessageId, summaryChars }
				: c
		);
	store.setConversations(patch(store.getConversations()));
	store.setProjectConversations(patch(store.getProjectConversations()));
	if (store.getActiveConversationId() === streamKey || store.getActiveConversationId() === conversationId) {
		store.setIsCompacting(false);
	}
}

export function applyDashboardStreamTitle(
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

export function failDashboardStream(
	store: DashboardStreamStore,
	streamKey: string,
	errorMessage: string
): void {
	store.setStreamingIds(patchStreamingSet(store.getStreamingIds(), streamKey, false));
	store.setIsCompacting(false);
	if (store.getActiveConversationId() === streamKey) store.setError(errorMessage);
	if (isPendingConversationId(streamKey)) {
		store.setConversations(store.getConversations().filter((c) => c.id !== streamKey));
		store.setProjectConversations(store.getProjectConversations().filter((c) => c.id !== streamKey));
		if (store.getActiveConversationId() === streamKey) {
			store.setActiveConversationId(null);
			store.setMessages([]);
		}
	}
}
