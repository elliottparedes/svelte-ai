import type { ChatAttachment } from '../domain/ChatProvider.interface';
import { DomainError } from '../domain/DomainError';

const BASE = 'https://openrouter.ai/api/v1';

const RELAY_SYSTEM =
	'You describe images for another language model. Be concise: visible text, main objects, layout, colors, UI labels, and numbers. If there are multiple images, refer to them as Image 1, Image 2, etc.';

function buildMultimodalContent(text: string, images: readonly ChatAttachment[]) {
	const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
		{ type: 'text', text }
	];
	for (const a of images) {
		if (a.type === 'image' && a.dataUrl) {
			content.push({ type: 'image_url', image_url: { url: a.dataUrl } });
		}
	}
	return content;
}

function headers(apiKey: string, httpReferer?: string): Record<string, string> {
	const h: Record<string, string> = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${apiKey}`,
		'X-Title': 'Inkstream'
	};
	if (httpReferer) h['HTTP-Referer'] = httpReferer;
	return h;
}

export async function completeOpenRouterVisionRelay(
	apiKey: string,
	relayModelId: string,
	userPrompt: string,
	images: readonly ChatAttachment[],
	maxTokens: number,
	httpReferer?: string
): Promise<string> {
	const userLine = `User message (may reference the images):\n${userPrompt}`;

	const res = await fetch(`${BASE}/chat/completions`, {
		method: 'POST',
		headers: headers(apiKey, httpReferer),
		body: JSON.stringify({
			model: relayModelId,
			stream: false,
			max_tokens: maxTokens,
			messages: [
				{ role: 'system', content: RELAY_SYSTEM },
				{ role: 'user', content: buildMultimodalContent(userLine, images) }
			]
		})
	});

	const raw = await res.text();
	if (!res.ok) {
		throw new DomainError(`Vision relay failed: ${res.status} ${raw.slice(0, 400)}`, 502);
	}

	let json: { choices?: Array<{ message?: { content?: string } }> };
	try {
		json = JSON.parse(raw) as { choices?: Array<{ message?: { content?: string } }> };
	} catch {
		throw new DomainError('Vision relay: invalid JSON from chat/completions', 502);
	}
	const text = json.choices?.[0]?.message?.content?.trim() ?? '';
	if (!text) throw new DomainError('Vision relay returned empty description', 502);
	return text;
}
