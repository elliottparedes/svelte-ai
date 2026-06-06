import type {
	ChatAttachment,
	ChatMessage,
	ChatProvider,
	ToolCall,
	ToolDefinition
} from '../domain/ChatProvider.interface';
import type { ConversationProcessEvent } from './conversationProcess.types';
import type { ChatTurnUsageAccumulator } from './chatTurnUsageAccumulator';
import { appendReasoningStream } from '$lib/shared/appendReasoningStream';
import { usageProcessEvent } from './conversationTurnUsage.util';
import { findReasoningAnswerStart } from './conversationReasoningAnswerStart';
import { logger } from '../logger';

export type StreamTurnResult = {
	assistantContent: string;
	assistantReasoning: string;
	pendingToolCall?: ToolCall;
};

function previewText(text: string): string {
	return text.replace(/\s+/g, ' ').slice(0, 180);
}

function containsSearchMarker(text: string): boolean {
	return text.includes('<｜search') || text.includes('<|search');
}

export async function* streamOneToolTurn(params: {
	provider: ChatProvider;
	augmentedHistory: ChatMessage[];
	streamAttachments: readonly ChatAttachment[] | undefined;
	toolsForTurn: readonly ToolDefinition[];
	options: Record<string, unknown> | undefined;
	usageAcc: ChatTurnUsageAccumulator;
}): AsyncGenerator<ConversationProcessEvent, StreamTurnResult> {
	let assistantContent = '';
	let assistantReasoning = '';
	let rawReasoning = '';
	let pendingToolCall: ToolCall | undefined;
	let promotedReasoningAnswer = false;
	let loggedReasoningStart = false;
	const reasoningOnlyAnswerMode = params.augmentedHistory.at(-1)?.role === 'tool';

	if (reasoningOnlyAnswerMode) {
		logger.info('Post-tool reasoning monitor enabled', {
			model: String(params.options?.model ?? ''),
			historyMessages: params.augmentedHistory.length
		});
	}

	for await (const chunk of params.provider.streamResponse(
		params.augmentedHistory,
		params.streamAttachments,
		params.toolsForTurn,
		params.options
	)) {
		if (chunk.usage) {
			params.usageAcc.add(chunk.usage);
			yield usageProcessEvent(params.usageAcc);
		}
		if (chunk.toolCall) {
			if (reasoningOnlyAnswerMode && !promotedReasoningAnswer && rawReasoning) {
				assistantReasoning = rawReasoning;
				logger.info('Post-tool reasoning kept hidden before another tool call', {
					reasoningChars: assistantReasoning.length,
					containsSearchMarker: containsSearchMarker(assistantReasoning)
				});
				yield { type: 'reasoning' as const, content: rawReasoning };
			}
			pendingToolCall = chunk.toolCall;
			assistantReasoning = chunk.reasoningContent ?? assistantReasoning;
			break;
		}
		if (chunk.done) break;
		if (chunk.reasoningContent) {
			const prev = rawReasoning;
			rawReasoning = appendReasoningStream(rawReasoning, chunk.reasoningContent);
			const delta = rawReasoning.slice(prev.length);
			if (!delta) continue;
			if (reasoningOnlyAnswerMode && !loggedReasoningStart) {
				loggedReasoningStart = true;
				logger.info('Post-tool reasoning stream started', {
					deltaChars: delta.length,
					reasoningChars: rawReasoning.length,
					containsSearchMarker: containsSearchMarker(rawReasoning)
				});
			}
			if (reasoningOnlyAnswerMode && (promotedReasoningAnswer || !assistantContent.trim())) {
				if (promotedReasoningAnswer) {
					assistantContent += delta;
					yield { type: 'chunk' as const, content: delta };
					continue;
				}
				const answerStart = findReasoningAnswerStart(rawReasoning);
				if (answerStart !== null) {
					assistantReasoning = rawReasoning.slice(0, answerStart);
					assistantContent = rawReasoning.slice(answerStart);
					promotedReasoningAnswer = true;
					logger.info('Post-tool reasoning promoted to visible answer', {
						answerStart,
						hiddenReasoningChars: assistantReasoning.length,
						visibleChars: assistantContent.length,
						containsSearchMarker: containsSearchMarker(rawReasoning),
						visiblePreview: previewText(assistantContent)
					});
					if (assistantReasoning) yield { type: 'reasoning' as const, content: assistantReasoning };
					if (assistantContent) yield { type: 'chunk' as const, content: assistantContent };
				}
				continue;
			}
			assistantReasoning = rawReasoning;
			yield { type: 'reasoning' as const, content: delta };
		}
		if (chunk.content) {
			if (reasoningOnlyAnswerMode && !promotedReasoningAnswer && rawReasoning) {
				assistantReasoning = rawReasoning;
				logger.info('Post-tool provider emitted normal visible content', {
					hiddenReasoningChars: assistantReasoning.length,
					contentChars: chunk.content.length,
					containsSearchMarker: containsSearchMarker(assistantReasoning)
				});
				yield { type: 'reasoning' as const, content: rawReasoning };
			}
			assistantContent += chunk.content;
			yield { type: 'chunk' as const, content: chunk.content };
		}
	}

	if (!pendingToolCall && reasoningOnlyAnswerMode && !assistantContent.trim() && rawReasoning.trim()) {
		logger.warn('Post-tool reasoning promoted only at stream end', {
			reasoningChars: rawReasoning.length,
			containsSearchMarker: containsSearchMarker(rawReasoning),
			visiblePreview: previewText(rawReasoning)
		});
		return { assistantContent: rawReasoning, assistantReasoning: '', pendingToolCall };
	}

	return { assistantContent, assistantReasoning, pendingToolCall };
}
