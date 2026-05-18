import { goto } from '$app/navigation';
import type { ChatAttachmentInput, ChatMessage, Conversation, DashboardPageLoadData, Project } from '$lib/types/dashboard';
import { ALL_CHAT_TOOL_IDS, type ChatToolId } from '$lib/shared/chatToolSystemPrompt';
import { patchConversationModelId } from '$lib/client/dashboardConversationModel';
import { pickDashboardModelId } from '$lib/client/dashboardPickModel';
import {
	deleteConversationApi,
	fetchProjectConversations,
	renameConversationApi,
	saveProjectPromptApi
} from '$lib/client/dashboardRemote';
import { flushMessageCache, type MessageCache } from '$lib/client/dashboardMessageCache';
import {
	applyDashboardStreamTitle,
	failDashboardStream,
	finishDashboardStream,
	updateDashboardStreamMessages,
	type DashboardStreamStore
} from '$lib/client/dashboardStreamLifecycle';
import { loadConversationThread } from './dashboardPageModelThread.js';
import { runDashboardSendMessage } from './dashboardPageModelSend.js';
import { createDashboardPageModelView } from './dashboardPageModelView.js';

export function createDashboardPageModel(data: DashboardPageLoadData) {
	let conversations = $state<Conversation[]>([...data.conversations]);
	let projects = $state<Project[]>([...data.projects]);
	let activeConversationId = $state<string | null>(null);
	let activeProjectId = $state<string | null>(null);
	let projectComposeMode = $state(false);
	let projectConversations = $state<Conversation[]>([]);
	let messages = $state<ChatMessage[]>([]);
	let messageCache = $state<MessageCache>({});
	let streamingConversationIds = $state<Set<string>>(new Set());
	let inputValue = $state('');
	let errorMessage = $state('');
	let selectedModel = $state(data.models.some((m) => m.id === data.defaultModelId) ? data.defaultModelId : (data.models[0]?.id ?? ''));
	let sidebarCollapsed = $state(false);
	let attachments = $state<ChatAttachmentInput[]>([]);
	let enabledToolIds = $state<ChatToolId[]>([...ALL_CHAT_TOOL_IDS]);
	let editingProjectPrompt = $state(false);
	let projectPromptValue = $state('');
	const modelLocked = $derived(messages.length > 0);
	const isActiveStreaming = $derived(
		activeConversationId !== null && streamingConversationIds.has(activeConversationId)
	);
	function streamStore(): DashboardStreamStore {
		return {
			getActiveConversationId: () => activeConversationId,
			getProjectComposeMode: () => projectComposeMode,
			getActiveProjectId: () => activeProjectId,
			getConversations: () => conversations,
			getProjectConversations: () => projectConversations,
			getMessages: () => messages,
			getMessageCache: () => messageCache,
			getStreamingIds: () => streamingConversationIds,
			setMessages: (m) => (messages = m),
			setMessageCache: (c) => (messageCache = c),
			setStreamingIds: (s) => (streamingConversationIds = s),
			setError: (v) => (errorMessage = v),
			setActiveConversationId: (id) => (activeConversationId = id),
			setProjectComposeMode: (v) => (projectComposeMode = v),
			setActiveProjectId: (v) => (activeProjectId = v),
			setConversations: (c) => (conversations = c),
			setProjectConversations: (c) => (projectConversations = c),
			onConversationModelSaved: stampConversationModel
		};
	}
	function pickModel(modelId: string | null | undefined) {
		return pickDashboardModelId(data.models, modelId, data.defaultModelId);
	}
	function stampConversationModel(id: string, modelId: string) {
		const patched = patchConversationModelId(conversations, projectConversations, id, modelId);
		conversations = patched.conversations;
		projectConversations = patched.projectConversations;
	}
	function flushActiveToCache() {
		messageCache = flushMessageCache(messageCache, activeConversationId, messages);
	}
	async function loadMessages(conversationId: string) {
		flushActiveToCache();
		activeConversationId = conversationId;
		activeProjectId = null;
		projectComposeMode = false;
		errorMessage = '';
		if (messageCache[conversationId]) {
			messages = messageCache[conversationId];
		} else {
			messages = [];
		}
		const cached = conversations.find((c) => c.id === conversationId) ?? projectConversations.find((c) => c.id === conversationId);
		if (cached?.modelId) selectedModel = pickModel(cached.modelId);
		if (streamingConversationIds.has(conversationId)) return;
		await loadConversationThread({
			conversationId,
			models: data.models,
			defaultModelId: data.defaultModelId,
			conversations,
			projectConversations,
			onMessages: (m) => {
				messageCache = flushMessageCache(messageCache, conversationId, m);
				if (activeConversationId === conversationId) messages = m;
			},
			onSelectedModel: (id) => {
				if (activeConversationId === conversationId) selectedModel = id;
			},
			onListsPatched: (lists) => {
				conversations = lists.conversations;
				projectConversations = lists.projectConversations;
			}
		});
	}
	async function loadProject(projectId: string) {
		flushActiveToCache();
		activeProjectId = projectId;
		activeConversationId = null;
		projectComposeMode = false;
		messages = [];
		editingProjectPrompt = false;
		const list = await fetchProjectConversations(projectId);
		projectConversations = list ?? [];
	}
	async function saveProjectPrompt() {
		if (!activeProjectId) return;
		const ok = await saveProjectPromptApi(activeProjectId, projectPromptValue);
		if (ok) {
			projects = projects.map((p) =>
				p.id === activeProjectId ? { ...p, systemPrompt: projectPromptValue } : p
			);
			editingProjectPrompt = false;
		}
	}
	function startEditingPrompt() {
		projectPromptValue = projects.find((p) => p.id === activeProjectId)?.systemPrompt ?? '';
		editingProjectPrompt = true;
	}
	function startNewChat() {
		flushActiveToCache();
		activeConversationId = activeProjectId = null;
		projectComposeMode = false;
		messages = [];
		errorMessage = '';
		selectedModel = pickModel(data.defaultModelId);
	}
	function startProjectCompose() {
		flushActiveToCache();
		activeConversationId = null;
		projectComposeMode = true;
		messages = [];
		errorMessage = '';
		selectedModel = pickModel(data.defaultModelId);
	}
	async function deleteConversation(id: string) {
		if (!(await deleteConversationApi(id))) return;
		conversations = conversations.filter((c) => c.id !== id);
		projectConversations = projectConversations.filter((c) => c.id !== id);
		const nextCache = { ...messageCache };
		delete nextCache[id];
		messageCache = nextCache;
		streamingConversationIds = new Set([...streamingConversationIds].filter((x) => x !== id));
		if (activeConversationId === id) {
			activeConversationId = null;
			messages = [];
		}
	}
	async function renameConversation(id: string, title: string) {
		if (!(await renameConversationApi(id, title))) return;
		conversations = conversations.map((c) => (c.id === id ? { ...c, title } : c));
		projectConversations = projectConversations.map((c) => (c.id === id ? { ...c, title } : c));
	}
	async function logout() {
		await fetch('/api/v1/auth/logout', { method: 'POST' });
		goto('/login');
	}
	async function sendMessage() {
		const text = inputValue.trim();
		if (!text && attachments.length === 0) return;
		await runDashboardSendMessage({
			models: data.models,
			text,
			attachments: [...attachments],
			selectedModel,
			enabledToolIds,
			streamStore: streamStore(),
			isConversationStreaming: (id) => streamingConversationIds.has(id),
			activeConversationId,
			getMessagesForKey: (key) => messageCache[key] ?? (activeConversationId === key ? messages : []),
			setInputValue: (v) => (inputValue = v),
			setAttachments: (a) => (attachments = a),
			getProjectComposeMode: () => projectComposeMode,
			getActiveProjectId: () => activeProjectId,
			onStreamMessages: (key, m, err) => updateDashboardStreamMessages(streamStore(), key, m, err),
			onStreamTitle: (key, conversationId, title) =>
				applyDashboardStreamTitle(streamStore(), key, conversationId, title),
			onStreamFinish: (result) => finishDashboardStream(streamStore(), result),
			onStreamFailed: (key, err) => failDashboardStream(streamStore(), key, err)
		});
	}
	return createDashboardPageModelView(
		{
			getConversations: () => conversations,
			getProjects: () => projects,
			getActiveConversationId: () => activeConversationId,
			getActiveProjectId: () => activeProjectId,
			getProjectComposeMode: () => projectComposeMode,
			setProjectComposeMode: (v) => (projectComposeMode = v),
			getProjectConversations: () => projectConversations,
			getMessages: () => messages,
			getInputValue: () => inputValue,
			setInputValue: (v) => (inputValue = v),
			getIsStreaming: () => isActiveStreaming,
			getStreamingConversationIds: () => streamingConversationIds,
			getErrorMessage: () => errorMessage,
			getSelectedModel: () => selectedModel,
			setSelectedModel: (v) => (selectedModel = v),
			getSidebarCollapsed: () => sidebarCollapsed,
			setSidebarCollapsed: (v) => (sidebarCollapsed = v),
			getAttachments: () => attachments,
			setAttachments: (v) => (attachments = v),
			getEditingProjectPrompt: () => editingProjectPrompt,
			setEditingProjectPrompt: (v) => (editingProjectPrompt = v),
			getProjectPromptValue: () => projectPromptValue,
			setProjectPromptValue: (v) => (projectPromptValue = v),
			getEnabledToolIds: () => enabledToolIds,
			setEnabledToolIds: (v) => (enabledToolIds = [...v]),
			getModelLocked: () => modelLocked
		},
		{
			loadMessages,
			loadProject,
			saveProjectPrompt,
			startEditingPrompt,
			startNewChat,
			startProjectCompose,
			deleteConversation,
			renameConversation,
			logout,
			sendMessage
		},
		data.models,
		data.modelGroups
	);
}
