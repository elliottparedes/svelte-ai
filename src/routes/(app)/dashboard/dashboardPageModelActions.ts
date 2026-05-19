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
import { createImmersiveSendBundle } from './dashboardImmersiveVoice.js';
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

	async function sendMessage(textOverride?: string) {
		const text = (textOverride ?? state.inputValue).trim();
		if (!text && state.attachments.length === 0) return;
		const store = state.streamStore();
		await runDashboardSendMessage({
			state,
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
			onStreamMessages: (key, m, err) => updateDashboardStreamMessages(store, key, m, err),
			onStreamTitle: (key, conversationId, title) =>
				applyDashboardStreamTitle(store, key, conversationId, title),
			onStreamFinish: async (result) => {
				await finishDashboardStream(store, result);
				if (state.immersiveVoiceOpen && state.immersivePhase !== 'error') {
					state.immersivePhase = 'idle';
				}
			},
			onStreamFailed: (key, err) => {
				failDashboardStream(store, key, err);
				if (state.immersiveVoiceOpen) state.immersivePhase = 'error';
			}
		});
	}

	function openImmersiveVoice() {
		if (!state.data.ttsEnabled) return;
		state.voiceModeEnabled = true;
		state.immersiveVoiceOpen = true;
		state.immersivePhase = 'idle';
		state.immersiveAudioLevel = 0;
		const bundle = createImmersiveSendBundle(
			(phase) => (state.immersivePhase = phase),
			(level) => (state.immersiveAudioLevel = level),
			() => state.streamingConversationIds.size > 0
		);
		state.immersivePcm = bundle.pcm;
		void bundle.pcm.unlock();
	}

	function closeImmersiveVoice() {
		state.immersiveVoiceOpen = false;
		state.immersivePcm?.stop();
		state.immersivePcm = null;
		state.immersivePhase = 'idle';
		state.immersiveAudioLevel = 0;
	}

	return {
		...nav,
		deleteConversation,
		renameConversation,
		logout,
		sendMessage,
		openImmersiveVoice,
		closeImmersiveVoice
	};
}
