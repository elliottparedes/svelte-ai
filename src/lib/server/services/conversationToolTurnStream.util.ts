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

export type StreamTurnResult = {
	assistantContent: string;
	assistantReasoning: string;
	pendingToolCall?: ToolCall;
};

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
	let pendingToolCall: ToolCall | undefined;

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

	return { assistantContent, assistantReasoning, pendingToolCall };
}
