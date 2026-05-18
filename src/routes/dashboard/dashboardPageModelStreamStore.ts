import { patchConversationModelId } from '$lib/client/dashboardConversationModel';
import { flushMessageCache, type MessageCache } from '$lib/client/dashboardMessageCache';
import type { DashboardStreamStore } from '$lib/client/dashboardStreamLifecycle';
import type { ChatMessage, Conversation } from '$lib/types/dashboard';

export type DashboardPageModelStreamRefs = {
	getActiveConversationId: () => string | null;
	setActiveConversationId: (id: string | null) => void;
	getProjectComposeMode: () => boolean;
	setProjectComposeMode: (v: boolean) => void;
	getActiveProjectId: () => string | null;
	setActiveProjectId: (v: string | null) => void;
	getConversations: () => Conversation[];
	setConversations: (c: Conversation[]) => void;
	getProjectConversations: () => Conversation[];
	setProjectConversations: (c: Conversation[]) => void;
	getMessages: () => ChatMessage[];
	setMessages: (m: ChatMessage[]) => void;
	getMessageCache: () => MessageCache;
	setMessageCache: (c: MessageCache) => void;
	getStreamingIds: () => Set<string>;
	setStreamingIds: (s: Set<string>) => void;
	setError: (v: string) => void;
	onConversationModelSaved: (id: string, modelId: string) => void;
};

export function buildDashboardStreamStore(refs: DashboardPageModelStreamRefs): DashboardStreamStore {
	return {
		getActiveConversationId: refs.getActiveConversationId,
		getProjectComposeMode: refs.getProjectComposeMode,
		getActiveProjectId: refs.getActiveProjectId,
		getConversations: refs.getConversations,
		getProjectConversations: refs.getProjectConversations,
		getMessages: refs.getMessages,
		getMessageCache: refs.getMessageCache,
		getStreamingIds: refs.getStreamingIds,
		setMessages: refs.setMessages,
		setMessageCache: refs.setMessageCache,
		setStreamingIds: refs.setStreamingIds,
		setError: refs.setError,
		setActiveConversationId: refs.setActiveConversationId,
		setProjectComposeMode: refs.setProjectComposeMode,
		setActiveProjectId: refs.setActiveProjectId,
		setConversations: refs.setConversations,
		setProjectConversations: refs.setProjectConversations,
		onConversationModelSaved: refs.onConversationModelSaved
	};
}

export function stampConversationModelLists(
	conversations: Conversation[],
	projectConversations: Conversation[],
	id: string,
	modelId: string
): { conversations: Conversation[]; projectConversations: Conversation[] } {
	return patchConversationModelId(conversations, projectConversations, id, modelId);
}

export function flushActiveMessageCache(
	cache: MessageCache,
	activeId: string | null,
	messages: ChatMessage[]
): MessageCache {
	return flushMessageCache(cache, activeId, messages);
}
