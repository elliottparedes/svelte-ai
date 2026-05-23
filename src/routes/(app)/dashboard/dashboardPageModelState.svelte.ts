import type { DashboardPageLoadData, Model } from '$lib/types/dashboard';
import { DEFAULT_CHAT_TOOL_IDS, type ChatToolId } from '$lib/shared/chatToolSystemPrompt';
import type {
	ChatAttachmentInput,
	ChatMessage,
	Conversation,
	Project
} from '$lib/types/dashboard';
import { getDashboardIsMobile } from '$lib/client/dashboardViewport';
import type { MessageCache } from '$lib/client/dashboardMessageCache';
import {
	buildDashboardStreamStore,
	flushActiveMessageCache,
	stampConversationModelLists
} from './dashboardPageModelStreamStore';
import { createDashboardPageModelStateShell } from './dashboardPageModelStateShell';

const DEEP_REASONING_KEY = 'dashboardDeepReasoning';

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
	let isCompacting = $state(false);
	let models = $state<Model[]>([...data.models]);
	let ttsEnabled = $state(data.ttsEnabled);
	let lastRoutedModelId = $state(data.models[0]?.id ?? '');
	let deepReasoningEnabled = $state(
		typeof sessionStorage !== 'undefined' && sessionStorage.getItem(DEEP_REASONING_KEY) === '1'
	);
	let sidebarCollapsed = $state(getDashboardIsMobile());
	let attachments = $state<ChatAttachmentInput[]>([]);
	let enabledToolIds = $state<ChatToolId[]>([...DEFAULT_CHAT_TOOL_IDS]);
	const VOICE_MODE_KEY = 'dashboardVoiceMode';
	let voiceModeEnabled = $state(
		data.ttsEnabled &&
			typeof localStorage !== 'undefined' &&
			localStorage.getItem(VOICE_MODE_KEY) === '1'
	);

	$effect(() => {
		if (!ttsEnabled) return;
		localStorage.setItem(VOICE_MODE_KEY, voiceModeEnabled ? '1' : '0');
	});

	$effect(() => {
		sessionStorage.setItem(DEEP_REASONING_KEY, deepReasoningEnabled ? '1' : '0');
	});

	function pageLoadSyncKey(d: DashboardPageLoadData): string {
		return `${d.ttsEnabled}|${d.models.map((m) => m.id).join('\n')}`;
	}

	let syncedPageLoadKey = pageLoadSyncKey(data);

	function syncPageLoadData(next: DashboardPageLoadData) {
		const key = pageLoadSyncKey(next);
		if (key === syncedPageLoadKey) return;
		syncedPageLoadKey = key;
		models = [...next.models];
		ttsEnabled = next.ttsEnabled;
		if (lastRoutedModelId && !models.some((m) => m.id === lastRoutedModelId)) {
			lastRoutedModelId = models[0]?.id ?? '';
		}
	}

	let immersiveVoiceOpen = $state(false);
	let immersiveGestureToken = $state(0);
	let immersivePhase = $state<import('$lib/shared/immersiveVoice').ImmersiveVoicePhase>('idle');
	let immersiveAudioLevel = $state(0);
	let immersivePcm = $state<import('$lib/client/elevenLabsPcmPlayer').ElevenLabsPcmPlayer | null>(
		null
	);

	let editingProjectPrompt = $state(false);
	let projectPromptValue = $state('');
	function stampConversationModel(id: string, modelId: string) {
		const patched = stampConversationModelLists(conversations, projectConversations, id, modelId);
		conversations = patched.conversations;
		projectConversations = patched.projectConversations;
	}

	const field = <T>(get: () => T, set: (v: T) => void) => ({ get, set });

	const shell = createDashboardPageModelStateShell({
		data,
		getIsActiveStreaming: () =>
			activeConversationId !== null && streamingConversationIds.has(activeConversationId),
		getModels: () => models,
		getTtsEnabled: () => ttsEnabled,
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
				setIsCompacting: (v) => (isCompacting = v),
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
			isCompacting: field(() => isCompacting, (v) => (isCompacting = v)),
			lastRoutedModelId: field(() => lastRoutedModelId, (v) => (lastRoutedModelId = v)),
			deepReasoningEnabled: field(() => deepReasoningEnabled, (v) => (deepReasoningEnabled = v)),
			sidebarCollapsed: field(() => sidebarCollapsed, (v) => (sidebarCollapsed = v)),
			attachments: field(() => attachments, (v) => (attachments = v)),
			enabledToolIds: field(() => enabledToolIds, (v) => (enabledToolIds = v)),
			voiceModeEnabled: field(() => voiceModeEnabled, (v) => (voiceModeEnabled = v)),
			immersiveVoiceOpen: field(() => immersiveVoiceOpen, (v) => (immersiveVoiceOpen = v)),
			immersiveGestureToken: field(() => immersiveGestureToken, (v) => (immersiveGestureToken = v)),
			immersivePhase: field(() => immersivePhase, (v) => (immersivePhase = v)),
			immersiveAudioLevel: field(() => immersiveAudioLevel, (v) => (immersiveAudioLevel = v)),
			immersivePcm: field(() => immersivePcm, (v) => (immersivePcm = v)),
			editingProjectPrompt: field(() => editingProjectPrompt, (v) => (editingProjectPrompt = v)),
			projectPromptValue: field(() => projectPromptValue, (v) => (projectPromptValue = v))
		}
	});

	return Object.assign(shell, { syncPageLoadData });
}
