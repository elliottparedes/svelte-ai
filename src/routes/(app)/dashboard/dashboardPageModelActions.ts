import { goto } from '$app/navigation';
import type { Conversation } from '$lib/types/dashboard';
import { deleteConversationApi, renameConversationApi } from '$lib/client/dashboardRemote';
import {
	applyDashboardStreamTitle,
	failDashboardStream,
	finishDashboardStream,
	updateDashboardStreamMessages
} from '$lib/client/dashboardStreamLifecycle';
import { runDashboardSendMessage } from './dashboardPageModelSend.js';
import { createDashboardNavActions } from './dashboardPageModelNavActions';
import type { DashboardPageModelStateShell } from './dashboardPageModelStateShell';

export function createDashboardPageModelActions(state: DashboardPageModelStateShell) {
	const nav = createDashboardNavActions(state);

	async function deleteConversation(id: string) {
		if (!(await deleteConversationApi(id))) return;
		state.conversations = state.conversations.filter((c) => c.id !== id);
		state.projectConversations = state.projectConversations.filter((c) => c.id !== id);
		const nextCache = { ...state.messageCache };
		delete nextCache[id];
		state.messageCache = nextCache;
		state.streamingConversationIds = new Set(
			[...state.streamingConversationIds].filter((x) => x !== id)
		);
		if (state.activeConversationId === id) {
			state.activeConversationId = null;
			state.messages = [];
		}
	}

	async function renameConversation(id: string, title: string) {
		if (!(await renameConversationApi(id, title))) return;
		const patch = (list: Conversation[]) =>
			list.map((c) => (c.id === id ? { ...c, title } : c));
		state.conversations = patch(state.conversations);
		state.projectConversations = patch(state.projectConversations);
	}

	async function logout() {
		await fetch('/api/v1/auth/logout', { method: 'POST' });
		goto('/login');
	}

	async function sendMessage() {
		const text = state.inputValue.trim();
		if (!text && state.attachments.length === 0) return;
		const store = state.streamStore();
		await runDashboardSendMessage({
			models: state.data.models,
			text,
			attachments: [...state.attachments],
			selectedModel: state.selectedModel,
			enabledToolIds: state.enabledToolIds,
			streamStore: store,
			isConversationStreaming: (id) => state.streamingConversationIds.has(id),
			activeConversationId: state.activeConversationId,
			getMessagesForKey: (key) =>
				state.messageCache[key] ?? (state.activeConversationId === key ? state.messages : []),
			setInputValue: (v) => (state.inputValue = v),
			setAttachments: (a) => (state.attachments = a),
			getProjectComposeMode: () => state.projectComposeMode,
			getActiveProjectId: () => state.activeProjectId,
			onStreamMessages: (key, m, err) => updateDashboardStreamMessages(store, key, m, err),
			onStreamTitle: (key, conversationId, title) =>
				applyDashboardStreamTitle(store, key, conversationId, title),
			onStreamFinish: (result) => finishDashboardStream(store, result),
			onStreamFailed: (key, err) => failDashboardStream(store, key, err)
		});
	}

	return { ...nav, deleteConversation, renameConversation, logout, sendMessage };
}
