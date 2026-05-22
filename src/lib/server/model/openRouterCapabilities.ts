import type { ChatModel } from '../domain/ChatProvider.interface';
import { modelIdImpliesReasoning } from '../infrastructure/openRouterReasoningDelta';

let byId = new Map<
	string,
	{ vision: boolean; files: boolean; tools: boolean; reasoning: boolean; modalities?: string[] }
>();

export function hydrateOpenRouterCapabilities(models: readonly ChatModel[]) {
	byId = new Map(
		models.map((m) => [
			m.id,
			{
				vision: m.supportsVision === true,
				files: m.supportsFiles === true,
				tools: m.supportsTools !== false,
				reasoning: m.supportsReasoning === true,
				modalities:
					m.openRouterModalities && m.openRouterModalities.length > 0
						? [...m.openRouterModalities]
						: undefined
			}
		])
	);
}

export function isOpenRouterCapabilitiesHydrated(): boolean {
	return byId.size > 0;
}

export function modelSupportsVision(modelId: string | undefined): boolean {
	if (!modelId) return false;
	return byId.get(modelId)?.vision ?? false;
}

export function modelSupportsNativeFiles(modelId: string | undefined): boolean {
	if (!modelId) return false;
	return byId.get(modelId)?.files ?? false;
}

/** OpenRouter `modalities` for image-generation chat (undefined = omit). */
export function modelOpenRouterModalities(modelId: string | undefined): string[] | undefined {
	if (!modelId) return undefined;
	return byId.get(modelId)?.modalities;
}

/** When false, omit tools on chat/completions. Unknown model id defaults to true until cache is filled. */
export function modelSupportsTools(modelId: string | undefined): boolean {
	if (!modelId) return true;
	const row = byId.get(modelId);
	if (!row) return true;
	return row.tools;
}

/** Enable OpenRouter `reasoning` request + parse reasoning deltas. */
export function modelSupportsReasoning(modelId: string | undefined): boolean {
	if (!modelId) return false;
	const row = byId.get(modelId);
	if (row) return row.reasoning || modelIdImpliesReasoning(modelId);
	return modelIdImpliesReasoning(modelId);
}
