import { modelSupportsVision } from './openRouterCapabilities';

/**
 * Models OpenRouter lists with image input that still fail on some routes (e.g. Bedrock)
 * with "does not support image input". Skip native pixels; use vision relay instead.
 */
const NATIVE_PIXELS_DENIED_EXACT = new Set<string>(['anthropic/claude-3-5-haiku-20241022']);

function normalizeModelId(id: string): string {
	return id.replace(/:free$/i, '').replace(/:nitro$/i, '');
}

function isBedrockHaikuNoPixels(id: string): boolean {
	const n = normalizeModelId(id);
	if (NATIVE_PIXELS_DENIED_EXACT.has(id) || NATIVE_PIXELS_DENIED_EXACT.has(n)) return true;
	return n.includes('claude-3-5-haiku-20241022');
}

/** When false with image attachments, do not send image_url parts — use vision relay or error. */
export function modelSendsNativeImagePixels(modelId: string | undefined): boolean {
	if (!modelId) return false;
	if (isBedrockHaikuNoPixels(modelId)) return false;
	return modelSupportsVision(modelId);
}
