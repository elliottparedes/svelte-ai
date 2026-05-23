import type { MessageCache } from '$lib/client/dashboardMessageCache';
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
	setIsCompacting: (v: boolean) => void;
	setActiveConversationId: (id: string | null) => void;
	setProjectComposeMode: (v: boolean) => void;
	setActiveProjectId: (id: string | null) => void;
	setConversations: (c: Conversation[]) => void;
	setProjectConversations: (c: Conversation[]) => void;
	onConversationModelSaved: (id: string, modelId: string) => void;
};
