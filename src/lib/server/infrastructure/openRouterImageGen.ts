import { textFromOpenRouterDelta } from './openRouterStreamDelta';

const BASE = 'https://openrouter.ai/api/v1';

function headers(apiKey: string, httpReferer?: string): Record<string, string> {
	const h: Record<string, string> = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${apiKey}`,
		'X-Title': 'Inkstream'
	};
	if (httpReferer) h['HTTP-Referer'] = httpReferer;
	return h;
}

export function extractImageUrlFromCompletion(json: unknown): string | null {
	const j = json as {
		choices?: Array<{
			message?: {
				content?: unknown;
				images?: ReadonlyArray<{ image_url?: { url?: string } }>;
			};
		}>;
	};
	const msg = j.choices?.[0]?.message;
	if (!msg) return null;
	if (Array.isArray(msg.images)) {
		for (const im of msg.images) {
			const u = im?.image_url?.url;
			if (typeof u === 'string' && u.length > 0) return u;
		}
	}
	const { text } = textFromOpenRouterDelta({ content: msg.content, images: msg.images });
	const m = text.match(/!\[[^\]]*\]\(([^)]+)\)/);
	if (m?.[1]) return m[1];
	return null;
}

export async function completeOpenRouterImageGeneration(
	apiKey: string,
	modelId: string,
	prompt: string,
	httpReferer?: string
): Promise<{ imageUrl: string | null; error?: string }> {
	const res = await fetch(`${BASE}/chat/completions`, {
		method: 'POST',
		headers: headers(apiKey, httpReferer),
		body: JSON.stringify({
			model: modelId,
			modalities: ['image', 'text'],
			stream: false,
			messages: [{ role: 'user', content: prompt }]
		})
	});
	const raw = await res.text();
	if (!res.ok) return { imageUrl: null, error: `OpenRouter ${res.status}: ${raw.slice(0, 400)}` };
	let json: unknown;
	try {
		json = JSON.parse(raw);
	} catch {
		return { imageUrl: null, error: 'Invalid JSON from OpenRouter' };
	}
	const imageUrl = extractImageUrlFromCompletion(json);
	if (!imageUrl) return { imageUrl: null, error: 'No image in model response' };
	return { imageUrl };
}
