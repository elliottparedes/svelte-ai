import { SEARXNG_ENGINES, SEARXNG_MAX_OUTPUT_CHARS, SEARXNG_MAX_RESULTS } from '../env';
import type { SearxngSearchJson } from './searxng.types';
import { formatSearxngWebSearch } from './searxngWebSearchFormat';

export { searxngImageSearch } from './searxngImageSearch';

export async function searxngWebSearch(searxngUrl: string, query: string): Promise<string> {
	const q = query.trim();
	if (!q) return 'Error: empty search query';
	if (!searxngUrl) return 'Error: web search is not configured (set SEARXNG_URL)';

	const params = new URLSearchParams({
		q: q.slice(0, 400),
		format: 'json',
		pageno: '1'
	});
	const engines = SEARXNG_ENGINES.trim();
	if (engines) params.set('engines', engines);

	try {
		const res = await fetch(`${searxngUrl}/search?${params}`, {
			headers: { Accept: 'application/json' }
		});

		if (!res.ok) return `Error: SearXNG search failed (${res.status})`;

		const data = (await res.json()) as SearxngSearchJson;
		const results = data.results ?? [];
		const hasExtra =
			(data.answers?.length ?? 0) > 0 ||
			(data.infoboxes?.length ?? 0) > 0 ||
			results.length > 0;
		if (!hasExtra) return 'No results found.';

		return formatSearxngWebSearch(data, {
			maxResults: SEARXNG_MAX_RESULTS,
			maxChars: SEARXNG_MAX_OUTPUT_CHARS,
			retrievedAt: new Date().toISOString()
		});
	} catch {
		return 'Error: web search failed';
	}
}