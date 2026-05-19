import type {
	ChatAttachmentInput,
	ChatMessage,
	Conversation,
	Project
} from '$lib/types/dashboard';
import type { ChatToolId } from '$lib/shared/chatToolSystemPrompt';

export type DashboardPageModelStateAccess = {
	getConversations: () => Conversation[];
	getProjects: () => Project[];
	getActiveConversationId: () => string | null;
	getActiveProjectId: () => string | null;
	getProjectComposeMode: () => boolean;
	setProjectComposeMode: (v: boolean) => void;
	getProjectConversations: () => Conversation[];
	getMessages: () => ChatMessage[];
	getInputValue: () => string;
	setInputValue: (v: string) => void;
	getIsStreaming: () => boolean;
	getStreamingConversationIds: () => ReadonlySet<string>;
	getErrorMessage: () => string;
	getSelectedModel: () => string;
	setSelectedModel: (v: string) => void;
	getSidebarCollapsed: () => boolean;
	setSidebarCollapsed: (v: boolean) => void;
	getAttachments: () => ChatAttachmentInput[];
	setAttachments: (v: ChatAttachmentInput[]) => void;
	getEditingProjectPrompt: () => boolean;
	setEditingProjectPrompt: (v: boolean) => void;
	getProjectPromptValue: () => string;
	setProjectPromptValue: (v: string) => void;
	getEnabledToolIds: () => ChatToolId[];
	setEnabledToolIds: (v: ChatToolId[]) => void;
	getVoiceModeEnabled: () => boolean;
	setVoiceModeEnabled: (v: boolean) => void;
	getImmersiveVoiceOpen: () => boolean;
	setImmersiveVoiceOpen: (v: boolean) => void;
	getImmersivePhase: () => import('$lib/shared/immersiveVoice').ImmersiveVoicePhase;
	setImmersivePhase: (p: import('$lib/shared/immersiveVoice').ImmersiveVoicePhase) => void;
	getImmersiveAudioLevel: () => number;
	getTtsEnabled: () => boolean;
	getModelLocked: () => boolean;
};

export type DashboardPageModelHandlers = {
	loadMessages: (conversationId: string) => Promise<void>;
	loadProject: (projectId: string) => Promise<void>;
	saveProjectPrompt: () => Promise<void>;
	startEditingPrompt: () => void;
	startNewChat: () => void;
	startProjectCompose: () => void;
	deleteConversation: (id: string) => Promise<void>;
	renameConversation: (id: string, title: string) => Promise<void>;
	logout: () => Promise<void>;
	sendMessage: (textOverride?: string) => Promise<void>;
	openImmersiveVoice: () => void;
	closeImmersiveVoice: () => void;
};
