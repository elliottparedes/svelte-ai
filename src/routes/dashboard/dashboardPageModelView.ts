import type {
	ChatAttachmentInput,
	ChatMessage,
	Conversation,
	Model,
	ModelProviderGroup,
	Project
} from '$lib/types/dashboard';

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
};

export type DashboardPageModelHandlers = {
	loadMessages: (conversationId: string) => Promise<void>;
	loadProject: (projectId: string) => Promise<void>;
	saveProjectPrompt: () => Promise<void>;
	startEditingPrompt: () => void;
	startNewChat: () => void;
	deleteConversation: (id: string) => Promise<void>;
	renameConversation: (id: string, title: string) => Promise<void>;
	logout: () => Promise<void>;
	sendMessage: () => Promise<void>;
};

/** Bindings/read surface for +page.svelte (getters avoid state_referenced_locally). */
export function createDashboardPageModelView(
	s: DashboardPageModelStateAccess,
	actions: DashboardPageModelHandlers,
	models: Model[],
	modelGroups: ModelProviderGroup[]
) {
	return {
		get conversations() {
			return s.getConversations();
		},
		get projects() {
			return s.getProjects();
		},
		get activeConversationId() {
			return s.getActiveConversationId();
		},
		get activeProjectId() {
			return s.getActiveProjectId();
		},
		get projectComposeMode() {
			return s.getProjectComposeMode();
		},
		set projectComposeMode(v: boolean) {
			s.setProjectComposeMode(v);
		},
		get projectConversations() {
			return s.getProjectConversations();
		},
		get messages() {
			return s.getMessages();
		},
		get inputValue() {
			return s.getInputValue();
		},
		set inputValue(v: string) {
			s.setInputValue(v);
		},
		get isStreaming() {
			return s.getIsStreaming();
		},
		get errorMessage() {
			return s.getErrorMessage();
		},
		get selectedModel() {
			return s.getSelectedModel();
		},
		set selectedModel(v: string) {
			s.setSelectedModel(v);
		},
		get sidebarCollapsed() {
			return s.getSidebarCollapsed();
		},
		set sidebarCollapsed(v: boolean) {
			s.setSidebarCollapsed(v);
		},
		get attachments() {
			return s.getAttachments();
		},
		set attachments(v: ChatAttachmentInput[]) {
			s.setAttachments(v);
		},
		get editingProjectPrompt() {
			return s.getEditingProjectPrompt();
		},
		set editingProjectPrompt(v: boolean) {
			s.setEditingProjectPrompt(v);
		},
		get projectPromptValue() {
			return s.getProjectPromptValue();
		},
		set projectPromptValue(v: string) {
			s.setProjectPromptValue(v);
		},
		loadMessages: actions.loadMessages,
		loadProject: actions.loadProject,
		saveProjectPrompt: actions.saveProjectPrompt,
		startEditingPrompt: actions.startEditingPrompt,
		startNewChat: actions.startNewChat,
		deleteConversation: actions.deleteConversation,
		renameConversation: actions.renameConversation,
		logout: actions.logout,
		sendMessage: actions.sendMessage,
		models,
		modelGroups
	};
}
