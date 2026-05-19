import type { Conversation } from '$lib/types/dashboard';
import { fetchProjectConversations, saveProjectPromptApi } from '$lib/client/dashboardRemote';
import { flushMessageCache } from '$lib/client/dashboardMessageCache';
import { loadConversationThread } from './dashboardPageModelThread.js';
import type { DashboardPageModelStateShell } from './dashboardPageModelStateShell';

export function createDashboardNavActions(state: DashboardPageModelStateShell) {
	const { data } = state;

	async function loadMessages(conversationId: string) {
		state.flushActiveToCache();
		state.activeConversationId = conversationId;
		state.activeProjectId = null;
		state.projectComposeMode = false;
		state.errorMessage = '';
		state.messages = state.messageCache[conversationId] ?? [];
		const cached =
			state.conversations.find((c) => c.id === conversationId) ??
			state.projectConversations.find((c) => c.id === conversationId);
		if (cached?.modelId) state.selectedModel = state.pickModel(cached.modelId);
		if (state.streamingConversationIds.has(conversationId)) return;
		await loadConversationThread({
			conversationId,
			models: data.models,
			defaultModelId: data.defaultModelId,
			conversations: state.conversations,
			projectConversations: state.projectConversations,
			onMessages: (m) => {
				state.messageCache = flushMessageCache(state.messageCache, conversationId, m);
				if (state.activeConversationId === conversationId) state.messages = m;
			},
			onSelectedModel: (id) => {
				if (state.activeConversationId === conversationId) state.selectedModel = id;
			},
			onListsPatched: (lists) => {
				state.conversations = lists.conversations;
				state.projectConversations = lists.projectConversations;
			}
		});
	}

	async function loadProject(projectId: string) {
		state.flushActiveToCache();
		state.activeProjectId = projectId;
		state.activeConversationId = null;
		state.projectComposeMode = false;
		state.messages = [];
		state.editingProjectPrompt = false;
		const list = await fetchProjectConversations(projectId);
		state.projectConversations = list ?? [];
	}

	async function saveProjectPrompt() {
		if (!state.activeProjectId) return;
		const ok = await saveProjectPromptApi(state.activeProjectId, state.projectPromptValue);
		if (ok) {
			state.projects = state.projects.map((p) =>
				p.id === state.activeProjectId ? { ...p, systemPrompt: state.projectPromptValue } : p
			);
			state.editingProjectPrompt = false;
		}
	}

	function startEditingPrompt() {
		state.projectPromptValue =
			state.projects.find((p) => p.id === state.activeProjectId)?.systemPrompt ?? '';
		state.editingProjectPrompt = true;
	}

	function startNewChat() {
		state.flushActiveToCache();
		state.activeConversationId = state.activeProjectId = null;
		state.projectComposeMode = false;
		state.messages = [];
		state.errorMessage = '';
		state.selectedModel = state.pickModel(data.defaultModelId);
	}

	function startProjectCompose() {
		state.flushActiveToCache();
		state.activeConversationId = null;
		state.projectComposeMode = true;
		state.messages = [];
		state.errorMessage = '';
		state.selectedModel = state.pickModel(data.defaultModelId);
	}

	return {
		loadMessages,
		loadProject,
		saveProjectPrompt,
		startEditingPrompt,
		startNewChat,
		startProjectCompose
	};
}
