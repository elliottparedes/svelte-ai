import type { ChatAttachment, ChatMessage, ChatProvider } from '../domain/ChatProvider.interface';
import type { Conversation } from '../domain/Conversation.types';
import type { ProjectRepository } from '../repositories/ProjectRepository';
import type { VisionRelayService } from './VisionRelayService';
import { augmentHistory, buildAugmentedPrompt } from './conversationPrompt.util';
import { buildSystemMessagesForTurn } from './conversationSystemMessages';
import { maybeApplyVisionRelay, VISION_RELAY_SYSTEM_HINT } from './conversationVisionRelay.util';
import { resolveToolingForTurn } from './conversationToolTurnConfig';
import { estimateMessagesTokens } from '$lib/shared/estimateContextTokens';
import { trimChatMessagesByTokenBudget } from './conversationHistoryTrim';
import { modelOpenRouterModalities } from '../model/modelCapabilities';

const FALLBACK_PROMPT_TOKEN_BUDGET = 28_000;

export type PreparedConversationTurn = {
	augmentedHistory: ChatMessage[];
	streamAttachments: readonly ChatAttachment[] | undefined;
	options: Record<string, unknown> | undefined;
	effectiveNames: string[];
};

export async function prepareConversationTurn(p: {
	conv: Conversation | null;
	history: ChatMessage[];
	prompt: string;
	attachments?: readonly ChatAttachment[];
	effectiveModel: string | undefined;
	enabledToolNames?: readonly string[];
	toolsCapable: boolean;
	provider: ChatProvider;
	projectRepo?: ProjectRepository;
	visionRelay?: VisionRelayService;
	userId: string;
	conversationId: string;
}): Promise<PreparedConversationTurn> {
	const augmentedPromptBase = buildAugmentedPrompt(p.prompt, p.attachments);
	const imageAttachments = p.attachments?.filter((a) => a.type === 'image' && a.dataUrl);
	const { augmentedPrompt, relayApplied } = await maybeApplyVisionRelay({
		userId: p.userId,
		conversationId: p.conversationId,
		augmentedPrompt: augmentedPromptBase,
		imageAttachments,
		model: p.effectiveModel,
		visionRelay: p.visionRelay
	});

	const multimodal = p.attachments?.filter(
		(a) => (a.type === 'image' && a.dataUrl) || (a.type === 'file' && a.dataUrl)
	);
	let streamAttachments: readonly ChatAttachment[] | undefined;
	if (relayApplied) {
		streamAttachments = multimodal?.filter((a) => a.type === 'file');
		if (!streamAttachments?.length) streamAttachments = undefined;
	} else {
		streamAttachments = multimodal?.length ? multimodal : undefined;
	}

	const { effectiveNames, systemContentForMessages } = resolveToolingForTurn({
		toolsCapable: p.toolsCapable,
		relayApplied,
		enabledToolNames: p.enabledToolNames
	});
	const systemMessages = await buildSystemMessagesForTurn(
		p.conv,
		p.projectRepo,
		systemContentForMessages
	);

	const relaySystem: ChatMessage[] = relayApplied
		? [{ id: 'system-vision-relay', role: 'system', content: VISION_RELAY_SYSTEM_HINT, createdAt: new Date() }]
		: [];

	let augmentedHistory = augmentHistory(p.history, augmentedPrompt);
	const prefixMessages = [...systemMessages, ...relaySystem];
	const catalogBudget = await p.provider.getPromptTokenBudget?.(p.effectiveModel ?? '');
	const promptBudget = catalogBudget != null ? catalogBudget : FALLBACK_PROMPT_TOKEN_BUDGET;
	const historyBudget = Math.max(1024, promptBudget - estimateMessagesTokens(prefixMessages));
	augmentedHistory = trimChatMessagesByTokenBudget(augmentedHistory, historyBudget);
	augmentedHistory = [...prefixMessages, ...augmentedHistory];

	const orMods = modelOpenRouterModalities(p.effectiveModel);
	const options: Record<string, unknown> | undefined =
		p.effectiveModel || orMods?.length
			? {
					...(p.effectiveModel ? { model: p.effectiveModel } : {}),
					...(orMods?.length ? { modalities: orMods } : {})
				}
			: undefined;

	return { augmentedHistory, streamAttachments, options, effectiveNames };
}
