import type { ChatAttachment, ChatProvider } from '../domain/ChatProvider.interface';
import type { ChatRepository } from '../repositories/ChatRepository';
import type { MessageRepository } from '../repositories/MessageRepository';
import type { ProjectRepository } from '../repositories/ProjectRepository';
import type { ToolExecutor } from '../infrastructure/ToolExecutor';
import { logger } from '../logger';
import { resolveConversationForPrompt } from './conversationResolve.util';
import type { ConversationProcessEvent } from './conversationProcess.types';
import type { VisionRelayService } from './VisionRelayService';
import type { ConversationTitleService } from './ConversationTitleService';
import type { ConversationSummaryService } from './ConversationSummaryService';
import type { SummaryTurnConfig } from './conversationSummaryTurn.util';
import { modelSupportsTools } from '../model/modelCapabilities';
import { runConversationToolTurns } from './conversationToolTurns';
import { toolDefinitionsForOrderedNames } from './conversationToolsPick';
import { prepareConversationTurn } from './conversationTurnPrepare';
import { normalizeHistoryForProvider } from './conversationHistoryForProvider';
import { assembleHistoryWithSummary } from './assembleHistoryWithSummary';
import {
	logRollingSummaryContextApplied,
	logRollingSummaryStaleWatermark
} from './conversationSummaryLog.util';

const HISTORY_FETCH_LIMIT = 2000;

export class ConversationService {
	constructor(
		private readonly provider: ChatProvider,
		private readonly chatRepo: ChatRepository,
		private readonly messageRepo: MessageRepository,
		private readonly toolExecutor: ToolExecutor,
		private readonly projectRepo?: ProjectRepository,
		private readonly visionRelay?: VisionRelayService,
		private readonly titleService?: ConversationTitleService,
		private readonly summaryService?: ConversationSummaryService,
		private readonly summaryConfig?: SummaryTurnConfig
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
		const rawHistory = await this.messageRepo.findByConversationId(convId, HISTORY_FETCH_LIMIT);
		const conv = await this.chatRepo.findById(convId);
		const assembled = assembleHistoryWithSummary(
			conv,
			normalizeHistoryForProvider(rawHistory)
		);
		const history = assembled.history;
		if (assembled.applied) {
			logRollingSummaryContextApplied({
				userId,
				conversationId: convId,
				summaryChars: assembled.summaryChars,
				watermarkMessageId: conv?.summaryThroughMessageId ?? null,
				tailMessageCount: assembled.tailMessageCount,
				rawHistoryCount: assembled.rawHistoryCount
			});
		} else if (assembled.staleWatermark) {
			logRollingSummaryStaleWatermark({
				userId,
				conversationId: convId,
				watermarkMessageId: conv?.summaryThroughMessageId ?? null,
				rawHistoryCount: assembled.rawHistoryCount
			});
		}
		const effectiveProjectId = conv?.projectId ?? projectId ?? null;
		logger.info('Chat message accepted', {
			userId,
			conversationId: convId,
			isNewThread,
			model: effectiveModel ?? 'default',
			projectId: effectiveProjectId,
			promptChars: prompt.length,
			attachmentCount: attachments?.length ?? 0,
			rollingSummaryApplied: assembled.applied
		});

		const toolsCapable = modelSupportsTools(effectiveModel);
		const prepared = await prepareConversationTurn({
			conv,
			history,
			prompt,
			attachments,
			effectiveModel,
			enabledToolNames,
			toolsCapable,
			provider: this.provider,
			projectRepo: this.projectRepo,
			visionRelay: this.visionRelay,
			userId,
			conversationId: convId
		});
		const toolsForTurn =
			!toolsCapable || prepared.effectiveNames.length === 0
				? []
				: toolDefinitionsForOrderedNames(prepared.effectiveNames);

		yield* runConversationToolTurns({
			userId,
			conversationId: convId,
			modelLabel: effectiveModel ?? 'default',
			isNewThread,
			userPrompt: prompt,
			chatRepo: this.chatRepo,
			titleService: this.titleService,
			summaryService: this.summaryService,
			summaryConfig: this.summaryConfig,
			provider: this.provider,
			messageRepo: this.messageRepo,
			toolExecutor: this.toolExecutor,
			initialHistory: prepared.augmentedHistory,
			streamAttachments: prepared.streamAttachments,
			toolsForTurn,
			options: prepared.options
		});
	}
}
