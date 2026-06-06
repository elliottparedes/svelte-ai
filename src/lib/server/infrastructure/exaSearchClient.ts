import type { WebSearchProviderResult } from '../domain/WebSearchProvider.interface';

const EXA_SEARCH = 'https://api.exa.ai/search';
const EXA_COST_PER_SEARCH_USD = 0.007;
const MAX_RESULTS = 10;
const MAX_OUTPUT_CHARS = 28_000;

type ExaResult = {
	title?: string;
	url?: string;
	publishedDate?: string;
	author?: string;
	text?: string;
	highlights?: string[];
};

type ExaSearchJson = {
	query?: string;
	resolvedSearchType?: string;
	results?: ExaResult[];
};

function domainOf(url: string | undefined): string {
	try {
		return url ? new URL(url).hostname.replace(/^www\./, '') : '';
	} catch {
		return '';
	}
}

function compactText(value: string | undefined): string {
	return (value ?? '').replace(/\s+/g, ' ').trim();
}

function formatResult(index: number, result: ExaResult): string {
	const title = result.title?.trim() || '(no title)';
	const bits = [`[W${index}] ${title}`];
	if (result.publishedDate?.trim()) bits.push(`Date: ${result.publishedDate.trim()}`);
	if (result.author?.trim()) bits.push(`Author: ${result.author.trim()}`);
	const highlights = (result.highlights ?? []).map(compactText).filter(Boolean);
	const snippet = highlights.length ? highlights.join(' ') : compactText(result.text).slice(0, 700);
	if (snippet) bits.push(snippet);
	const domain = domainOf(result.url);
	if (domain) bits.push(`Domain: ${domain}`);
	if (result.url?.trim()) bits.push(`URL: ${result.url.trim()}`);
	return bits.join('\n');
}

function formatExa(data: ExaSearchJson, query: string): string {
	const lines = [
		`[Web search] Exa results at ${new Date().toISOString()} (server).`,
		'Verification: Exa ranks semantically relevant sources. For latest/current/newest claims, fetch_url 1-2 authoritative URLs before finalizing.',
		`Query: ${data.query?.trim() || query}`
	];
	if (data.resolvedSearchType?.trim()) lines.push(`Search type: ${data.resolvedSearchType.trim()}`);
	const results = (data.results ?? []).slice(0, MAX_RESULTS);
	if (results.length) lines.push(`[Web results]\n${results.map((r, i) => formatResult(i + 1, r)).join('\n\n')}`);
	const output = lines.join('\n\n').trim() || 'No results found.';
	return output.length > MAX_OUTPUT_CHARS ? `${output.slice(0, MAX_OUTPUT_CHARS)}\n...(truncated)` : output;
}

export async function exaWebSearch(apiKey: string, query: string): Promise<WebSearchProviderResult> {
	const q = query.trim();
	if (!q) return { content: 'Error: empty search query' };
	if (!apiKey) return { content: 'Error: Exa search is not configured (set EXA_AI_API_KEY)' };
	try {
		const res = await fetch(EXA_SEARCH, {
			method: 'POST',
			headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query: q.slice(0, 400),
				type: 'auto',
				numResults: MAX_RESULTS,
				contents: { highlights: { query: q.slice(0, 400), maxCharacters: 4000 } }
			})
		});
		if (!res.ok) return { content: `Error: Exa search failed (${res.status})` };
		const data = (await res.json()) as ExaSearchJson;
		return {
			content: formatExa(data, q),
			usage: { provider: 'exa', toolName: 'web_search', costUsd: EXA_COST_PER_SEARCH_USD, requests: 1, queries: 1 }
		};
	} catch {
		return { content: 'Error: Exa search request failed' };
	}
}
