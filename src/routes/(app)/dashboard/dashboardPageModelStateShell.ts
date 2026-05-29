import type {
	ChatAttachmentInput,
	ChatMessage,
	Conversation,
	DashboardPageLoadData,
	Model,
	Project
} from '$lib/types/dashboard';
import type { ChatToolId } from '$lib/shared/chatToolSystemPrompt';
import type { MessageCache } from '$lib/client/dashboardMessageCache';
import type { DashboardStreamStore } from '$lib/client/dashboardStreamLifecycle';

type Field<T> = { get: () => T; set: (v: T) => void };

export type DashboardPageModelStateShell = {
	readonly data: DashboardPageLoadData;
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
	isCompacting: boolean;
	lastRoutedModelId: string;
	deepReasoningEnabled: boolean;
	sidebarCollapsed: boolean;
	attachments: ChatAttachmentInput[];
	enabledToolIds: ChatToolId[];
	voiceModeEnabled: boolean;
	immersiveVoiceOpen: boolean;
	immersiveGestureToken: number;
	immersivePhase: import('$lib/shared/immersiveVoice').ImmersiveVoicePhase;
	immersiveAudioLevel: number;
	immersivePcm: import('$lib/client/elevenLabsPcmPlayer').ElevenLabsPcmPlayer | null;
	editingProjectPrompt: boolean;
	projectPromptValue: string;
	get isActiveStreaming(): boolean;
	getModels: () => Model[];
	getTtsEnabled: () => boolean;
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
	getData: () => DashboardPageLoadData;
	getIsActiveStreaming: () => boolean;
	getModels: () => Model[];
	getTtsEnabled: () => boolean;
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
		isCompacting: Field<boolean>;
		lastRoutedModelId: Field<string>;
		deepReasoningEnabled: Field<boolean>;
		sidebarCollapsed: Field<boolean>;
		attachments: Field<ChatAttachmentInput[]>;
		enabledToolIds: Field<ChatToolId[]>;
		voiceModeEnabled: Field<boolean>;
		immersiveVoiceOpen: Field<boolean>;
		immersiveGestureToken: Field<number>;
		immersivePhase: Field<import('$lib/shared/immersiveVoice').ImmersiveVoicePhase>;
		immersiveAudioLevel: Field<number>;
		immersivePcm: Field<import('$lib/client/elevenLabsPcmPlayer').ElevenLabsPcmPlayer | null>;
		editingProjectPrompt: Field<boolean>;
		projectPromptValue: Field<string>;
	};
}): DashboardPageModelStateShell {
	const shell = {
		get data() {
			return p.getData();
		},
		get isActiveStreaming() {
			return p.getIsActiveStreaming();
		},
		getModels: p.getModels,
		getTtsEnabled: p.getTtsEnabled,
		flushActiveToCache: p.flushActiveToCache,
		streamStore: p.streamStore
	} as DashboardPageModelStateShell;

	for (const [key, field] of Object.entries(p.fields) as [keyof typeof p.fields, Field<unknown>][]) {
		bindField(shell, key, field);
	}

	return shell;
}
