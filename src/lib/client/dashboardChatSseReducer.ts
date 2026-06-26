import type { ChatMessage } from '$lib/types/dashboard';
import { appendReasoningStream } from '$lib/shared/appendReasoningStream';
import type { ChatSseEvent } from './readChatSse';

export type ChatSseAccum = {
	messages: ChatMessage[];
	assistantContent: string;
	assistantReasoning: string;
	sawToolCall?: boolean;
	doneConversationId: string | null;
	errorMessage: string;
	routedModelId: string | null;
	isCompacting: boolean;
	summaryThroughMessageId: string | null;
	summaryChars: number;
	streamingTurnCostUsd: number;
};

function upsertStreamingAssistant(
	prev: ChatMessage[],
	assistantId: string,
	patch: Partial<ChatMessage>
): ChatMessage[] {
	const existing = prev.find((m) => m.id === assistantId);
	if (existing) {
		return prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m));
	}
	return [
		...prev,
		{
			id: assistantId,
			role: 'assistant' as const,
			content: '',
			createdAt: new Date(),
			...patch
		}
	];
}

function nextStreamingToolMessageId(prev: readonly ChatMessage[], toolCallId: string | undefined): string {
	if (!toolCallId) return crypto.randomUUID();
	const seen = prev.filter((m) => m.role === 'tool' && m.toolCallId === toolCallId).length;
	return seen === 0 ? toolCallId : `${toolCallId}#${seen + 1}`;
}

export function accumulateChatSse(
	acc: ChatSseAccum,
	ev: ChatSseEvent,
	assistantId: string
): ChatSseAccum {
	switch (ev.type) {
		case 'chunk': {
			const assistantContent = acc.assistantContent + ev.content;
			const messages = upsertStreamingAssistant(acc.messages, assistantId, {
				content: assistantContent,
				reasoningContent: acc.assistantReasoning || undefined
			});
			return { ...acc, assistantContent, messages };
		}
		case 'reasoning': {
			const assistantReasoning = appendReasoningStream(acc.assistantReasoning, ev.content);
			const messages = upsertStreamingAssistant(acc.messages, assistantId, {
				content: acc.assistantContent,
				reasoningContent: assistantReasoning
			});
			return { ...acc, assistantReasoning, messages };
		}
		case 'tool_call': {
			const messages = upsertStreamingAssistant(acc.messages, assistantId, {
				content: acc.assistantContent,
				reasoningContent: acc.assistantReasoning || undefined
			});
			const toolEntry: ChatMessage = {
				id: nextStreamingToolMessageId(messages, ev.toolCallId),
				role: 'tool',
				content: '',
				createdAt: new Date(),
				toolCallId: ev.toolCallId,
				toolName: ev.name,
				toolArgumentsJson: ev.arguments ? JSON.stringify(ev.arguments) : undefined,
				toolCall: { name: ev.name, arguments: ev.arguments }
			};
			return { ...acc, messages: [...messages, toolEntry], sawToolCall: true };
		}
		case 'tool_result': {
			const prev = acc.messages;
			let messages = [...prev];
			let updated = false;
			for (let i = messages.length - 1; i >= 0; i--) {
				const m = messages[i];
				if (m.role === 'tool' && m.toolCallId === ev.toolCallId) {
					const toolCall = m.toolCall ?? { name: ev.name };
					messages[i] = {
						...m,
						content: ev.result,
						toolCall: { name: toolCall.name, arguments: toolCall.arguments, result: ev.result }
					};
					updated = true;
					break;
				}
			}
			if (!updated) {
				messages = [
					...messages,
					{
						id: nextStreamingToolMessageId(messages, ev.toolCallId),
						role: 'tool',
						content: ev.result,
						createdAt: new Date(),
						toolCallId: ev.toolCallId,
						toolName: ev.name,
						toolCall: { name: ev.name, result: ev.result }
					}
				];
			}
			return { ...acc, messages, sawToolCall: true };
		}
		case 'usage':
			return { ...acc, streamingTurnCostUsd: ev.turnCostUsd };
		case 'routing':
			return { ...acc, routedModelId: ev.modelId || acc.routedModelId };
		case 'error':
			return { ...acc, errorMessage: ev.message || 'An error occurred', isCompacting: false };
		case 'summary_start':
			return { ...acc, isCompacting: true };
		case 'summary_done':
			return {
				...acc,
				isCompacting: false,
				summaryThroughMessageId: ev.summaryThroughMessageId,
				summaryChars: ev.summaryChars,
				doneConversationId: acc.doneConversationId ?? ev.conversationId
			};
		case 'done':
			if (acc.sawToolCall && !acc.assistantContent.trim() && acc.assistantReasoning.trim()) {
				const assistantContent = acc.assistantReasoning;
				const messages = acc.messages.map((m) =>
					m.id === assistantId ? { ...m, content: assistantContent, reasoningContent: undefined } : m
				);
				return {
					...acc,
					assistantContent,
					assistantReasoning: '',
					messages,
					doneConversationId: ev.conversationId,
					isCompacting: false,
					streamingTurnCostUsd: 0
				};
			}
			return {
				...acc,
				doneConversationId: ev.conversationId,
				isCompacting: false,
				streamingTurnCostUsd: 0
			};
		default:
			return acc;
	}
}
