import { FETCH_URL_MAX_CHARS, FETCH_URL_MAX_PAGE_CHARS } from '../env';
import type { WebSearchProviderResult } from '../domain/WebSearchProvider.interface';

const EXA_CONTENTS = 'https://api.exa.ai/contents';
const EXA_COST_PER_CONTENT_USD = 0.001;

type ExaContentsResult = {
	url?: string;
	title?: string;
	text?: string;
};

type ExaContentsJson = {
	results?: ExaContentsResult[];
};

function parseOffset(raw: unknown): number {
	const n = Number(raw ?? 0);
	if (!Number.isFinite(n) || n < 0) return 0;
	return Math.floor(n);
}

function formatSlice(url: string, title: string | undefined, text: string, offset: number, chunk: string): string {
	const total = text.length;
	const end = offset + chunk.length;
	const titleLine = title?.trim() ? `Title: ${title.trim()}\n` : '';
	const header =
		`URL: ${url}\n${titleLine}Page text from Exa: ${total.toLocaleString()} characters total | ` +
		`showing ${offset.toLocaleString()}-${end.toLocaleString()}\n`;
	const body = `${header}\n${chunk}`;
	if (end >= total) return body;
	return `${body}\n\n- More content available. Call fetch_url again with the same url and offset=${end}.`;
}

export async function exaUrlContent(
	apiKey: string,
	url: string,
	offsetRaw?: unknown
): Promise<WebSearchProviderResult> {
	const raw = url.trim();
	if (!raw) return { content: 'Error: empty URL' };
	if (!apiKey) return { content: 'Error: Exa URL content is not configured (set EXA_AI_API_KEY)' };

	let parsed: URL;
	try {
		parsed = new URL(raw);
	} catch {
		return { content: 'Error: invalid URL' };
	}
	if (!['http:', 'https:'].includes(parsed.protocol)) {
		return { content: 'Error: only http(s) URLs are supported' };
	}

	const offset = parseOffset(offsetRaw);
	if (offset >= FETCH_URL_MAX_PAGE_CHARS) {
		return { content: `Error: offset ${offset} exceeds max page size (${FETCH_URL_MAX_PAGE_CHARS})` };
	}

	try {
		const res = await fetch(EXA_CONTENTS, {
			method: 'POST',
			headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				urls: [parsed.toString()],
				text: { maxCharacters: FETCH_URL_MAX_PAGE_CHARS }
			})
		});
		if (!res.ok) return { content: `Error: Exa URL content failed (${res.status})` };
		const data = (await res.json()) as ExaContentsJson;
		const result = data.results?.[0];
		const text = result?.text?.trim() ?? '';
		if (!text) return { content: 'Error: no readable text on page from Exa' };
		if (offset >= text.length) {
			return { content: `Error: offset ${offset} is past end of page (${text.length} characters)` };
		}
		const chunk = text.slice(offset, offset + FETCH_URL_MAX_CHARS);
		return {
			content: formatSlice(result?.url ?? parsed.toString(), result?.title, text, offset, chunk),
			usage: { provider: 'exa', toolName: 'fetch_url', costUsd: EXA_COST_PER_CONTENT_USD, requests: 1 }
		};
	} catch {
		return { content: 'Error: Exa URL content request failed' };
	}
}
