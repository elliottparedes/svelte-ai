export type ExternalToolProvider = 'brave_answers' | 'brave_search' | 'serper';

export type ExternalToolUsage = {
	provider: ExternalToolProvider;
	toolName: string;
	costUsd: number;
	requests?: number;
	queries?: number;
	inputTokens?: number;
	outputTokens?: number;
};

export type ExternalToolUsageSummary = {
	costUsd: number;
	items: ExternalToolUsage[];
};
