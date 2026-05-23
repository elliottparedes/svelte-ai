export type ConversationProcessEvent =
	| { type: 'chunk'; content: string }
	| { type: 'reasoning'; content: string }
	| { type: 'tool_call'; name: string; arguments: Record<string, unknown> }
	| { type: 'tool_result'; name: string; result: string }
	| { type: 'title'; conversationId: string; title: string }
	| { type: 'summary_start' }
	| { type: 'summary_done'; conversationId: string; summaryThroughMessageId: string; summaryChars: number }
	| { type: 'done'; conversationId: string };
