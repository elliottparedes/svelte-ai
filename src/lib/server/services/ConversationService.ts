import type { ChatAttachment, ChatMessage, ChatProvider } from '../domain/ChatProvider.interface';
import type { ChatRepository } from '../repositories/ChatRepository';
import type { MessageRepository } from '../repositories/MessageRepository';
import type { ProjectRepository } from '../repositories/ProjectRepository';
import type { ToolExecutor } from '../infrastructure/ToolExecutor';
import { logger } from '../logger';
import { augmentHistory, buildAugmentedPrompt } from './conversationPrompt.util';
import { resolveConversationForPrompt } from './conversationResolve.util';
import { buildSystemMessagesForTurn } from './conversationSystemMessages';
import { maybeApplyVisionRelay, VISION_RELAY_SYSTEM_HINT } from './conversationVisionRelay.util';
import type { ConversationProcessEvent } from './conversationProcess.types';
import { resolveToolingForTurn } from './conversationToolTurnConfig';
import type { VisionRelayService } from './VisionRelayService';
import type { ConversationTitleService } from './ConversationTitleService';
import { modelSupportsTools, modelOpenRouterModalities } from '../model/modelCapabilities';
import { runConversationToolTurns } from './conversationToolTurns';
import { estimateMessagesTokens } from '$lib/shared/estimateContextTokens';
import { trimChatMessagesByTokenBudget } from './conversationHistoryTrim';
import { toolDefinitionsForOrderedNames } from './conversationToolsPick';

const HISTORY_FETCH_LIMIT = 2000;
const FALLBACK_PROMPT_TOKEN_BUDGET = 28_000;

export class ConversationService {
	constructor(
		private readonly provider: ChatProvider,
		private readonly chatRepo: ChatRepository,
		private readonly messageRepo: MessageRepository,
		private readonly toolExecutor: ToolExecutor,
		private readonly projectRepo?: ProjectRepository,
		private readonly visionRelay?: VisionRelayService,
		private readonly titleService?: ConversationTitleService
	) {}

	async *processPrompt(
		userId: string,
		conversationId: string | undefined,
		prompt: string,
		attachments?: readonly ChatAttachment[],
		model?: string,
		projectId?: string,
		enabledToolNames?: readonly string[]
	): AsyncGenerator<ConversationProcessEvent, void, unknown> {
		const isNewThread = !conversationId;
		const { convId, effectiveModel } = await resolveConversationForPrompt(
			this.chatRepo,
			userId,
			conversationId,
			projectId,
			prompt,
			model
		);

		const attachmentSummary =
			attachments
				?.map((a) => {
					const label =
						a.type === 'image' ? 'Image' : a.type === 'file' ? 'PDF' : 'File';
					return `[${label}: ${a.name}]`;
				})
				.join(' ') ?? '';
		const storedContent = attachmentSummary ? `${prompt}\n${attachmentSummary}` : prompt;
		await this.messageRepo.create(convId, 'user', storedContent);
		const history = await this.messageRepo.findByConversationId(convId, HISTORY_FETCH_LIMIT);

		const conv = await this.chatRepo.findById(convId);
		const effectiveProjectId = conv?.projectId ?? projectId ?? null;
		logger.info('Chat message accepted', {
			userId,
			conversationId: convId,
			isNewThread,
			model: effectiveModel ?? 'default',
			projectId: effectiveProjectId,
			promptChars: prompt.length,
			attachmentCount: attachments?.length ?? 0
		});

		const augmentedPromptBase = buildAugmentedPrompt(prompt, attachments);
		const imageAttachments = attachments?.filter((a) => a.type === 'image' && a.dataUrl);
		const { augmentedPrompt, relayApplied } = await maybeApplyVisionRelay({
			userId,
			conversationId: convId,
			augmentedPrompt: augmentedPromptBase,
			imageAttachments,
			model: effectiveModel,
			visionRelay: this.visionRelay
		});

		const multimodal = attachments?.filter(
			(a) =>
				(a.type === 'image' && a.dataUrl) || (a.type === 'file' && a.dataUrl)
		);
		let streamAttachments: readonly ChatAttachment[] | undefined;
		if (relayApplied) {
			streamAttachments = multimodal?.filter((a) => a.type === 'file');
			if (!streamAttachments?.length) streamAttachments = undefined;
		} else {
			streamAttachments = multimodal?.length ? multimodal : undefined;
		}

		const toolsCapable = modelSupportsTools(effectiveModel);
		const { effectiveNames, systemContentForMessages } = resolveToolingForTurn({
			toolsCapable,
			relayApplied,
			enabledToolNames
		});
		const systemMessages = await buildSystemMessagesForTurn(
			conv,
			this.projectRepo,
			systemContentForMessages
		);

		const relaySystem: ChatMessage[] = relayApplied
			? [{ id: 'system-vision-relay', role: 'system', content: VISION_RELAY_SYSTEM_HINT, createdAt: new Date() }]
			: [];

		let augmentedHistory = augmentHistory(history, augmentedPrompt);
		const prefixMessages = [...systemMessages, ...relaySystem];
		const catalogBudget = await this.provider.getPromptTokenBudget?.(effectiveModel ?? '');
		const promptBudget =
			catalogBudget != null ? catalogBudget : FALLBACK_PROMPT_TOKEN_BUDGET;
		const historyBudget = Math.max(1024, promptBudget - estimateMessagesTokens(prefixMessages));
		augmentedHistory = trimChatMessagesByTokenBudget(augmentedHistory, historyBudget);
		augmentedHistory = [...prefixMessages, ...augmentedHistory];

		const orMods = modelOpenRouterModalities(effectiveModel);
		const options: Record<string, unknown> | undefined =
			effectiveModel || orMods?.length
				? {
						...(effectiveModel ? { model: effectiveModel } : {}),
						...(orMods?.length ? { modalities: orMods } : {})
					}
				: undefined;
		const toolsForTurn =
			!toolsCapable || effectiveNames.length === 0 ? [] : toolDefinitionsForOrderedNames(effectiveNames);

		yield* runConversationToolTurns({
			userId,
			conversationId: convId,
			modelLabel: effectiveModel ?? 'default',
			isNewThread,
			userPrompt: prompt,
			chatRepo: this.chatRepo,
			titleService: this.titleService,
			provider: this.provider,
			messageRepo: this.messageRepo,
			toolExecutor: this.toolExecutor,
			initialHistory: augmentedHistory,
			streamAttachments,
			toolsForTurn,
			options
		});
	}
}
