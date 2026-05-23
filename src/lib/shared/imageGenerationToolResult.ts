import type { ImageGenerationToolPayload } from './imageGeneration.types';

export type { ImageGenerationToolPayload };

export const IMAGE_GENERATION_REPLY = "Here's the image you asked for.";

/** Tool result for LLM history — omits huge data URLs so the next turn does not hang. */

export function toolResultForLlmHistory(toolName: string, result: string): string {
	if (toolName !== 'generate_image') return result;
	const p = parseImageGenerationToolResult(result);
	if (!p?.ok) return result;
	return JSON.stringify({
		ok: true,
		prompt: p.prompt,
		note: 'Image was generated and is visible to the user in the chat.'
	});
}

export function imageGenerationMarkdown(payload: ImageGenerationToolPayload): string {
	const url = payload.imageUrl?.trim();
	if (!url) return '';
	const alt = escapeHtmlAttr(payload.prompt.slice(0, 120) || 'Generated image');
	const src = escapeHtmlAttr(url);
	return `<figure class="chat-gen-image"><img src="${src}" alt="${alt}" loading="lazy" /></figure>`;
}

function escapeHtmlAttr(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;');
}

/** Persisted assistant text so images reload with the conversation (not sent over SSE). */
export function assistantContentForImageGeneration(
	result: string,
	reply = IMAGE_GENERATION_REPLY
): string {
	const payload = parseImageGenerationToolResult(result);
	if (!payload?.ok || !payload.imageUrl) return reply;
	return `${imageGenerationMarkdown(payload)}\n\n${reply}`;
}

export function parseImageGenerationToolResult(
	result: string | undefined
): ImageGenerationToolPayload | null {
	if (!result?.trim() || result.startsWith('Error:')) return null;
	try {
		const data = JSON.parse(result) as ImageGenerationToolPayload;
		if (typeof data.ok !== 'boolean') return null;
		if (!data.ok) return data;
		if (!data.imageUrl?.trim()) return null;
		return data;
	} catch {
		return null;
	}
}
