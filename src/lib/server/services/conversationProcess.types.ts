export type ConversationProcessEvent =
	| { type: 'chunk'; content: string }
	| { type: 'reasoning'; content: string }
	| {
			type: 'usage';
			turnCostUsd: number;
			turnLlmCostUsd: number;
			turnToolCostUsd: number;
			turnPromptTokens: number;
			turnCompletionTokens: number;
	  }
	| {
			type: 'tool_call';
			toolCallId: string;
			name: string;
			arguments: Record<string, unknown>;
			conversationId?: string;
			execution?: 'client' | 'server';
			sandboxFiles?: { name: string; content: string }[];
			turnId?: string;
			usageSnapshot?: {
				llmCostUsd: number;
				promptTokens: number;
				completionTokens: number;
				externalItems: { provider: string; toolName: string; costUsd: number }[];
			};
	  }
	| { type: 'tool_result'; toolCallId: string; name: string; result: string }
	| { type: 'title'; conversationId: string; title: string }
	| { type: 'summary_start' }
	| { type: 'summary_done'; conversationId: string; summaryThroughMessageId: string; summaryChars: number }
	| { type: 'done'; conversationId: string };
