import type { ChatMessage, ToolCall } from '../domain/ChatProvider.interface';

export function appendToolExchangeToHistory(
	history: ChatMessage[],
	pendingToolCall: ToolCall,
	assistantReasoning: string,
	result: string
): ChatMessage[] {
	return [
		...history,
		{
			id: crypto.randomUUID(),
			role: 'assistant',
			content: '',
			createdAt: new Date(),
			toolCalls: [pendingToolCall],
			reasoningContent: assistantReasoning
		},
		{
			id: crypto.randomUUID(),
			role: 'tool',
			content: result,
			createdAt: new Date(),
			toolCallId: pendingToolCall.id
		}
	];
}
