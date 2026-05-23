import { fetchProjectConversations, saveProjectPromptApi } from '$lib/client/dashboardRemote';
import { flushMessageCache } from '$lib/client/dashboardMessageCache';
import { patchConversationSummaryMeta } from '$lib/client/dashboardConversationSummary';
import { loadConversationThread } from './dashboardPageModelThread.js';
import type { Conversation } from '$lib/types/dashboard';
import type { DashboardPageModelStateShell } from './dashboardPageModelStateShell';

export function createDashboardNavActions(state: DashboardPageModelStateShell) {
	async function loadMessages(conversationId: string) {
		state.flushActiveToCache();
		state.activeConversationId = conversationId;
		state.activeProjectId = null;
		state.projectComposeMode = false;
		state.errorMessage = '';
		state.isCompacting = false;
		state.messages = state.messageCache[conversationId] ?? [];
		const cached =
			state.conversations.find((c) => c.id === conversationId) ??
			state.projectConversations.find((c) => c.id === conversationId);
		if (cached?.modelId) state.lastRoutedModelId = cached.modelId;
		if (state.streamingConversationIds.has(conversationId)) return;
		await loadConversationThread({
			conversationId,
			conversations: state.conversations,
			projectConversations: state.projectConversations,
			onMessages: (m) => {
				state.messageCache = flushMessageCache(state.messageCache, conversationId, m);
				if (state.activeConversationId === conversationId) state.messages = m;
			},
			onLastRoutedModel: (id) => {
				if (state.activeConversationId === conversationId) state.lastRoutedModelId = id;
			},
			onSummaryMeta: (watermark, summaryChars) => {
				const patch = (list: Conversation[]) =>
					watermark
						? patchConversationSummaryMeta(list, conversationId, watermark, summaryChars)
						: list;
				state.conversations = patch(state.conversations);
				state.projectConversations = patch(state.projectConversations);
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
	}

	function startProjectCompose() {
		state.flushActiveToCache();
		state.projectComposeMode = true;
		state.activeConversationId = null;
		state.messages = [];
		state.errorMessage = '';
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
