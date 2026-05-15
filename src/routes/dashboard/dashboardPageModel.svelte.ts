import { goto } from '$app/navigation';
import type { ChatAttachmentInput, ChatMessage, Conversation, DashboardPageLoadData, Project } from '$lib/types/dashboard';
import {
	deleteConversationApi,
	fetchConversationMessages,
	fetchProjectConversations,
	renameConversationApi,
	saveProjectPromptApi
} from '$lib/client/dashboardRemote';
import { sendDashboardChatMessage } from '$lib/client/dashboardSendChat';
import { createDashboardPageModelView } from './dashboardPageModelView.js';

export function createDashboardPageModel(data: DashboardPageLoadData) {
	let conversations = $state<Conversation[]>([...data.conversations]);
	let projects = $state<Project[]>([...data.projects]);
	let activeConversationId = $state<string | null>(null);
	let activeProjectId = $state<string | null>(null);
	let projectComposeMode = $state(false);
	let projectConversations = $state<Conversation[]>([]);
	let messages = $state<ChatMessage[]>([]);
	let inputValue = $state('');
	let isStreaming = $state(false);
	let errorMessage = $state('');
	let selectedModel = $state(
		data.models.some((m) => m.id === data.defaultModelId) ? data.defaultModelId : (data.models[0]?.id ?? '')
	);
	let sidebarCollapsed = $state(false);
	let attachments = $state<ChatAttachmentInput[]>([]);
	let editingProjectPrompt = $state(false);
	let projectPromptValue = $state('');
	async function loadMessages(conversationId: string) {
		activeConversationId = conversationId;
		activeProjectId = null;
		projectComposeMode = false;
		messages = [];
		const list = await fetchConversationMessages(conversationId);
		if (list) messages = list;
	}
	async function loadProject(projectId: string) {
		activeProjectId = projectId;
		activeConversationId = null;
		projectComposeMode = false;
		messages = [];
		editingProjectPrompt = false;
		const list = await fetchProjectConversations(projectId);
		if (list) projectConversations = list;
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
		activeConversationId = null;
		activeProjectId = null;
		projectComposeMode = false;
		messages = [];
		errorMessage = '';
	}
	async function deleteConversation(id: string) {
		if (!(await deleteConversationApi(id))) return;
		conversations = conversations.filter((c) => c.id !== id);
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
		if (isStreaming) return;
		const text = inputValue.trim();
		if (!text && attachments.length === 0) return;
		await sendDashboardChatMessage({
			getMessages: () => messages,
			text,
			attachments: [...attachments],
			getActiveConversationId: () => activeConversationId,
			getProjectComposeMode: () => projectComposeMode,
			getActiveProjectId: () => activeProjectId,
			getSelectedModel: () => selectedModel,
			getConversations: () => conversations,
			getProjectConversations: () => projectConversations,
			setInputValue: (v) => (inputValue = v),
			setAttachments: (a) => (attachments = a),
			setStreaming: (v) => (isStreaming = v),
			setError: (v) => (errorMessage = v),
			setMessages: (m) => (messages = m),
			setActiveConversationId: (id) => (activeConversationId = id),
			setProjectComposeMode: (v) => (projectComposeMode = v),
			setActiveProjectId: (v) => (activeProjectId = v),
			setConversations: (c) => (conversations = c),
			setProjectConversations: (c) => (projectConversations = c)
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
			getIsStreaming: () => isStreaming,
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
			setProjectPromptValue: (v) => (projectPromptValue = v)
		},
		{
			loadMessages,
			loadProject,
			saveProjectPrompt,
			startEditingPrompt,
			startNewChat,
			deleteConversation,
			renameConversation,
			logout,
			sendMessage
		},
		data.models
	);
}
