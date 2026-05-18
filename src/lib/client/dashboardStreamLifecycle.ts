import {
	fetchNewConversationSummary,
	fetchProjectConversations
} from '$lib/client/dashboardRemote';
import {
	flushMessageCache,
	migrateMessageCache,
	patchStreamingSet,
	type MessageCache
} from '$lib/client/dashboardMessageCache';
import type { ChatMessage, Conversation } from '$lib/types/dashboard';

export const PENDING_CONV_PREFIX = 'pending:';

export function isPendingConversationId(id: string): boolean {
	return id.startsWith(PENDING_CONV_PREFIX);
}

export type StreamFinishResult = {
	streamKey: string;
	conversationId: string | null;
	modelId: string;
	wasProjectCompose: boolean;
	projectId: string | null;
};

export type DashboardStreamStore = {
	getActiveConversationId: () => string | null;
	getProjectComposeMode: () => boolean;
	getActiveProjectId: () => string | null;
	getConversations: () => Conversation[];
	getProjectConversations: () => Conversation[];
	getMessages: () => ChatMessage[];
	getMessageCache: () => MessageCache;
	getStreamingIds: () => ReadonlySet<string>;
	setMessages: (m: ChatMessage[]) => void;
	setMessageCache: (c: MessageCache) => void;
	setStreamingIds: (s: Set<string>) => void;
	setError: (v: string) => void;
	setActiveConversationId: (id: string | null) => void;
	setProjectComposeMode: (v: boolean) => void;
	setActiveProjectId: (id: string | null) => void;
	setConversations: (c: Conversation[]) => void;
	setProjectConversations: (c: Conversation[]) => void;
	onConversationModelSaved: (id: string, modelId: string) => void;
};

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
	errorMessage: string
): void {
	store.setMessageCache(flushMessageCache(store.getMessageCache(), streamKey, messages));
	if (store.getActiveConversationId() === streamKey) {
		store.setMessages(messages);
		store.setError(errorMessage);
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

	store.onConversationModelSaved(conversationId, modelId);

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

export function failDashboardStream(
	store: DashboardStreamStore,
	streamKey: string,
	errorMessage: string
): void {
	store.setStreamingIds(patchStreamingSet(store.getStreamingIds(), streamKey, false));
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
