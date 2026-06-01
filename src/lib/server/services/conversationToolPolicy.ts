import type { ToolCall } from '../domain/ChatProvider.interface';

type SearchMode = 'quick' | 'deep';
type SearchSignal = 'weak' | 'ok' | 'strong';

type ToolPolicyState = {
	mode: SearchMode;
	webSearchUsed: number;
	fetchUrlUsed: number;
	maxWebSearch: number;
	maxFetchUrl: number;
	weakWebSearchStreak: number;
	escalationLeft: number;
	seenQueries: Set<string>;
};

const QUICK_BASE = { web: 2, fetch: 2 };
const DEEP_BASE = { web: 4, fetch: 5 };
const ESCALATION_STEPS = 2;
const URL_RE = /URL:\s*(https?:\/\/\S+)/g;

function inferMode(prompt: string): SearchMode {
	if (
		prompt.length > 800 ||
		/(deep research|thorough|comprehensive|exhaustive|compare.+sources|detailed analysis)/i.test(
			prompt
		)
	) {
		return 'deep';
	}
	return 'quick';
}

function normalizeQuery(query: string): string {
	return query
		.toLowerCase()
		.replace(/["'`()[\]{}:;,.!?]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function webSearchSignal(result: string): { signal: SearchSignal; domainCount: number } {
	const hasWebBlock = result.includes('[Web results]') || result.includes('[News]');
	const domains = new Set<string>();
	let m: RegExpExecArray | null = null;
	while ((m = URL_RE.exec(result)) !== null) {
		try {
			domains.add(new URL(m[1]).hostname.replace(/^www\./, ''));
		} catch {
			// ignore malformed urls from tool text
		}
	}
	const domainCount = domains.size;
	if (!hasWebBlock || domainCount === 0 || result.length < 900) return { signal: 'weak', domainCount };
	if (domainCount >= 2 && result.length > 2500) return { signal: 'strong', domainCount };
	return { signal: 'ok', domainCount };
}

export function initToolPolicy(prompt: string): ToolPolicyState {
	const mode = inferMode(prompt);
	const base = mode === 'deep' ? DEEP_BASE : QUICK_BASE;
	return {
		mode,
		webSearchUsed: 0,
		fetchUrlUsed: 0,
		maxWebSearch: base.web,
		maxFetchUrl: base.fetch,
		weakWebSearchStreak: 0,
		escalationLeft: ESCALATION_STEPS,
		seenQueries: new Set<string>()
	};
}

export function beforeToolExecution(
	state: ToolPolicyState,
	call: ToolCall
): { allowed: boolean; resultText?: string } {
	if (call.name === 'web_search') {
		const q = normalizeQuery(String(call.arguments?.query ?? ''));
		if (!q) return { allowed: false, resultText: 'Policy: web_search skipped (empty query).' };
		if (state.seenQueries.has(q)) {
			return {
				allowed: false,
				resultText:
					'Policy: web_search skipped (near-duplicate query this turn). Use existing results and synthesize.'
			};
		}
		if (state.webSearchUsed >= state.maxWebSearch) {
			return {
				allowed: false,
				resultText:
					`Policy: web_search budget reached (${state.maxWebSearch}). Synthesize from gathered sources.`
			};
		}
		state.seenQueries.add(q);
		state.webSearchUsed += 1;
		return { allowed: true };
	}
	if (call.name === 'fetch_url') {
		if (state.fetchUrlUsed >= state.maxFetchUrl) {
			return {
				allowed: false,
				resultText:
					`Policy: fetch_url budget reached (${state.maxFetchUrl}). Synthesize from fetched evidence.`
			};
		}
		state.fetchUrlUsed += 1;
		return { allowed: true };
	}
	return { allowed: true };
}

export function afterToolExecution(state: ToolPolicyState, call: ToolCall, result: string): void {
	if (call.name !== 'web_search') return;
	const { signal, domainCount } = webSearchSignal(result);
	state.weakWebSearchStreak = signal === 'weak' ? state.weakWebSearchStreak + 1 : 0;
	if (state.weakWebSearchStreak >= 2 && state.escalationLeft > 0) {
		state.maxWebSearch += 1;
		state.escalationLeft -= 1;
		state.weakWebSearchStreak = 0;
	}
	if (domainCount < 2 && state.escalationLeft > 0 && state.fetchUrlUsed > 0) {
		state.maxFetchUrl += 1;
		state.escalationLeft -= 1;
	}
}
