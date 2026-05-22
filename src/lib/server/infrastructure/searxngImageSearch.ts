import { SEARXNG_IMAGE_MAX_RESULTS } from '../env';

type SearxngImageHit = { title?: string; url?: string; img_src?: string };

function normalizeImageUrl(u: string): string {
	return u.startsWith('//') ? `https:${u}` : u;
}

function formatImageMarkdown(r: SearxngImageHit): string | null {
	if (!r.img_src) return null;
	const title = (r.title?.trim() || 'image').replace(/[[\]]/g, '');
	const src = normalizeImageUrl(r.img_src);
	const sourceUrl = r.url?.trim();
	return sourceUrl ? `[![${title}](${src})](${sourceUrl})` : `![${title}](${src})`;
}

async function fetchSearxngImagePage(
	searxngUrl: string,
	query: string,
	pageno: number
): Promise<SearxngImageHit[]> {
	const params = new URLSearchParams({
		q: query.slice(0, 400),
		format: 'json',
		categories: 'images',
		pageno: String(pageno)
	});
	const res = await fetch(`${searxngUrl}/search?${params}`, {
		headers: { Accept: 'application/json' }
	});
	if (!res.ok) throw new Error(`status ${res.status}`);
	const data = (await res.json()) as { results?: SearxngImageHit[] };
	return data.results ?? [];
}

export async function searxngImageSearch(searxngUrl: string, query: string): Promise<string> {
	const q = query.trim();
	if (!q) return 'Error: empty search query';
	if (!searxngUrl) return 'Error: image search is not configured (set SEARXNG_URL)';

	const max = SEARXNG_IMAGE_MAX_RESULTS;
	const seen = new Set<string>();
	const out: string[] = [];

	try {
		for (let pageno = 1; pageno <= 3 && out.length < max; pageno++) {
			const page = await fetchSearxngImagePage(searxngUrl, q, pageno);
			if (page.length === 0) break;
			let added = 0;
			for (const r of page) {
				if (!r.img_src) continue;
				const src = normalizeImageUrl(r.img_src);
				if (seen.has(src)) continue;
				seen.add(src);
				const line = formatImageMarkdown(r);
				if (line) out.push(line);
				added++;
				if (out.length >= max) break;
			}
			if (added === 0) break;
		}
		if (out.length === 0) return 'No image results found.';
		return out.join('\n');
	} catch {
		return 'Error: image search failed';
	}
}
