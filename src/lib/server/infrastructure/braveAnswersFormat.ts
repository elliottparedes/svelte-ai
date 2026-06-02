import type { ExternalToolUsage } from '../domain/ExternalToolUsage.types';

type Citation = { number?: number; url?: string; snippet?: string };
type UsageJson = Record<string, unknown>;

const TAG_RE = /<(citation|enum_item|usage)>(.*?)<\/\1>/gs;

function asNumber(value: unknown): number | undefined {
	const n = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(n) ? n : undefined;
}

function parseJson<T>(raw: string): T | null {
	try {
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

function citationLine(c: Citation, fallback: number): string {
	const number = c.number ?? fallback;
	const url = c.url?.trim();
	const snippet = c.snippet?.trim();
	if (!url) return '';
	return snippet ? `[${number}] ${url}\nSnippet: ${snippet}` : `[${number}] ${url}`;
}

export function usageFromBraveAnswers(raw: UsageJson | null, toolName: string): ExternalToolUsage | undefined {
	if (!raw) return undefined;
	const costUsd = asNumber(raw['X-Request-Total-Cost']) ?? 0;
	return {
		provider: 'brave_answers',
		toolName,
		costUsd,
		requests: asNumber(raw['X-Request-Requests']),
		queries: asNumber(raw['X-Request-Queries']),
		inputTokens: asNumber(raw['X-Request-Tokens-In']),
		outputTokens: asNumber(raw['X-Request-Tokens-Out'])
	};
}

export function formatBraveAnswers(raw: string): { content: string; usage?: ExternalToolUsage } {
	const citations: string[] = [];
	let usage: ExternalToolUsage | undefined;
	let body = raw;
	let citationIndex = 1;
	for (const match of raw.matchAll(TAG_RE)) {
		const [full, tag, json] = match;
		if (tag === 'citation') {
			const line = citationLine(parseJson<Citation>(json) ?? {}, citationIndex++);
			if (line) citations.push(line);
		}
		if (tag === 'usage') usage = usageFromBraveAnswers(parseJson<UsageJson>(json), 'web_search');
		body = body.replace(full, tag === 'citation' ? '' : '');
	}
	const lines = [
		'[Brave Answers]',
		`Answered at: ${new Date().toISOString()} (server). Grounded by Brave Answers; cite the source URLs below.`,
		body.trim(),
		citations.length ? `[Sources]\n${citations.join('\n\n')}` : ''
	].filter(Boolean);
	return { content: lines.join('\n\n'), usage };
}
