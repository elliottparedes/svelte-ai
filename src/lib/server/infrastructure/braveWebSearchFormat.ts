import type {
	BraveFaqHit,
	BraveInfoboxResult,
	BraveNewsHit,
	BraveWebHit,
	BraveWebSearchJson
} from './braveSearch.types';

export type FormatBraveWebOptions = {
	maxResults: number;
	maxChars: number;
	retrievedAt?: string;
};

function normUrl(url: string | undefined): string {
	return (url ?? '').trim().toLowerCase().replace(/\/$/, '');
}

function pushBlock(lines: string[], block: string, maxChars: number): boolean {
	const next = lines.length ? `${lines.join('\n')}\n\n${block}` : block;
	if (next.length > maxChars) return false;
	lines.push(block);
	return true;
}

function stripDecorations(s: string): string {
	return s.replace(/\uE000/g, '').replace(/\uE001/g, '').trim();
}

function formatWebHit(index: number, r: BraveWebHit): string {
	const title = r.title?.trim() || '(no title)';
	const bits = [`[${index}] ${title}`];
	const when = r.page_age?.trim() || r.age?.trim();
	if (when) bits.push(`Date: ${when}`);
	const snippets = [
		r.description?.trim(),
		...(r.extra_snippets ?? []).map((s) => s?.trim())
	].filter(Boolean) as string[];
	const body = [...new Set(snippets.map(stripDecorations))].join(' ');
	if (body) bits.push(body);
	const u = r.url?.trim();
	if (u) bits.push(`URL: ${u}`);
	return bits.join('\n');
}

function formatNewsHit(index: number, r: BraveNewsHit): string {
	const title = r.title?.trim() || '(no title)';
	const bits = [`[${index}] ${title}`];
	const when = r.page_age?.trim() || r.age?.trim();
	if (when) bits.push(`Date: ${when}`);
	const snippet = stripDecorations(r.description?.trim() ?? '');
	if (snippet) bits.push(snippet);
	const u = r.url?.trim();
	if (u) bits.push(`URL: ${u}`);
	return bits.join('\n');
}

function formatFaq(items: BraveFaqHit[]): string {
	const lines = items
		.slice(0, 5)
		.map((f) => {
			const q = f.question?.trim();
			const a = f.answer?.trim();
			if (!q) return a ? `A: ${a}` : '';
			return a ? `Q: ${q}\nA: ${a}` : `Q: ${q}`;
		})
		.filter(Boolean);
	return lines.length ? `[FAQ]\n${lines.join('\n\n')}` : '';
}

function formatInfobox(ib: BraveInfoboxResult): string {
	const label = ib.title?.trim() || 'Infobox';
	const body = (ib.long_desc ?? ib.description)?.trim();
	const link = ib.url?.trim();
	const bits = [`[Infobox] ${label}`];
	if (body) bits.push(body);
	if (link) bits.push(`URL: ${link}`);
	return bits.join('\n');
}

export function formatBraveWebSearch(data: BraveWebSearchJson, opts: FormatBraveWebOptions): string {
	const lines: string[] = [];
	if (opts.retrievedAt) {
		lines.push(
			`Searched at: ${opts.retrievedAt} (server). Live Brave web index — treat titles/snippets as real; do not call them fictional or future-dated vs training cutoff.`
		);
	}
	const q = data.query?.original?.trim();
	const altered = data.query?.altered?.trim();
	if (q) lines.push(altered && altered !== q ? `Query: ${q} (corrected: ${altered})` : `Query: ${q}`);

	const faqBlock = formatFaq(data.faq?.results ?? []);
	if (faqBlock && !pushBlock(lines, faqBlock, opts.maxChars)) {
		return lines.join('\n\n').slice(0, opts.maxChars);
	}

	for (const ib of (data.infobox?.results ?? []).slice(0, 2)) {
		const block = formatInfobox(ib);
		if (!pushBlock(lines, block, opts.maxChars)) return lines.join('\n\n').slice(0, opts.maxChars);
	}

	const news = (data.news?.results ?? []).slice(0, 6);
	if (news.length) {
		const body = news.map((r, i) => formatNewsHit(i + 1, r)).join('\n\n');
		if (!pushBlock(lines, `[News]\n${body}`, opts.maxChars)) {
			return lines.join('\n\n').slice(0, opts.maxChars);
		}
	}

	const seen = new Set<string>();
	const web: BraveWebHit[] = [];
	for (const r of data.web?.results ?? []) {
		const key = normUrl(r.url);
		if (!key || seen.has(key)) continue;
		seen.add(key);
		web.push(r);
		if (web.length >= opts.maxResults) break;
	}
	if (web.length) {
		const body = web.map((r, i) => formatWebHit(i + 1, r)).join('\n\n');
		pushBlock(lines, `[Web results]\n${body}`, opts.maxChars);
	}

	const out = lines.join('\n\n').trim();
	if (!out) return 'No results found.';
	const footer =
		'Note: Snippets only — not full pages. Call fetch_url on key URLs; use offset to paginate through long articles.';
	const body = out.length > opts.maxChars ? `${out.slice(0, opts.maxChars)}\n…(truncated)` : out;
	if (body.length + footer.length + 2 <= opts.maxChars) return `${body}\n\n${footer}`;
	return body;
}
