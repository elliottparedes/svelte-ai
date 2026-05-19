import { sendDashboardChatMessage } from '$lib/client/dashboardSendChat';
import type { ChatAttachmentInput, ChatMessage, Model } from '$lib/types/dashboard';
import type { ChatToolId } from '$lib/shared/chatToolSystemPrompt';
import type { DashboardStreamStore } from '$lib/client/dashboardStreamLifecycle';
import { beginDashboardStream } from '$lib/client/dashboardStreamLifecycle';
import { immersiveConfigFromPcm } from './dashboardImmersiveVoice';
import type { DashboardPageModelStateShell } from './dashboardPageModelStateShell';

function immersiveDeps(state: DashboardPageModelStateShell) {
	if (!state.immersiveVoiceOpen || !state.immersivePcm) return undefined;
	return immersiveConfigFromPcm(
		state.immersivePcm,
		(phase) => (state.immersivePhase = phase),
		(level) => (state.immersiveAudioLevel = level),
		() => state.streamingConversationIds.size > 0
	);
}

export async function runDashboardSendMessage(p: {
	state: DashboardPageModelStateShell;
	models: Model[];
	text: string;
	attachments: ChatAttachmentInput[];
	selectedModel: string;
	enabledToolIds: ChatToolId[];
	streamStore: DashboardStreamStore;
	isConversationStreaming: (id: string) => boolean;
	activeConversationId: string | null;
	getMessagesForKey: (streamKey: string) => ChatMessage[];
	setInputValue: (v: string) => void;
	setAttachments: (a: ChatAttachmentInput[]) => void;
	onStreamMessages: (streamKey: string, messages: ChatMessage[], errorMessage: string) => void;
	onStreamTitle: (streamKey: string, conversationId: string, title: string) => void;
	onStreamFinish: Parameters<typeof sendDashboardChatMessage>[0]['onStreamFinish'];
	onStreamFailed: (streamKey: string, errorMessage: string) => void;
}): Promise<void> {
	if (p.activeConversationId && p.isConversationStreaming(p.activeConversationId)) return;
	const streamKey = beginDashboardStream(p.streamStore, p.selectedModel);
	const immersiveOpen = p.state.immersiveVoiceOpen;

	await sendDashboardChatMessage({
		streamKey,
		getMessages: () => p.getMessagesForKey(streamKey),
		text: p.text,
		attachments: p.attachments,
		getProjectComposeMode: () => p.state.projectComposeMode,
		getActiveProjectId: () => p.state.activeProjectId,
		getSelectedModel: () => p.selectedModel,
		getModelSupportsTools: () => {
			const m = p.models.find((x) => x.id === p.selectedModel);
			return m?.supportsTools !== false;
		},
		getEnabledToolNames: () => p.enabledToolIds,
		setInputValue: p.setInputValue,
		setAttachments: p.setAttachments,
		onStreamMessages: p.onStreamMessages,
		onStreamTitle: p.onStreamTitle,
		onStreamFinish: p.onStreamFinish,
		onStreamFailed: p.onStreamFailed,
		voiceModeEnabled: p.state.voiceModeEnabled || immersiveOpen,
		immersive: immersiveDeps(p.state)
	});
}
