import type { ChatAttachment } from '../domain/ChatProvider.interface';
import { modelSupportsNativeFiles } from '../model/modelCapabilities';

export type OpenRouterPdfEngine = 'native' | 'cloudflare-ai';

/** `native` = provider parses PDF (e.g. Gemini). `cloudflare-ai` = OpenRouter pre-parse for models without file input. */
export function openRouterPdfPlugins(engine: OpenRouterPdfEngine) {
	return [{ id: 'file-parser', pdf: { engine } }];
}

export function wantsOpenRouterPdfPlugin(atts: readonly ChatAttachment[] | undefined): boolean {
	return (
		atts?.some(
			(a) =>
				a.type === 'file' &&
				Boolean(a.dataUrl) &&
				(a.mimeType === 'application/pdf' || a.name.toLowerCase().endsWith('.pdf'))
		) ?? false
	);
}

/** When a PDF is attached, pick parser: native for file-capable models, else Cloudflare markdown extraction. */
export function openRouterPdfPluginsForChat(
	attachments: readonly ChatAttachment[] | undefined,
	modelId: string | undefined
) {
	if (!wantsOpenRouterPdfPlugin(attachments)) return undefined;
	const engine = modelSupportsNativeFiles(modelId) ? 'native' : 'cloudflare-ai';
	return openRouterPdfPlugins(engine);
}
