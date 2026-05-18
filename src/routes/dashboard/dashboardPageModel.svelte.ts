import type { DashboardPageLoadData } from '$lib/types/dashboard';
import { createDashboardPageModelState } from './dashboardPageModelState.svelte';
import { createDashboardPageModelActions } from './dashboardPageModelActions';
import { createDashboardPageModelView } from './dashboardPageModelView';

export function createDashboardPageModel(data: DashboardPageLoadData) {
	const state = createDashboardPageModelState(data);
	const actions = createDashboardPageModelActions(state);

	return createDashboardPageModelView(
		{
			getConversations: () => state.conversations,
			getProjects: () => state.projects,
			getActiveConversationId: () => state.activeConversationId,
			getActiveProjectId: () => state.activeProjectId,
			getProjectComposeMode: () => state.projectComposeMode,
			setProjectComposeMode: (v) => (state.projectComposeMode = v),
			getProjectConversations: () => state.projectConversations,
			getMessages: () => state.messages,
			getInputValue: () => state.inputValue,
			setInputValue: (v) => (state.inputValue = v),
			getIsStreaming: () => state.isActiveStreaming,
			getStreamingConversationIds: () => state.streamingConversationIds,
			getErrorMessage: () => state.errorMessage,
			getSelectedModel: () => state.selectedModel,
			setSelectedModel: (v) => (state.selectedModel = v),
			getSidebarCollapsed: () => state.sidebarCollapsed,
			setSidebarCollapsed: (v) => (state.sidebarCollapsed = v),
			getAttachments: () => state.attachments,
			setAttachments: (v) => (state.attachments = v),
			getEditingProjectPrompt: () => state.editingProjectPrompt,
			setEditingProjectPrompt: (v) => (state.editingProjectPrompt = v),
			getProjectPromptValue: () => state.projectPromptValue,
			setProjectPromptValue: (v) => (state.projectPromptValue = v),
			getEnabledToolIds: () => state.enabledToolIds,
			setEnabledToolIds: (v) => (state.enabledToolIds = [...v]),
			getModelLocked: () => state.modelLocked
		},
		actions,
		data.models,
		data.modelGroups
	);
}
