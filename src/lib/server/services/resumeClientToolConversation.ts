import type { ChatProvider } from '../domain/ChatProvider.interface';
import type { ChatRepository } from '../repositories/ChatRepository';
import type { MessageRepository } from '../repositories/MessageRepository';
import type { ProjectRepository } from '../repositories/ProjectRepository';
import type { ConversationTurnRepository } from '../repositories/ConversationTurnRepository';
import type { ToolExecutor } from '../infrastructure/ToolExecutor';
import type { ConversationTitleService } from './ConversationTitleService';
import type { ConversationSummaryService } from './ConversationSummaryService';
import type { SummaryTurnConfig } from './conversationSummaryTurn.util';
import type { ChatTurnUsageAccumulator } from './chatTurnUsageAccumulator';
import { DomainError } from '../domain/DomainError';
import type { ConversationTurnAuditState } from './conversationTurnAudit';
import { prepareResumedToolTurn } from './resumeClientToolTurn';
import { runConversationToolTurns } from './conversationToolTurns';

export async function* resumeClientToolConversation(params: {
	userId: string;
	conversationId: string;
	modelId: string;
	turnId: string;
	toolCallId: string;
	toolName: string;
	toolArguments: Record<string, unknown>;
	toolResult: string;
	enabledToolNamesJson?: string | null;
	sandboxFiles: readonly { name: string; content: string }[];
	browserTimeZone?: string;
	chatRepo: ChatRepository;
	messageRepo: MessageRepository;
	projectRepo?: ProjectRepository;
	provider: ChatProvider;
	toolExecutor: ToolExecutor;
	titleService?: ConversationTitleService;
	summaryService?: ConversationSummaryService;
	summaryConfig?: SummaryTurnConfig;
	usageAcc: ChatTurnUsageAccumulator;
	turnRepo?: ConversationTurnRepository;
	turnAudit?: ConversationTurnAuditState;
}): AsyncGenerator<import('./conversationProcess.types').ConversationProcessEvent> {
	const conv = await params.chatRepo.findById(params.conversationId);
	if (!conv || conv.userId !== params.userId) throw new DomainError('Conversation not found', 404);
	if (params.turnAudit) {
		params.turnAudit.turnId = params.turnId;
		params.turnAudit.toolCalls = [
			{
				toolCallId: params.toolCallId,
				name: params.toolName,
				arguments: params.toolArguments,
				result: params.toolResult
			}
		];
	}
	await params.messageRepo.create(params.conversationId, 'tool', params.toolResult, {
		turnId: params.turnId,
		toolCallId: params.toolCallId,
		toolName: params.toolName,
		toolArgumentsJson: JSON.stringify(params.toolArguments)
	});
	const prepared = await prepareResumedToolTurn({
		conversation: conv,
		messageRepo: params.messageRepo,
		projectRepo: params.projectRepo,
		provider: params.provider,
		modelId: params.modelId,
		enabledToolNamesJson: params.enabledToolNamesJson,
		browserTimeZone: params.browserTimeZone
	});
	yield {
		type: 'tool_result',
		toolCallId: params.toolCallId,
		name: params.toolName,
		result: params.toolResult
	};
	yield* runConversationToolTurns({
		userId: params.userId,
		conversationId: params.conversationId,
		modelLabel: params.modelId,
		isNewThread: false,
		userPrompt: '',
		chatRepo: params.chatRepo,
		titleService: params.titleService,
		summaryService: params.summaryService,
		summaryConfig: params.summaryConfig,
		provider: params.provider,
		messageRepo: params.messageRepo,
		toolExecutor: params.toolExecutor,
		initialHistory: prepared.augmentedHistory,
		streamAttachments: undefined,
		toolsForTurn: prepared.toolsForTurn,
		sandboxFiles: params.sandboxFiles,
		options: prepared.options,
		usageAcc: params.usageAcc,
		turnId: params.turnId,
		turnAudit: params.turnAudit,
		turnRepo: params.turnRepo
	});
}
