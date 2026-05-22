import type { ChatMessage } from '$lib/types/dashboard';
import { appendReasoningStream } from '$lib/shared/appendReasoningStream';
import type { ChatSseEvent } from './readChatSse';

export type ChatSseAccum = {
	messages: ChatMessage[];
	assistantContent: string;
	assistantReasoning: string;
	doneConversationId: string | null;
	errorMessage: string;
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
			...patch
		}
	];
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
			const toolEntry: ChatMessage = {
				id: crypto.randomUUID(),
				role: 'tool',
				content: '',
				createdAt: new Date(),
				toolCall: { name: ev.name, arguments: ev.arguments }
			};
			const prev = acc.messages;
			const assistantIdx = prev.findIndex((m) => m.id === assistantId);
			const messages =
				assistantIdx >= 0
					? [...prev.slice(0, assistantIdx), toolEntry, ...prev.slice(assistantIdx)]
					: [...prev, toolEntry];
			return { ...acc, messages };
		}
		case 'tool_result': {
			const prev = acc.messages;
			let messages = [...prev];
			let updated = false;
			for (let i = messages.length - 1; i >= 0; i--) {
				const m = messages[i];
				if (m.role === 'tool' && m.toolCall && m.toolCall.result === undefined) {
					messages[i] = { ...m, toolCall: { ...m.toolCall, result: ev.result } };
					updated = true;
					break;
				}
			}
			if (!updated) {
				messages = [
					...messages,
					{
						id: crypto.randomUUID(),
						role: 'tool',
						content: '',
						toolCall: { name: ev.name, result: ev.result }
					}
				];
			}
			return { ...acc, messages };
		}
		case 'error':
			return { ...acc, errorMessage: ev.message || 'An error occurred' };
		case 'done':
			return { ...acc, doneConversationId: ev.conversationId };
		default:
			return acc;
	}
}
