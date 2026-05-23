import type {
	ChatAttachment,
	ChatMessage,
	ChatProvider,
	ToolCall,
	ToolDefinition
} from '../domain/ChatProvider.interface';
import type { MessageRepository } from '../repositories/MessageRepository';
import type { ToolExecutor } from '../infrastructure/ToolExecutor';
import { executeToolLogged } from '../logging/executeToolLogged';
import { logger } from '../logger';
import { appendToolExchangeToHistory } from './conversationToolHistory.util';
import { eachBudgetExhaustionChunk } from './conversationMaxToolsFinish';
import type { ConversationProcessEvent } from './conversationProcess.types';
import type { ChatRepository } from '../repositories/ChatRepository';
import type { ConversationTitleService } from './ConversationTitleService';
import type { ConversationSummaryService } from './ConversationSummaryService';
import {
	extendRollingSummaryAfterReply,
	type SummaryTurnConfig
} from './conversationSummaryTurn.util';
import { yieldNewThreadTitleEvents } from './conversationTitleTurn.util';
import { MAX_TOOL_TURNS } from './conversationTools.config';
import { parseImageGenerationToolResult, toolResultForLlmHistory } from '$lib/shared/imageGenerationToolResult';
import { yieldGenerateImageSuccess } from './conversationGenerateImageTurn';
import { appendReasoningStream } from '$lib/shared/appendReasoningStream';

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
}): AsyncGenerator<ConversationProcessEvent> {
	let augmentedHistory = params.initialHistory;
	let toolInvocations = 0;
	let turn = 0;

	while (turn < MAX_TOOL_TURNS) {
		turn++;
		let assistantContent = '';
		let assistantReasoning = '';
		let pendingToolCall: ToolCall | undefined;

		for await (const chunk of params.provider.streamResponse(
			augmentedHistory,
			params.streamAttachments,
			params.toolsForTurn,
			params.options
		)) {
			if (chunk.toolCall) {
				pendingToolCall = chunk.toolCall;
				assistantReasoning = chunk.reasoningContent ?? '';
				break;
			}
			if (chunk.done) break;
			if (chunk.reasoningContent) {
				const prev = assistantReasoning;
				assistantReasoning = appendReasoningStream(assistantReasoning, chunk.reasoningContent);
				const delta = assistantReasoning.slice(prev.length);
				if (delta) yield { type: 'reasoning' as const, content: delta };
			}
			assistantContent += chunk.content ?? '';
			yield { type: 'chunk' as const, content: chunk.content ?? '' };
		}

		if (!pendingToolCall) {
			await params.messageRepo.create(
				params.conversationId,
				'assistant',
				assistantContent,
				undefined,
				assistantReasoning.trim() || undefined
			);
			logger.info('Assistant reply complete', {
				userId: params.userId,
				conversationId: params.conversationId,
				model: params.modelLabel,
				replyChars: assistantContent.length,
				toolInvocations,
				llmTurn: turn
			});
			yield* yieldNewThreadTitleEvents({
				isNewThread: params.isNewThread,
				conversationId: params.conversationId,
				userPrompt: params.userPrompt,
				assistantContent,
				userId: params.userId,
				chatRepo: params.chatRepo,
				titleService: params.titleService
			});
			yield* extendRollingSummaryAfterReply({
				conversationId: params.conversationId,
				userId: params.userId,
				chatRepo: params.chatRepo,
				messageRepo: params.messageRepo,
				summaryService: params.summaryService,
				config: params.summaryConfig
			});
			yield { type: 'done' as const, conversationId: params.conversationId };
			return;
		}

		yield {
			type: 'tool_call' as const,
			name: pendingToolCall.name,
			arguments: pendingToolCall.arguments
		};

		const result = await executeToolLogged(
			params.toolExecutor,
			{ userId: params.userId, conversationId: params.conversationId, llmTurn: turn },
			pendingToolCall
		);
		toolInvocations++;

		const historyResult = toolResultForLlmHistory(pendingToolCall.name, result);

		if (pendingToolCall.name === 'generate_image' && parseImageGenerationToolResult(result)?.ok) {
			yield* yieldGenerateImageSuccess({
				userId: params.userId,
				conversationId: params.conversationId,
				isNewThread: params.isNewThread,
				userPrompt: params.userPrompt,
				assistantPreamble: assistantContent,
				result,
				pendingToolCall,
				messageRepo: params.messageRepo,
				chatRepo: params.chatRepo,
				titleService: params.titleService,
				summaryService: params.summaryService,
				summaryConfig: params.summaryConfig
			});
			return;
		}

		yield { type: 'tool_result' as const, name: pendingToolCall.name, result };

		augmentedHistory = appendToolExchangeToHistory(
			augmentedHistory,
			pendingToolCall,
			assistantReasoning,
			historyResult
		);
	}

	logger.warn('Chat max tool turns reached; synthesizing without tools', {
		userId: params.userId,
		conversationId: params.conversationId,
		toolInvocations,
		maxToolTurns: MAX_TOOL_TURNS
	});
	for await (const ev of eachBudgetExhaustionChunk(
		params.provider,
		augmentedHistory,
		params.streamAttachments,
		params.options
	)) {
		if (ev.kind === 'reasoning') yield { type: 'reasoning' as const, content: ev.content };
		else if (ev.kind === 'chunk') yield { type: 'chunk' as const, content: ev.content };
		else {
			await params.messageRepo.create(
				params.conversationId,
				'assistant',
				ev.reply,
				undefined,
				ev.reasoning.trim() || undefined
			);
			logger.info('Assistant reply complete', {
				userId: params.userId,
				conversationId: params.conversationId,
				model: params.modelLabel,
				replyChars: ev.reply.length,
				toolInvocations,
				llmTurn: turn,
				afterMaxToolTurns: true
			});
			yield* yieldNewThreadTitleEvents({
				isNewThread: params.isNewThread,
				conversationId: params.conversationId,
				userPrompt: params.userPrompt,
				assistantContent: ev.reply,
				userId: params.userId,
				chatRepo: params.chatRepo,
				titleService: params.titleService
			});
			yield* extendRollingSummaryAfterReply({
				conversationId: params.conversationId,
				userId: params.userId,
				chatRepo: params.chatRepo,
				messageRepo: params.messageRepo,
				summaryService: params.summaryService,
				config: params.summaryConfig
			});
			yield { type: 'done' as const, conversationId: params.conversationId };
		}
	}
}
