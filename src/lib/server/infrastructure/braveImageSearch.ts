import {
	BRAVE_SEARCH_COUNTRY,
	BRAVE_SEARCH_IMAGE_MAX_RESULTS,
	BRAVE_SEARCH_LANG
} from '../env';
import type { BraveImageHit, BraveImageSearchJson } from './braveSearch.types';
import { isImageUrlLoadable } from './braveImageUrlCheck';
import { braveImagesGet } from './braveSearchRequest';
import type { ExternalToolUsage } from '../domain/ExternalToolUsage.types';

const BRAVE_SEARCH_COST_PER_REQUEST_USD = 0.005;
export type BraveImageSearchResult = { content: string; usage?: ExternalToolUsage };

/** Brave-proxied thumbnails load reliably; direct hotlinks often 403 in the browser. */
function imageSrc(r: BraveImageHit): string | null {
	const thumb = r.thumbnail?.src?.trim();
	if (thumb) return thumb;
	return r.properties?.url?.trim() || null;
}

function formatImageMarkdown(r: BraveImageHit, src: string): string {
	const title = (r.title?.trim() || 'image').replace(/[[\]]/g, '');
	const sourceUrl = r.url?.trim();
	return sourceUrl ? `[![${title}](${src})](${sourceUrl})` : `![${title}](${src})`;
}

async function pickLoadableImages(hits: BraveImageHit[], max: number): Promise<string[]> {
	const seen = new Set<string>();
	const trusted: string[] = [];
	const toProbe: { src: string; line: string }[] = [];

	for (const r of hits) {
		const src = imageSrc(r);
		if (!src || seen.has(src)) continue;
		seen.add(src);
		const line = formatImageMarkdown(r, src);
		if (r.thumbnail?.src?.trim()) trusted.push(line);
		else toProbe.push({ src, line });
	}

	const out = trusted.slice(0, max);
	if (out.length >= max) return out;

	const checks = await Promise.all(
		toProbe.map(async (c) => ({ c, ok: await isImageUrlLoadable(c.src) }))
	);
	for (const { c, ok } of checks) {
		if (!ok) continue;
		out.push(c.line);
		if (out.length >= max) break;
	}
	return out;
}

export async function braveImageSearchWithUsage(
	apiKey: string,
	query: string
): Promise<BraveImageSearchResult> {
	const q = query.trim();
	if (!q) return { content: 'Error: empty search query' };
	if (!apiKey) return { content: 'Error: image search is not configured (set BRAVE_SEARCH_API_KEY)' };

	const max = BRAVE_SEARCH_IMAGE_MAX_RESULTS;
	const params = new URLSearchParams({
		q: q.slice(0, 400),
		count: String(Math.min(50, Math.max(max * 2, max + 8))),
		country: BRAVE_SEARCH_COUNTRY,
		search_lang: BRAVE_SEARCH_LANG,
		spellcheck: 'true',
		safesearch: 'strict'
	});

	try {
		const res = await braveImagesGet(apiKey, params);
		const usage = {
			provider: 'brave_search' as const,
			toolName: 'image_search',
			requests: 1,
			costUsd: BRAVE_SEARCH_COST_PER_REQUEST_USD
		};
		if (!res.ok) return { content: `Error: Brave image search failed (${res.status})`, usage };
		const data = (await res.json()) as BraveImageSearchJson;
		const out = await pickLoadableImages(data.results ?? [], max);
		if (out.length === 0) return { content: 'No image results found.', usage };
		return { content: out.join('\n'), usage };
	} catch {
		return { content: 'Error: image search failed' };
	}
}

export async function braveImageSearch(apiKey: string, query: string): Promise<string> {
	return (await braveImageSearchWithUsage(apiKey, query)).content;
}
