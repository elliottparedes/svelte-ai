import type { BraveNewsHit, BraveWebHit, BraveWebSearchJson } from './braveSearch.types';

const BOOSTS = [1, 0.75, 0.6];

function normKey(url: string | undefined, title: string | undefined): string {
	const u = (url ?? '').trim().toLowerCase().replace(/\/$/, '');
	if (u) return u;
	return (title ?? '').trim().toLowerCase();
}

function rankMerge<T extends { url?: string; title?: string }>(
	lists: readonly (readonly T[])[],
	limit: number
): T[] {
	const scored = new Map<string, { score: number; item: T }>();
	for (let i = 0; i < lists.length; i++) {
		const boost = BOOSTS[i] ?? BOOSTS[BOOSTS.length - 1];
		for (let rank = 0; rank < lists[i].length; rank++) {
			const item = lists[i][rank];
			const key = normKey(item.url, item.title);
			if (!key) continue;
			const prev = scored.get(key);
			const score = (prev?.score ?? 0) + boost / (rank + 1);
			scored.set(key, { score, item: prev?.item ?? item });
		}
	}
	return [...scored.values()]
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((x) => x.item);
}

function normalizeQuery(q: string): string {
	return q.replace(/["'`()[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function buildBraveQueryVariants(query: string): string[] {
	const base = query.trim();
	if (!base) return [];
	const out = [base];
	const normalized = normalizeQuery(base);
	if (normalized && normalized.toLowerCase() !== base.toLowerCase()) out.push(normalized);
	const needsFreshness = /(latest|today|current|news|update|recent|this week|this month)/i.test(base);
	const hasYear = /\b20\d{2}\b/.test(base);
	if (needsFreshness && !hasYear) out.push(`${normalized || base} ${new Date().getUTCFullYear()}`);
	return [...new Set(out)].slice(0, 3);
}

export function mergeBraveWebSearchResults(
	items: readonly BraveWebSearchJson[],
	maxWebResults: number
): BraveWebSearchJson {
	const webLists: BraveWebHit[][] = items.map((x) => x.web?.results ?? []);
	const newsLists: BraveNewsHit[][] = items.map((x) => x.news?.results ?? []);
	const web = rankMerge(webLists, maxWebResults);
	const news = rankMerge(newsLists, 8);
	const first = items[0] ?? {};
	return {
		query: first.query,
		faq: first.faq,
		infobox: first.infobox,
		news: { results: news },
		web: { results: web }
	};
}
