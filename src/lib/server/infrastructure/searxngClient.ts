export async function searxngWebSearch(searxngUrl: string, query: string): Promise<string> {
	const q = query.trim();
	if (!q) return 'Error: empty search query';
	if (!searxngUrl) return 'Error: web search is not configured (set SEARXNG_URL)';

	const params = new URLSearchParams({
		q: q.slice(0, 400),
		format: 'json',
		engines: 'google,bing,duckduckgo',
		pageno: '1'
	});

	try {
		const res = await fetch(`${searxngUrl}/search?${params}`, {
			headers: { Accept: 'application/json' }
		});

		if (!res.ok) return `Error: SearXNG search failed (${res.status})`;

		const data = (await res.json()) as {
			results?: Array<{ title?: string; url?: string; content?: string; engine?: string }>;
		};

		const results = data.results ?? [];
		if (results.length === 0) return 'No results found.';

		const out: string[] = [];
		for (const r of results.slice(0, 8)) {
			const title = r.title?.trim() || '(no title)';
			const content = r.content?.trim();
			const u = r.url?.trim();
			const bits = [title];
			if (content) bits.push(content);
			if (u) bits.push(u);
			out.push(bits.join('\n'));
		}
		return out.join('\n\n');
	} catch {
		return 'Error: web search failed';
	}
}

export async function searxngImageSearch(searxngUrl: string, query: string): Promise<string> {
	const q = query.trim();
	if (!q) return 'Error: empty search query';
	if (!searxngUrl) return 'Error: image search is not configured (set SEARXNG_URL)';

	const params = new URLSearchParams({
		q: q.slice(0, 400),
		format: 'json',
		categories: 'images',
		count: '6'
	});

	try {
		const res = await fetch(`${searxngUrl}/search?${params}`, {
			headers: { Accept: 'application/json' }
		});

		if (!res.ok) return `Error: SearXNG image search failed (${res.status})`;

		const data = (await res.json()) as {
			results?: Array<{ title?: string; url?: string; img_src?: string }>;
		};

		const results = (data.results ?? []).filter((r) => r.img_src);
		if (results.length === 0) return 'No image results found.';

		const normalizeUrl = (u: string) => (u.startsWith('//') ? `https:${u}` : u);

		const out: string[] = [];
		for (const r of results.slice(0, 6)) {
			const title = (r.title?.trim() || 'image').replace(/[[\]]/g, '');
			const src = normalizeUrl(r.img_src!);
			const sourceUrl = r.url?.trim();
			const line = sourceUrl
				? `[![${title}](${src})](${sourceUrl})`
				: `![${title}](${src})`;
			out.push(line);
		}
		return out.join('\n');
	} catch {
		return 'Error: image search failed';
	}
}
