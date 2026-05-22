/** Append a reasoning stream chunk (handles cumulative or duplicate deltas). */
export function appendReasoningStream(previous: string, chunk: string): string {
	if (!chunk) return previous;
	if (!previous) return chunk;
	if (chunk === previous) return previous;
	if (chunk.startsWith(previous)) return chunk;
	return previous + chunk;
}
