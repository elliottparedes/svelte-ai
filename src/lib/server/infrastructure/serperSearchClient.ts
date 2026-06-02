import type { WebSearchProviderResult } from '../domain/WebSearchProvider.interface';

const SERPER_SEARCH = 'https://google.serper.dev/search';
const SERPER_COST_PER_SEARCH_USD = 0.001;
const MAX_RESULTS = 10;

type SerperOrganic = { title?: string; link?: string; snippet?: string; date?: string };
type SerperJson = {
	searchParameters?: { q?: string };
	answerBox?: { answer?: string; snippet?: string; title?: string; link?: string };
	knowledgeGraph?: { title?: string; description?: string; website?: string };
	organic?: SerperOrganic[];
};

function domainOf(url: string | undefined): string {
	try {
		return url ? new URL(url).hostname.replace(/^www\./, '') : '';
	} catch {
		return '';
	}
}

function formatOrganic(index: number, r: SerperOrganic): string {
	const title = r.title?.trim() || '(no title)';
	const bits = [`[W${index}] ${title}`];
	if (r.date?.trim()) bits.push(`Date: ${r.date.trim()}`);
	if (r.snippet?.trim()) bits.push(r.snippet.trim());
	const d = domainOf(r.link);
	if (d) bits.push(`Domain: ${d}`);
	if (r.link?.trim()) bits.push(`URL: ${r.link.trim()}`);
	return bits.join('\n');
}

function formatSerper(data: SerperJson): string {
	const lines = [
		`[Web search] Serper Google results at ${new Date().toISOString()} (server).`,
		'Verification: treat [Quick answer] as unverified. For latest/current/newest claims, fetch_url 1-2 authoritative URLs before finalizing.',
		data.searchParameters?.q ? `Query: ${data.searchParameters.q}` : ''
	].filter(Boolean);
	const answer = data.answerBox?.answer ?? data.answerBox?.snippet;
	if (answer) {
		lines.push(`[Quick answer]\n${answer}${data.answerBox?.link ? `\nURL: ${data.answerBox.link}` : ''}`);
	}
	if (data.knowledgeGraph?.description) {
		lines.push(
			`[Knowledge]\n${data.knowledgeGraph.title ?? 'Knowledge result'}\n${data.knowledgeGraph.description}` +
				(data.knowledgeGraph.website ? `\nURL: ${data.knowledgeGraph.website}` : '')
		);
	}
	const organic = (data.organic ?? []).slice(0, MAX_RESULTS);
	if (organic.length) lines.push(`[Web results]\n${organic.map((r, i) => formatOrganic(i + 1, r)).join('\n\n')}`);
	return lines.join('\n\n').trim() || 'No results found.';
}

export async function serperWebSearch(apiKey: string, query: string): Promise<WebSearchProviderResult> {
	const q = query.trim();
	if (!q) return { content: 'Error: empty search query' };
	if (!apiKey) return { content: 'Error: Serper search is not configured (set SERPER_API_KEY)' };
	try {
		const res = await fetch(SERPER_SEARCH, {
			method: 'POST',
			headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
			body: JSON.stringify({ q: q.slice(0, 400), gl: 'us', hl: 'en', num: MAX_RESULTS })
		});
		if (!res.ok) return { content: `Error: Serper search failed (${res.status})` };
		const data = (await res.json()) as SerperJson;
		return {
			content: formatSerper(data),
			usage: { provider: 'serper', toolName: 'web_search', costUsd: SERPER_COST_PER_SEARCH_USD, requests: 1, queries: 1 }
		};
	} catch {
		return { content: 'Error: Serper search request failed' };
	}
}
