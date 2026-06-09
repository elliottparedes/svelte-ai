import { modelSupportsReasoning } from '../model/openRouterCapabilities';

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

/** Ask OpenRouter to return reasoning tokens (DeepSeek R1, Kimi K2 Thinking, etc.). */
export function applyOpenRouterReasoningOption(
	payload: Record<string, unknown>,
	modelId: string | undefined,
	toolsActive = false
): void {
	if (!modelId || !modelSupportsReasoning(modelId)) return;
	// Hybrid models (e.g. DeepSeek V3.1 Terminus) often plan tool use in reasoning
	// tokens but finish with stop instead of tool_calls when both are enabled.
	if (toolsActive) return;
	payload.reasoning = { enabled: true };
}
