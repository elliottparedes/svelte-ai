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
import type { ExternalToolUsage } from '../domain/ExternalToolUsage.types';

export { braveImageSearch } from './braveImageSearch';

const WEB_PAGE_SIZE = 20;
const BRAVE_SEARCH_COST_PER_REQUEST_USD = 0.005;

export type BraveSearchResult = { content: string; usage?: ExternalToolUsage };

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

export async function braveWebSearchWithUsage(apiKey: string, query: string): Promise<BraveSearchResult> {
	const q = query.trim();
	if (!q) return { content: 'Error: empty search query' };
	if (!apiKey) return { content: 'Error: web search is not configured (set BRAVE_SEARCH_API_KEY)' };

	const want = BRAVE_SEARCH_MAX_RESULTS;
	const firstCount = Math.min(WEB_PAGE_SIZE, want);
	const variants = buildBraveQueryVariants(q);
	let requests = 0;
	const usage = () => ({
		provider: 'brave_search' as const,
		toolName: 'web_search',
		requests,
		costUsd: requests * BRAVE_SEARCH_COST_PER_REQUEST_USD
	});

	try {
		const variantResponses = await Promise.all(
			variants.map(async (variant, index) => {
				requests += 1;
				const res = await braveWebGet(
					apiKey,
					webParams(variant, index === 0 ? firstCount : Math.min(10, firstCount), 0)
				);
				if (!res.ok) return null;
				return (await res.json()) as BraveWebSearchJson;
			})
		);
		const valid = variantResponses.filter((x): x is BraveWebSearchJson => x !== null);
		if (valid.length === 0) return { content: 'Error: Brave web search failed', usage: usage() };

		const primary = valid[0];
		const remaining = want - (primary.web?.results?.length ?? 0);
		if (remaining > 0 && want > WEB_PAGE_SIZE && variants.length > 0) {
			requests += 1;
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
		if (!has) return { content: 'No results found.', usage: usage() };

		return {
			content: formatBraveWebSearch(data, {
				maxResults: want,
				maxChars: BRAVE_SEARCH_MAX_OUTPUT_CHARS,
				retrievedAt: new Date().toISOString()
			}),
			usage: usage()
		};
	} catch {
		return { content: 'Error: web search failed', usage: requests > 0 ? usage() : undefined };
	}
}

export async function braveWebSearch(apiKey: string, query: string): Promise<string> {
	return (await braveWebSearchWithUsage(apiKey, query)).content;
}
