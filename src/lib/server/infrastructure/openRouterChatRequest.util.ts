/** Merge stream-only OpenRouter options (e.g. image `modalities`) into the request body. */
export function applyOpenRouterStreamPayloadOptions(
	payload: Record<string, unknown>,
	options?: Record<string, unknown>
): void {
	const mods = options?.modalities;
	if (Array.isArray(mods) && mods.length > 0) {
		payload.modalities = mods;
	}
}
