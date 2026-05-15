export type ConversationProcessEvent =
	| { type: 'chunk'; content: string }
	| { type: 'tool_call'; name: string; arguments: Record<string, unknown> }
	| { type: 'tool_result'; name: string; result: string }
	| { type: 'done'; conversationId: string };
