/**
 * Smoke-test summary model directly against OpenRouter.
 * Usage: npm run summary:ping
 */
import 'dotenv/config';
import {
	CHAT_SUMMARY_MAX_TOKENS,
	CHAT_SUMMARY_MODEL,
	OPENROUTER_API_KEY,
	OPENROUTER_HTTP_REFERER
} from '../src/lib/server/env';

const BASE = 'https://openrouter.ai/api/v1/chat/completions';

async function main() {
	if (!OPENROUTER_API_KEY?.trim()) {
		console.error('Missing OPENROUTER_API_KEY');
		process.exit(1);
	}
	const payload = {
		model: CHAT_SUMMARY_MODEL,
		stream: false,
		max_tokens: Math.min(256, CHAT_SUMMARY_MAX_TOKENS),
		messages: [
			{
				role: 'system',
				content:
					'Compress chat history into concise bullets. Preserve key decisions, constraints, and open questions.'
			},
			{
				role: 'user',
				content:
					'Messages:\n- user: Plan a Japan trip in April\n- assistant: Ask about budget and cities\n- user: Budget $3,000 and must include Kyoto'
			}
		]
	};
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${OPENROUTER_API_KEY}`,
		'X-Title': 'Inkstream'
	};
	if (OPENROUTER_HTTP_REFERER) headers['HTTP-Referer'] = OPENROUTER_HTTP_REFERER;
	const res = await fetch(BASE, { method: 'POST', headers, body: JSON.stringify(payload) });
	const body = await res.text();
	if (!res.ok) {
		console.error(`summary:ping failed (${res.status}) model=${CHAT_SUMMARY_MODEL}`);
		console.error(body.slice(0, 500));
		process.exit(1);
	}
	const json = JSON.parse(body) as { choices?: Array<{ message?: { content?: string } }> };
	const content = json.choices?.[0]?.message?.content?.trim() ?? '';
	if (!content) {
		console.error(`summary:ping empty output model=${CHAT_SUMMARY_MODEL}`);
		process.exit(1);
	}
	console.log(`summary:ping OK model=${CHAT_SUMMARY_MODEL}`);
	console.log(content.slice(0, 240));
}

main().catch((err) => {
	console.error(err instanceof Error ? err.message : String(err));
	process.exit(1);
});
