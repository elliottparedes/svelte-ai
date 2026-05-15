/** Matches server-side trim budget: reserve completion + small slack from OpenRouter `context_length`. */
export function promptInputTokenBudget(
	contextLength: number,
	maxCompletionTokens?: number
): number {
	const completionReserve = Math.min(
		Math.max(maxCompletionTokens ?? 4096, 1024),
		Math.floor(contextLength * 0.35)
	);
	const slack = 400;
	return Math.max(4096, contextLength - completionReserve - slack);
}
