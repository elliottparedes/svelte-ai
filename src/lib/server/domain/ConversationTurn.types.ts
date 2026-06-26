export type ConversationTurnStatus = 'completed' | 'error';

export type ConversationToolAudit = {
	toolCallId: string;
	name: string;
	arguments: Record<string, unknown>;
	result?: string;
};

export type CreateConversationTurnInput = {
	conversationId: string;
	userId: string;
	userMessageId: string;
	modelId: string;
	routeSource?: string;
	routeTier?: string | null;
	deepReasoning: boolean;
	enabledToolNames?: readonly string[];
	attachmentsJson?: string | null;
	requestMetaJson?: string | null;
	promptChars: number;
};

export type FinalizeConversationTurnInput = {
	assistantMessageId?: string;
	responseChars: number;
	llmCostUsd?: number;
	toolCostUsd?: number;
	totalCostUsd?: number;
	promptTokens?: number;
	completionTokens?: number;
	toolCallsJson?: string | null;
	status: ConversationTurnStatus;
	errorMessage?: string | null;
};
