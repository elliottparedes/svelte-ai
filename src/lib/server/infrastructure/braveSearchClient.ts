import {
	BRAVE_SEARCH_COUNTRY,
	BRAVE_SEARCH_EXTRA_SNIPPETS,
	BRAVE_SEARCH_LANG,
	BRAVE_SEARCH_MAX_OUTPUT_CHARS,
	BRAVE_SEARCH_MAX_RESULTS
} from '../env';
import type { BraveWebSearchJson } from './braveSearch.types';
import { braveWebGet } from './braveSearchRequest';
import { formatBraveWebSearch } from './braveWebSearchFormat';

export { braveImageSearch } from './braveImageSearch';

const WEB_PAGE_SIZE = 20;

function webParams(q: string, count: number, offset: number): URLSearchParams {
	const p = new URLSearchParams({
		q: q.slice(0, 400),
		count: String(count),
		offset: String(offset),
		country: BRAVE_SEARCH_COUNTRY,
		search_lang: BRAVE_SEARCH_LANG,
		spellcheck: 'true',
		text_decorations: 'false',
		safesearch: 'moderate',
		result_filter: 'web,news,faq,infobox'
	});
	if (BRAVE_SEARCH_EXTRA_SNIPPETS) p.set('extra_snippets', 'true');
	return p;
}

function mergeWebPages(a: BraveWebSearchJson, b: BraveWebSearchJson): BraveWebSearchJson {
	return {
		query: a.query ?? b.query,
		faq: a.faq ?? b.faq,
		infobox: a.infobox ?? b.infobox,
		news: a.news ?? b.news,
		web: { results: [...(a.web?.results ?? []), ...(b.web?.results ?? [])] }
	};
}

export async function braveWebSearch(apiKey: string, query: string): Promise<string> {
	const q = query.trim();
	if (!q) return 'Error: empty search query';
	if (!apiKey) return 'Error: web search is not configured (set BRAVE_SEARCH_API_KEY)';

	const want = BRAVE_SEARCH_MAX_RESULTS;
	const firstCount = Math.min(WEB_PAGE_SIZE, want);

	try {
		const res = await braveWebGet(apiKey, webParams(q, firstCount, 0));
		if (!res.ok) return `Error: Brave web search failed (${res.status})`;

		let data = (await res.json()) as BraveWebSearchJson;
		const remaining = want - (data.web?.results?.length ?? 0);
		if (remaining > 0 && want > WEB_PAGE_SIZE) {
			const res2 = await braveWebGet(
				apiKey,
				webParams(q, Math.min(WEB_PAGE_SIZE, remaining), 1)
			);
			if (res2.ok) {
				const page2 = (await res2.json()) as BraveWebSearchJson;
				data = mergeWebPages(data, page2);
			}
		}

		const has =
			(data.web?.results?.length ?? 0) > 0 ||
			(data.news?.results?.length ?? 0) > 0 ||
			(data.faq?.results?.length ?? 0) > 0 ||
			(data.infobox?.results?.length ?? 0) > 0;
		if (!has) return 'No results found.';

		return formatBraveWebSearch(data, {
			maxResults: want,
			maxChars: BRAVE_SEARCH_MAX_OUTPUT_CHARS,
			retrievedAt: new Date().toISOString()
		});
	} catch {
		return 'Error: web search failed';
	}
}
