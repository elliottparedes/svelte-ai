import type {
	ChatAttachmentInput,
	ChatMessage,
	Conversation,
	DashboardPageLoadData,
	Project
} from '$lib/types/dashboard';
import type { ChatToolId } from '$lib/shared/chatToolSystemPrompt';
import type { MessageCache } from '$lib/client/dashboardMessageCache';
import type { DashboardStreamStore } from '$lib/client/dashboardStreamLifecycle';

type Field<T> = { get: () => T; set: (v: T) => void };

export type DashboardPageModelStateShell = {
	data: DashboardPageLoadData;
	conversations: Conversation[];
	projects: Project[];
	activeConversationId: string | null;
	activeProjectId: string | null;
	projectComposeMode: boolean;
	projectConversations: Conversation[];
	messages: ChatMessage[];
	messageCache: MessageCache;
	streamingConversationIds: Set<string>;
	inputValue: string;
	errorMessage: string;
	selectedModel: string;
	sidebarCollapsed: boolean;
	attachments: ChatAttachmentInput[];
	enabledToolIds: ChatToolId[];
	editingProjectPrompt: boolean;
	projectPromptValue: string;
	readonly modelLocked: boolean;
	readonly isActiveStreaming: boolean;
	pickModel: (modelId: string | null | undefined) => string;
	flushActiveToCache: () => void;
	streamStore: () => DashboardStreamStore;
};

function bindField<T>(target: object, key: string, field: Field<T>): void {
	Object.defineProperty(target, key, {
		get: () => field.get(),
		set: (v: T) => field.set(v),
		enumerable: true,
		configurable: true
	});
}

export function createDashboardPageModelStateShell(p: {
	data: DashboardPageLoadData;
	modelLocked: boolean;
	isActiveStreaming: boolean;
	pickModel: (modelId: string | null | undefined) => string;
	flushActiveToCache: () => void;
	streamStore: () => DashboardStreamStore;
	fields: {
		conversations: Field<Conversation[]>;
		projects: Field<Project[]>;
		activeConversationId: Field<string | null>;
		activeProjectId: Field<string | null>;
		projectComposeMode: Field<boolean>;
		projectConversations: Field<Conversation[]>;
		messages: Field<ChatMessage[]>;
		messageCache: Field<MessageCache>;
		streamingConversationIds: Field<Set<string>>;
		inputValue: Field<string>;
		errorMessage: Field<string>;
		selectedModel: Field<string>;
		sidebarCollapsed: Field<boolean>;
		attachments: Field<ChatAttachmentInput[]>;
		enabledToolIds: Field<ChatToolId[]>;
		editingProjectPrompt: Field<boolean>;
		projectPromptValue: Field<string>;
	};
}): DashboardPageModelStateShell {
	const shell = {
		data: p.data,
		modelLocked: p.modelLocked,
		isActiveStreaming: p.isActiveStreaming,
		pickModel: p.pickModel,
		flushActiveToCache: p.flushActiveToCache,
		streamStore: p.streamStore
	} as DashboardPageModelStateShell;

	for (const [key, field] of Object.entries(p.fields) as [keyof typeof p.fields, Field<unknown>][]) {
		bindField(shell, key, field);
	}

	return shell;
}
