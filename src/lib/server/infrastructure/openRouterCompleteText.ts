import type { OpenRouterUsage } from '../domain/OpenRouterUsage.types';
import { parseOpenRouterUsage } from './openRouterUsage.util';

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

export type OpenRouterTextCompletion = {
	text: string | null;
	usage: OpenRouterUsage | null;
};

/** Non-streaming OpenRouter completion; returns trimmed assistant text and usage when present. */
export async function completeOpenRouterText(
	apiKey: string,
	modelId: string,
	messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
	maxTokens: number,
	httpReferer?: string,
	signal?: AbortSignal
): Promise<OpenRouterTextCompletion> {
	const res = await fetch(`${BASE}/chat/completions`, {
		method: 'POST',
		headers: headers(apiKey, httpReferer),
		body: JSON.stringify({ model: modelId, stream: false, max_tokens: maxTokens, messages }),
		signal
	});
	const raw = await res.text();
	if (!res.ok) return { text: null, usage: null };
	try {
		const json = JSON.parse(raw) as {
			choices?: Array<{ message?: { content?: string } }>;
			usage?: unknown;
		};
		const text = json.choices?.[0]?.message?.content?.trim() || null;
		return { text, usage: parseOpenRouterUsage(json.usage) };
	} catch {
		return { text: null, usage: null };
	}
}
