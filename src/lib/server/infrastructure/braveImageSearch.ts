import {
	BRAVE_SEARCH_COUNTRY,
	BRAVE_SEARCH_IMAGE_MAX_RESULTS,
	BRAVE_SEARCH_LANG
} from '../env';
import type { BraveImageHit, BraveImageSearchJson } from './braveSearch.types';
import { isImageUrlLoadable } from './braveImageUrlCheck';
import { braveImagesGet } from './braveSearchRequest';

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

export async function braveImageSearch(apiKey: string, query: string): Promise<string> {
	const q = query.trim();
	if (!q) return 'Error: empty search query';
	if (!apiKey) return 'Error: image search is not configured (set BRAVE_SEARCH_API_KEY)';

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
		if (!res.ok) return `Error: Brave image search failed (${res.status})`;
		const data = (await res.json()) as BraveImageSearchJson;
		const out = await pickLoadableImages(data.results ?? [], max);
		if (out.length === 0) return 'No image results found.';
		return out.join('\n');
	} catch {
		return 'Error: image search failed';
	}
}
