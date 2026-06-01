import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

type Row = {
	name: string;
	seconds: number;
	webSearchCalls: number;
	fetchUrlCalls: number;
	titleEvents: number;
	errorEvents: number;
	urlCount: number;
	domainCount: number;
};

function count(re: RegExp, text: string): number {
	return text.match(re)?.length ?? 0;
}

function domainsFrom(text: string): Set<string> {
	const urls = text.match(/https?:\/\/[^\s"\\]+/g) ?? [];
	const out = new Set<string>();
	for (const url of urls) {
		try {
			out.add(new URL(url).hostname.replace(/^www\./, ''));
		} catch {
			// ignore parse failures
		}
	}
	return out;
}

function loadRow(dir: string, name: string): Row | null {
	const sse = join(dir, `${name}.sse`);
	const meta = join(dir, `${name}.meta`);
	if (!existsSync(sse)) return null;
	const text = readFileSync(sse, 'utf8');
	const domains = domainsFrom(text);
	const seconds = existsSync(meta) ? Number(readFileSync(meta, 'utf8').trim() || '0') : 0;
	return {
		name,
		seconds,
		webSearchCalls: count(/"type":"tool_call","name":"web_search"/g, text),
		fetchUrlCalls: count(/"type":"tool_call","name":"fetch_url"/g, text),
		titleEvents: count(/"type":"title"/g, text),
		errorEvents: count(/"type":"error"/g, text),
		urlCount: count(/https?:\/\/[^\s"\\]+/g, text),
		domainCount: domains.size
	};
}

function printRow(row: Row) {
	const cost = row.webSearchCalls + row.fetchUrlCalls;
	const quality = row.domainCount >= 2 ? 'ok' : 'low_domains';
	console.log(
		`${row.name.padEnd(16)} | sec=${String(row.seconds).padStart(3)} | tools=${String(cost).padStart(
			2
		)} (web=${row.webSearchCalls}, fetch=${row.fetchUrlCalls}) | domains=${row.domainCount} | urls=${row.urlCount} | titles=${row.titleEvents} | errors=${row.errorEvents} | quality=${quality}`
	);
}

function main() {
	const dir = process.argv[2] ?? 'logs/curl-tests';
	const rows = ['chat_news', 'chat_security', 'chat_title_check']
		.map((n) => loadRow(dir, n))
		.filter((x): x is Row => x !== null);
	if (rows.length === 0) {
		console.log(`No harness outputs found in ${dir}`);
		return;
	}
	console.log('name             | elapsed | tool-cost | evidence | status');
	for (const row of rows) printRow(row);
}

main();
