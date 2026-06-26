import type { ToolCall } from '../domain/ChatProvider.interface';
import type { MessageRepository } from '../repositories/MessageRepository';
import type { ChatRepository } from '../repositories/ChatRepository';
import type { ConversationTitleService } from './ConversationTitleService';
import type { ConversationSummaryService } from './ConversationSummaryService';
import type { SummaryTurnConfig } from './conversationSummaryTurn.util';
import type { ConversationProcessEvent } from './conversationProcess.types';
import { completeNewThreadTitleJob } from './conversationTitleBackground';
import { extendRollingSummaryAfterReply } from './conversationSummaryTurn.util';
import {
	assistantContentForImageGeneration,
	IMAGE_GENERATION_REPLY,
	toolResultForLlmHistory
} from '$lib/shared/imageGenerationToolResult';
import type { ChatTurnUsageAccumulator } from './chatTurnUsageAccumulator';
import { usageProcessEvent } from './conversationTurnUsage.util';

export async function* yieldGenerateImageSuccess(params: {
	userId: string;
	conversationId: string;
	isNewThread: boolean;
	userPrompt: string;
	assistantPreamble: string;
	result: string;
	pendingToolCall: ToolCall;
	messageRepo: MessageRepository;
	chatRepo: ChatRepository;
	titleService: ConversationTitleService | undefined;
	summaryService?: ConversationSummaryService;
	summaryConfig?: SummaryTurnConfig;
	usageAcc: ChatTurnUsageAccumulator;
	turnId?: string;
	turnAudit?: import('./conversationTurnAudit').ConversationTurnAuditState;
	turnRepo?: import('../repositories/ConversationTurnRepository').ConversationTurnRepository;
}): AsyncGenerator<ConversationProcessEvent> {
	const imageBlock = assistantContentForImageGeneration(params.result);
	const preamble = params.assistantPreamble.trim();
	const stored = preamble ? `${preamble}\n\n${imageBlock}` : imageBlock;
	const saved = await params.messageRepo.create(
		params.conversationId,
		'assistant',
		stored,
		{
			turnId: params.turnId,
			turnSequence: 1000,
			usage: params.usageAcc.snapshot(),
			toolUsage: params.usageAcc.snapshotExternal()
		}
	);
	if (params.turnAudit) {
		params.turnAudit.assistantMessageId = saved.id;
		params.turnAudit.assistantChars = stored.length;
	}
	if (params.turnRepo && params.turnId) {
		const snapshot = params.usageAcc.snapshot();
		await params.turnRepo.finalize(params.turnId, {
			assistantMessageId: saved.id,
			responseChars: stored.length,
			llmCostUsd: snapshot.costUsd,
			toolCostUsd: params.usageAcc.toolCostUsd,
			totalCostUsd: params.usageAcc.totalCostUsd,
			promptTokens: snapshot.promptTokens,
			completionTokens: snapshot.completionTokens,
			toolCallsJson: params.turnAudit?.toolCalls.length ? JSON.stringify(params.turnAudit.toolCalls) : null,
			status: 'completed'
		});
	}
	yield usageProcessEvent(params.usageAcc);
	const sseToolResult = toolResultForLlmHistory('generate_image', params.result);
	yield {
		type: 'tool_result' as const,
		toolCallId: params.pendingToolCall.id,
		name: 'generate_image',
		result: sseToolResult
	};
	yield { type: 'chunk' as const, content: IMAGE_GENERATION_REPLY };
	yield { type: 'done' as const, conversationId: params.conversationId };
	if (params.isNewThread) {
		completeNewThreadTitleJob(
			params.conversationId,
			stored,
			saved.id,
			params.usageAcc
		);
	}
	yield* extendRollingSummaryAfterReply({
		conversationId: params.conversationId,
		userId: params.userId,
		chatRepo: params.chatRepo,
		messageRepo: params.messageRepo,
		summaryService: params.summaryService,
		config: params.summaryConfig,
		usageAcc: params.usageAcc,
		assistantMessageId: saved.id
	});
}
