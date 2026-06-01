import {
	BRAVE_SEARCH_COUNTRY,
	BRAVE_SEARCH_EXTRA_SNIPPETS,
	BRAVE_SEARCH_LANG,
	BRAVE_SEARCH_MAX_OUTPUT_CHARS,
	BRAVE_SEARCH_MAX_RESULTS
} from '../env';
import type { BraveWebSearchJson } from './braveSearch.types';
import { braveWebGet } from './braveSearchRequest';
import { buildBraveQueryVariants, mergeBraveWebSearchResults } from './braveWebSearchMerge';
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

export async function braveWebSearch(apiKey: string, query: string): Promise<string> {
	const q = query.trim();
	if (!q) return 'Error: empty search query';
	if (!apiKey) return 'Error: web search is not configured (set BRAVE_SEARCH_API_KEY)';

	const want = BRAVE_SEARCH_MAX_RESULTS;
	const firstCount = Math.min(WEB_PAGE_SIZE, want);
	const variants = buildBraveQueryVariants(q);

	try {
		const variantResponses = await Promise.all(
			variants.map(async (variant, index) => {
				const res = await braveWebGet(
					apiKey,
					webParams(variant, index === 0 ? firstCount : Math.min(10, firstCount), 0)
				);
				if (!res.ok) return null;
				return (await res.json()) as BraveWebSearchJson;
			})
		);
		const valid = variantResponses.filter((x): x is BraveWebSearchJson => x !== null);
		if (valid.length === 0) return 'Error: Brave web search failed';

		const primary = valid[0];
		const remaining = want - (primary.web?.results?.length ?? 0);
		if (remaining > 0 && want > WEB_PAGE_SIZE && variants.length > 0) {
			const res2 = await braveWebGet(
				apiKey,
				webParams(variants[0], Math.min(WEB_PAGE_SIZE, remaining), 1)
			);
			if (res2.ok) {
				valid.push((await res2.json()) as BraveWebSearchJson);
			}
		}
		const data = mergeBraveWebSearchResults(valid, want);

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
