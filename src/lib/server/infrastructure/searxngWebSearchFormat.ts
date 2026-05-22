import type { SearxngInfobox, SearxngSearchJson, SearxngWebResult } from './searxng.types';

export type FormatSearxngWebOptions = {
	maxResults: number;
	maxChars: number;
	/** ISO timestamp shown to the model so it anchors "today" to the server, not training cutoff. */
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

function formatInfobox(ib: SearxngInfobox): string {
	const label = (ib.infobox ?? ib.title ?? 'Infobox').trim();
	const body = ib.content?.trim();
	const link = (ib.url ?? ib.id)?.trim();
	const bits = [`[Infobox] ${label}`];
	if (body) bits.push(body);
	if (link) bits.push(`URL: ${link}`);
	return bits.join('\n');
}

function formatResult(index: number, r: SearxngWebResult): string {
	const title = r.title?.trim() || '(no title)';
	const bits = [`[${index}] ${title}`];
	if (r.publishedDate) bits.push(`Date: ${r.publishedDate}`);
	if (r.engine) bits.push(`Engine: ${r.engine}`);
	const snippet = r.content?.trim();
	if (snippet) bits.push(snippet);
	const u = r.url?.trim();
	if (u) bits.push(`URL: ${u}`);
	return bits.join('\n');
}

export function formatSearxngWebSearch(
	data: SearxngSearchJson,
	opts: FormatSearxngWebOptions
): string {
	const lines: string[] = [];
	if (opts.retrievedAt) {
		lines.push(
			`Searched at: ${opts.retrievedAt} (server). Live web index — treat titles/snippets as real; do not call them fictional or future-dated vs training cutoff.`
		);
	}
	const q = data.query?.trim();
	if (q) lines.push(`Query: ${q}`);

	const answers = (data.answers ?? []).map((a) => a?.trim()).filter(Boolean) as string[];
	if (answers.length) {
		const block = `[Direct answers]\n${answers.join('\n')}`;
		if (!pushBlock(lines, block, opts.maxChars)) return lines.join('\n\n').slice(0, opts.maxChars);
	}

	const infoboxes = data.infoboxes ?? [];
	for (const ib of infoboxes.slice(0, 3)) {
		const block = formatInfobox(ib);
		if (!block.replace(/\[Infobox\]/, '').trim()) continue;
		if (!pushBlock(lines, block, opts.maxChars)) return lines.join('\n\n').slice(0, opts.maxChars);
	}

	const seen = new Set<string>();
	const unique: SearxngWebResult[] = [];
	for (const r of data.results ?? []) {
		const key = normUrl(r.url);
		if (!key || seen.has(key)) continue;
		seen.add(key);
		unique.push(r);
		if (unique.length >= opts.maxResults) break;
	}

	if (unique.length) {
		const header = '[Web results]';
		const body = unique.map((r, i) => formatResult(i + 1, r)).join('\n\n');
		pushBlock(lines, `${header}\n${body}`, opts.maxChars);
	}

	const suggestions = (data.suggestions ?? []).map((s) => s?.trim()).filter(Boolean) as string[];
	if (suggestions.length && lines.join('\n\n').length < opts.maxChars - 80) {
		pushBlock(
			lines,
			`[Related searches]\n${suggestions.slice(0, 8).map((s) => `- ${s}`).join('\n')}`,
			opts.maxChars
		);
	}

	const out = lines.join('\n\n').trim();
	if (!out) return 'No results found.';
	return out.length > opts.maxChars ? `${out.slice(0, opts.maxChars)}\n…(truncated)` : out;
}
