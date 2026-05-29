import type { ChatAttachmentInput } from '$lib/types/dashboard';
import type { ChatToolId } from '$lib/shared/chatToolSystemPrompt';
import type {
	DashboardPageModelHandlers,
	DashboardPageModelStateAccess
} from './dashboardPageModelView.types';

export type {
	DashboardPageModelHandlers,
	DashboardPageModelStateAccess
} from './dashboardPageModelView.types';

/** Bindings/read surface for +page.svelte (getters avoid state_referenced_locally). */
export function createDashboardPageModelView(
	s: DashboardPageModelStateAccess,
	actions: DashboardPageModelHandlers,
	getModels: () => import('$lib/types/dashboard').Model[],
	syncPageLoadData: (next: import('$lib/types/dashboard').DashboardPageLoadData) => void,
	getPageLoadData: () => import('$lib/types/dashboard').DashboardPageLoadData
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
		get streamingConversationIds() {
			return s.getStreamingConversationIds();
		},
		get errorMessage() {
			return s.getErrorMessage();
		},
		get isCompacting() {
			return s.getIsCompacting();
		},
		get lastRoutedModelId() {
			return s.getLastRoutedModelId();
		},
		set lastRoutedModelId(v: string) {
			s.setLastRoutedModelId(v);
		},
		get deepReasoningEnabled() {
			return s.getDeepReasoningEnabled();
		},
		set deepReasoningEnabled(v: boolean) {
			s.setDeepReasoningEnabled(v);
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
		get enabledToolIds() {
			return s.getEnabledToolIds();
		},
		set enabledToolIds(v: ChatToolId[]) {
			s.setEnabledToolIds(v);
		},
		get voiceModeEnabled() {
			return s.getVoiceModeEnabled();
		},
		set voiceModeEnabled(v: boolean) {
			s.setVoiceModeEnabled(v);
		},
		get ttsEnabled() {
			return s.getTtsEnabled();
		},
		get immersiveVoiceOpen() {
			return s.getImmersiveVoiceOpen();
		},
		get immersiveGestureToken() {
			return s.getImmersiveGestureToken();
		},
		get immersivePhase() {
			return s.getImmersivePhase();
		},
		set immersivePhase(p: import('$lib/shared/immersiveVoice').ImmersiveVoicePhase) {
			s.setImmersivePhase(p);
		},
		get immersiveAudioLevel() {
			return s.getImmersiveAudioLevel();
		},
		loadMessages: actions.loadMessages,
		loadProject: actions.loadProject,
		saveProjectPrompt: actions.saveProjectPrompt,
		startEditingPrompt: actions.startEditingPrompt,
		startNewChat: actions.startNewChat,
		startProjectCompose: actions.startProjectCompose,
		deleteConversation: actions.deleteConversation,
		renameConversation: actions.renameConversation,
		logout: actions.logout,
		sendMessage: actions.sendMessage,
		openImmersiveVoice: actions.openImmersiveVoice,
		closeImmersiveVoice: actions.closeImmersiveVoice,
		get models() {
			return getModels();
		},
		get modelGroups() {
			return getPageLoadData().modelGroups;
		},
		get usesAutoRouting() {
			return getPageLoadData().usesAutoRouting;
		},
		get chatQuota() {
			return getPageLoadData().chatQuota;
		},
		syncPageLoadData
	};
}
