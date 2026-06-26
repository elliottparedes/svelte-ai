import type { ChatMessage, ToolCall } from '../domain/ChatProvider.interface';

function parseArgs(raw: string | undefined): Record<string, unknown> {
	if (!raw) return {};
	try {
		return JSON.parse(raw) as Record<string, unknown>;
	} catch {
		return {};
	}
}

export function persistedToolCallForMessage(message: ChatMessage): ToolCall | null {
	if (message.role !== 'tool' || !message.toolCallId || !message.toolName) return null;
	return {
		id: message.toolCallId,
		name: message.toolName,
		arguments: parseArgs(message.toolArgumentsJson)
	};
}
