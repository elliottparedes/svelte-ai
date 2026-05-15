/** Turn OpenRouter/Gemini stream deltas into text (markdown) the UI can render. */
export function textFromOpenRouterDelta(delta: {
	content?: unknown;
	reasoning_content?: string;
	images?: ReadonlyArray<{ type?: string; image_url?: { url?: string } }>;
} | undefined): { text: string; reasoning: string } {
	const reasoning = delta?.reasoning_content ?? '';
	let text = '';
	const c = delta?.content;
	if (typeof c === 'string') {
		text = c;
	} else if (Array.isArray(c)) {
		for (const part of c) {
			if (!part || typeof part !== 'object') continue;
			const p = part as Record<string, unknown>;
			if (typeof p.text === 'string') text += p.text;
			const url = (p.image_url as { url?: string } | undefined)?.url;
			if (typeof url === 'string' && url.length > 0) {
				text += (text ? '\n\n' : '') + `![Generated image](${url})`;
			}
		}
	}
	if (Array.isArray(delta?.images)) {
		for (const im of delta.images) {
			const url = im?.image_url?.url;
			if (typeof url === 'string' && url.length > 0) {
				text += (text ? '\n\n' : '') + `![Generated image](${url})`;
			}
		}
	}
	return { text, reasoning };
}
