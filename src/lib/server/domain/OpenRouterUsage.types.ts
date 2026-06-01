/** Token and billing usage from an OpenRouter completion response. */
export type OpenRouterUsage = {
	costUsd: number;
	promptTokens: number;
	completionTokens: number;
};
