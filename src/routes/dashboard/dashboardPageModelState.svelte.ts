import type { DashboardPageLoadData } from '$lib/types/dashboard';
import { ALL_CHAT_TOOL_IDS, type ChatToolId } from '$lib/shared/chatToolSystemPrompt';
import type {
	ChatAttachmentInput,
	ChatMessage,
	Conversation,
	Project
} from '$lib/types/dashboard';
import { pickDashboardModelId } from '$lib/client/dashboardPickModel';
import type { MessageCache } from '$lib/client/dashboardMessageCache';
import {
	buildDashboardStreamStore,
	flushActiveMessageCache,
	stampConversationModelLists
} from './dashboardPageModelStreamStore';
import { createDashboardPageModelStateShell } from './dashboardPageModelStateShell';

export function createDashboardPageModelState(data: DashboardPageLoadData) {
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
	let selectedModel = $state(
		data.models.some((m) => m.id === data.defaultModelId)
			? data.defaultModelId
			: (data.models[0]?.id ?? '')
	);
	let sidebarCollapsed = $state(false);
	let attachments = $state<ChatAttachmentInput[]>([]);
	let enabledToolIds = $state<ChatToolId[]>([...ALL_CHAT_TOOL_IDS]);
	let editingProjectPrompt = $state(false);
	let projectPromptValue = $state('');
	const modelLocked = $derived(messages.length > 0);
	const isActiveStreaming = $derived(
		activeConversationId !== null && streamingConversationIds.has(activeConversationId)
	);

	function stampConversationModel(id: string, modelId: string) {
		const patched = stampConversationModelLists(conversations, projectConversations, id, modelId);
		conversations = patched.conversations;
		projectConversations = patched.projectConversations;
	}

	const field = <T>(get: () => T, set: (v: T) => void) => ({ get, set });

	return createDashboardPageModelStateShell({
		data,
		modelLocked,
		isActiveStreaming,
		pickModel: (modelId) => pickDashboardModelId(data.models, modelId, data.defaultModelId),
		flushActiveToCache: () => {
			messageCache = flushActiveMessageCache(messageCache, activeConversationId, messages);
		},
		streamStore: () =>
			buildDashboardStreamStore({
				getActiveConversationId: () => activeConversationId,
				setActiveConversationId: (id) => (activeConversationId = id),
				getProjectComposeMode: () => projectComposeMode,
				setProjectComposeMode: (v) => (projectComposeMode = v),
				getActiveProjectId: () => activeProjectId,
				setActiveProjectId: (v) => (activeProjectId = v),
				getConversations: () => conversations,
				setConversations: (c) => (conversations = c),
				getProjectConversations: () => projectConversations,
				setProjectConversations: (c) => (projectConversations = c),
				getMessages: () => messages,
				setMessages: (m) => (messages = m),
				getMessageCache: () => messageCache,
				setMessageCache: (c) => (messageCache = c),
				getStreamingIds: () => streamingConversationIds,
				setStreamingIds: (s) => (streamingConversationIds = s),
				setError: (v) => (errorMessage = v),
				onConversationModelSaved: stampConversationModel
			}),
		fields: {
			conversations: field(() => conversations, (v) => (conversations = v)),
			projects: field(() => projects, (v) => (projects = v)),
			activeConversationId: field(() => activeConversationId, (v) => (activeConversationId = v)),
			activeProjectId: field(() => activeProjectId, (v) => (activeProjectId = v)),
			projectComposeMode: field(() => projectComposeMode, (v) => (projectComposeMode = v)),
			projectConversations: field(() => projectConversations, (v) => (projectConversations = v)),
			messages: field(() => messages, (v) => (messages = v)),
			messageCache: field(() => messageCache, (v) => (messageCache = v)),
			streamingConversationIds: field(
				() => streamingConversationIds,
				(v) => (streamingConversationIds = v)
			),
			inputValue: field(() => inputValue, (v) => (inputValue = v)),
			errorMessage: field(() => errorMessage, (v) => (errorMessage = v)),
			selectedModel: field(() => selectedModel, (v) => (selectedModel = v)),
			sidebarCollapsed: field(() => sidebarCollapsed, (v) => (sidebarCollapsed = v)),
			attachments: field(() => attachments, (v) => (attachments = v)),
			enabledToolIds: field(() => enabledToolIds, (v) => (enabledToolIds = v)),
			editingProjectPrompt: field(() => editingProjectPrompt, (v) => (editingProjectPrompt = v)),
			projectPromptValue: field(() => projectPromptValue, (v) => (projectPromptValue = v))
		}
	});
}
