const BASE = 'https://openrouter.ai/api/v1';

function headers(apiKey: string, httpReferer?: string): Record<string, string> {
	const h: Record<string, string> = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${apiKey}`,
		'X-Title': 'AI Chat Platform'
	};
	if (httpReferer) h['HTTP-Referer'] = httpReferer;
	return h;
}

/** Non-streaming OpenRouter completion; returns trimmed assistant text or null. */
export async function completeOpenRouterText(
	apiKey: string,
	modelId: string,
	messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
	maxTokens: number,
	httpReferer?: string
): Promise<string | null> {
	const res = await fetch(`${BASE}/chat/completions`, {
		method: 'POST',
		headers: headers(apiKey, httpReferer),
		body: JSON.stringify({ model: modelId, stream: false, max_tokens: maxTokens, messages })
	});
	const raw = await res.text();
	if (!res.ok) return null;
	try {
		const json = JSON.parse(raw) as { choices?: Array<{ message?: { content?: string } }> };
		const text = json.choices?.[0]?.message?.content?.trim();
		return text || null;
	} catch {
		return null;
	}
}
