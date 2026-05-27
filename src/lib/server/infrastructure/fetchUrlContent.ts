import { FETCH_URL_MAX_CHARS, FETCH_URL_MAX_PAGE_CHARS } from '../env';
import { htmlToPageText } from './htmlToPageText';

const UA =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function parseOffset(raw: unknown): number {
	const n = Number(raw ?? 0);
	if (!Number.isFinite(n) || n < 0) return 0;
	return Math.floor(n);
}

function formatSlice(url: string, text: string, offset: number, chunk: string): string {
	const total = text.length;
	const end = offset + chunk.length;
	const header = `URL: ${url}\nPage text: ${total.toLocaleString()} characters total | showing ${offset.toLocaleString()}–${end.toLocaleString()}\n`;
	const body = `${header}\n${chunk}`;
	if (end >= total) return body;
	return `${body}\n\n— More content available. Call fetch_url again with the same url and offset=${end}.`;
}

export async function fetchUrlContent(
	url: string,
	offsetRaw?: unknown
): Promise<string> {
	const raw = url.trim();
	if (!raw) return 'Error: empty URL';

	let parsed: URL;
	try {
		parsed = new URL(raw);
	} catch {
		return 'Error: invalid URL';
	}
	if (!['http:', 'https:'].includes(parsed.protocol)) return 'Error: only http(s) URLs are supported';

	const offset = parseOffset(offsetRaw);
	if (offset >= FETCH_URL_MAX_PAGE_CHARS) {
		return `Error: offset ${offset} exceeds max page size (${FETCH_URL_MAX_PAGE_CHARS})`;
	}

	try {
		const res = await fetch(parsed.toString(), {
			headers: {
				'User-Agent': UA,
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
			}
		});
		if (!res.ok) return `Error: HTTP ${res.status}`;
		const html = await res.text();
		const text = htmlToPageText(html).slice(0, FETCH_URL_MAX_PAGE_CHARS);
		if (!text) return 'Error: no readable text on page';
		if (offset >= text.length) {
			return `Error: offset ${offset} is past end of page (${text.length} characters)`;
		}
		const chunk = text.slice(offset, offset + FETCH_URL_MAX_CHARS);
		return formatSlice(parsed.toString(), text, offset, chunk);
	} catch {
		return 'Error: failed to fetch URL';
	}
}
