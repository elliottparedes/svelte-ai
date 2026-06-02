import {
	BRAVE_ANSWERS_COUNTRY,
	BRAVE_ANSWERS_ENABLE_RESEARCH,
	BRAVE_ANSWERS_LANG,
	BRAVE_ANSWERS_MAX_COMPLETION_TOKENS,
	BRAVE_ANSWERS_SEARCH_CONTEXT_SIZE
} from '../env/braveEnv';
import type { ExternalToolUsage } from '../domain/ExternalToolUsage.types';
import { formatBraveAnswers, usageFromBraveAnswers } from './braveAnswersFormat';

const BRAVE_ANSWERS = 'https://api.search.brave.com/res/v1/chat/completions';

export type BraveAnswersResult = {
	content: string;
	usage?: ExternalToolUsage;
};

function requestBody(query: string): Record<string, unknown> {
	return {
		model: 'brave',
		stream: true,
		max_completion_tokens: BRAVE_ANSWERS_MAX_COMPLETION_TOKENS,
		messages: [{ role: 'user', content: query }],
		web_search_options: {
			search_context_size: BRAVE_ANSWERS_SEARCH_CONTEXT_SIZE,
			country: BRAVE_ANSWERS_COUNTRY,
			language: BRAVE_ANSWERS_LANG,
			enable_citations: true,
			enable_research: BRAVE_ANSWERS_ENABLE_RESEARCH
		}
	};
}

function contentFromSseLine(line: string): string {
	if (!line.startsWith('data: ')) return '';
	const json = line.slice(6).trim();
	if (!json || json === '[DONE]') return '';
	try {
		const parsed = JSON.parse(json) as {
			choices?: { delta?: { content?: string } }[];
		};
		return parsed.choices?.[0]?.delta?.content ?? '';
	} catch {
		return '';
	}
}

async function readAnswerStream(res: Response): Promise<string> {
	if (!res.body) return '';
	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let carry = '';
	let out = '';
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (value) {
				carry += decoder.decode(value, { stream: true });
				const lines = carry.split('\n');
				carry = lines.pop() ?? '';
				out += lines.map(contentFromSseLine).join('');
			}
			if (done) break;
		}
		carry += decoder.decode();
		if (carry) out += carry.split('\n').map(contentFromSseLine).join('');
		return out;
	} finally {
		reader.releaseLock();
	}
}

export async function braveAnswersSearch(apiKey: string, query: string): Promise<BraveAnswersResult> {
	const q = query.trim();
	if (!q) return { content: 'Error: empty search query' };
	if (!apiKey) return { content: 'Error: Brave Answers is not configured (set BRAVE_ANSWER_API_KEY)' };
	try {
		const res = await fetch(BRAVE_ANSWERS, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'text/event-stream',
				'X-Subscription-Token': apiKey
			},
			body: JSON.stringify(requestBody(q))
		});
		if (!res.ok) return { content: `Error: Brave Answers failed (${res.status})` };
		const formatted = formatBraveAnswers(await readAnswerStream(res));
		const headerUsage = usageFromBraveAnswers(Object.fromEntries(res.headers.entries()), 'web_search');
		return { content: formatted.content, usage: formatted.usage ?? headerUsage };
	} catch {
		return { content: 'Error: Brave Answers request failed' };
	}
}
