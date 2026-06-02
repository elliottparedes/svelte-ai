import type {
	ChatAttachment,
	ChatMessage,
	ChatProvider,
	ToolDefinition
} from '../domain/ChatProvider.interface';
import type { MessageRepository } from '../repositories/MessageRepository';
import type { ToolExecutor } from '../infrastructure/ToolExecutor';
import { executeToolLogged } from '../logging/executeToolLogged';
import { logger } from '../logger';
import { appendToolExchangeToHistory } from './conversationToolHistory.util';
import { yieldBudgetExhaustionFinish } from './conversationToolTurnBudget.util';
import type { ConversationProcessEvent } from './conversationProcess.types';
import type { ChatRepository } from '../repositories/ChatRepository';
import type { ConversationTitleService } from './ConversationTitleService';
import type { ConversationSummaryService } from './ConversationSummaryService';
import type { SummaryTurnConfig } from './conversationSummaryTurn.util';
import { MAX_TOOL_TURNS } from './conversationTools.config';
import { parseImageGenerationToolResult, toolResultForLlmHistory } from '$lib/shared/imageGenerationToolResult';
import { yieldGenerateImageSuccess } from './conversationGenerateImageTurn';
import {
	afterToolExecution,
	beforeToolExecution,
	initToolPolicy
} from './conversationToolPolicy';
import type { ChatTurnUsageAccumulator } from './chatTurnUsageAccumulator';
import { usageProcessEvent } from './conversationTurnUsage.util';
import { afterAssistantSaved } from './conversationToolTurnAfterSave.util';
import { streamOneToolTurn } from './conversationToolTurnStream.util';

export async function* runConversationToolTurns(params: {
	userId: string;
	conversationId: string;
	modelLabel: string;
	isNewThread: boolean;
	userPrompt: string;
	chatRepo: ChatRepository;
	titleService: ConversationTitleService | undefined;
	summaryService: ConversationSummaryService | undefined;
	summaryConfig: SummaryTurnConfig | undefined;
	provider: ChatProvider;
	messageRepo: MessageRepository;
	toolExecutor: ToolExecutor;
	initialHistory: ChatMessage[];
	streamAttachments: readonly ChatAttachment[] | undefined;
	toolsForTurn: readonly ToolDefinition[];
	options: Record<string, unknown> | undefined;
	usageAcc: ChatTurnUsageAccumulator;
}): AsyncGenerator<ConversationProcessEvent> {
	if (params.usageAcc.totalCostUsd > 0) yield usageProcessEvent(params.usageAcc);

	let augmentedHistory = params.initialHistory;
	let toolInvocations = 0;
	let turn = 0;
	const toolPolicy = initToolPolicy(params.userPrompt);

	while (turn < MAX_TOOL_TURNS) {
		turn++;
		const stream = streamOneToolTurn({
			provider: params.provider,
			augmentedHistory,
			streamAttachments: params.streamAttachments,
			toolsForTurn: params.toolsForTurn,
			options: params.options,
			usageAcc: params.usageAcc
		});
		let result = await stream.next();
		while (!result.done) {
			yield result.value;
			result = await stream.next();
		}
		const { assistantContent, assistantReasoning, pendingToolCall } = result.value;

		if (!pendingToolCall) {
			const saved = await params.messageRepo.create(
				params.conversationId,
				'assistant',
				assistantContent,
				undefined,
				assistantReasoning.trim() || undefined,
				params.usageAcc.snapshot(),
				params.usageAcc.snapshotExternal()
			);
			logger.info('Assistant reply complete', {
				userId: params.userId,
				conversationId: params.conversationId,
				model: params.modelLabel,
				replyChars: assistantContent.length,
				toolInvocations,
				llmTurn: turn,
				costUsd: params.usageAcc.totalCostUsd,
				llmCostUsd: params.usageAcc.costUsd,
				toolCostUsd: params.usageAcc.toolCostUsd
			});
			yield usageProcessEvent(params.usageAcc);
			yield* afterAssistantSaved({ ...params, assistantContent, assistantMessageId: saved.id });
			return;
		}

		yield { type: 'tool_call' as const, name: pendingToolCall.name, arguments: pendingToolCall.arguments };
		const gate = beforeToolExecution(toolPolicy, pendingToolCall);
		const toolResult = gate.allowed
			? await executeToolLogged(
					params.toolExecutor,
					{ userId: params.userId, conversationId: params.conversationId, llmTurn: turn },
					pendingToolCall,
					params.usageAcc
				)
			: (gate.resultText ?? `Policy: ${pendingToolCall.name} blocked.`);
		if (gate.allowed) toolInvocations++;
		afterToolExecution(toolPolicy, pendingToolCall, toolResult);

		if (pendingToolCall.name === 'generate_image' && parseImageGenerationToolResult(toolResult)?.ok) {
			yield* yieldGenerateImageSuccess({
				userId: params.userId,
				conversationId: params.conversationId,
				isNewThread: params.isNewThread,
				userPrompt: params.userPrompt,
				assistantPreamble: assistantContent,
				result: toolResult,
				pendingToolCall,
				messageRepo: params.messageRepo,
				chatRepo: params.chatRepo,
				titleService: params.titleService,
				summaryService: params.summaryService,
				summaryConfig: params.summaryConfig,
				usageAcc: params.usageAcc
			});
			return;
		}

		yield { type: 'tool_result' as const, name: pendingToolCall.name, result: toolResult };
		augmentedHistory = appendToolExchangeToHistory(
			augmentedHistory,
			pendingToolCall,
			assistantReasoning,
			toolResultForLlmHistory(pendingToolCall.name, toolResult)
		);
	}

	logger.warn('Chat max tool turns reached; synthesizing without tools', {
		userId: params.userId,
		conversationId: params.conversationId,
		toolInvocations,
		maxToolTurns: MAX_TOOL_TURNS
	});
	yield* yieldBudgetExhaustionFinish({
		...params,
		augmentedHistory,
		toolInvocations,
		llmTurn: turn
	});
}
