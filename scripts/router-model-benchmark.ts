/**
 * Benchmark OpenRouter models for the chat tier router (JSON tier classification).
 * Usage: npm run router:benchmark
 * Requires OPENROUTER_API_KEY in .env
 *
 * Manual curl (replace MODEL and KEY):
 * curl -s https://openrouter.ai/api/v1/chat/completions \
 *   -H "Authorization: Bearer $OPENROUTER_API_KEY" \
 *   -H "Content-Type: application/json" \
 *   -d '{"model":"google/gemini-2.0-flash-lite-001","stream":false,"max_tokens":48,"messages":[{"role":"system","content":"Reply JSON only: {\"tier\":\"ultra_cheap\"|\"standard\"|\"complex\"|\"tools\"|\"vision\"}"},{"role":"user","content":"message: hi"}]}'
 */
import 'dotenv/config';
import { classifyPromptTier } from '../src/lib/server/services/modelRouterLlmClassify';
import type { ModelRoutingTier } from '../src/lib/shared/modelRoutingTier';

const CANDIDATES = [
	'google/gemini-2.0-flash-lite-001',
	'google/gemini-2.5-flash-lite',
	'z-ai/glm-4.7-flash'
] as const;

type Case = { label: string; prompt: string; expect: ModelRoutingTier; tools?: string[] };

const CASES: Case[] = [
	{ label: 'greeting', prompt: 'Hey!', expect: 'ultra_cheap' },
	{ label: 'thanks', prompt: 'Thanks, that helped.', expect: 'ultra_cheap' },
	{ label: 'simple_fact', prompt: 'Capital of France?', expect: 'ultra_cheap' },
	{ label: 'standard_qa', prompt: 'Summarize the causes of World War I in a paragraph.', expect: 'standard' },
	{ label: 'email_draft', prompt: 'Write a polite email declining a meeting.', expect: 'standard' },
	{
		label: 'complex_math',
		prompt: 'Prove sqrt(2) is irrational step by step with full justification.',
		expect: 'complex'
	},
	{
		label: 'architecture',
		prompt: 'Design a scalable event-sourced order system with failure modes and tradeoffs.',
		expect: 'complex'
	},
	{
		label: 'debug_hard',
		prompt: 'My distributed lock sometimes double-grants; walk through every race scenario.',
		expect: 'complex'
	},
	{
		label: 'tools_web',
		prompt: 'Search the web for today’s EUR/USD rate and cite sources.',
		expect: 'tools',
		tools: ['web_search']
	},
	{
		label: 'tools_code',
		prompt: 'Run Python to compute primes under 500 and show stdout.',
		expect: 'tools',
		tools: ['execute_python']
	},
	{
		label: 'vision_desc',
		prompt: 'What text is in the attached screenshot?',
		expect: 'vision'
	},
	{
		label: 'vision_pdf',
		prompt: 'Summarize the attached PDF contract.',
		expect: 'vision'
	}
];

async function benchModel(apiKey: string, modelId: string, referer?: string) {
	const latencies: number[] = [];
	let parseOk = 0;
	let accurate = 0;
	for (const c of CASES) {
		const hasImage = c.expect === 'vision' && c.label.includes('screenshot');
		const hasFile = c.expect === 'vision' && c.label.includes('pdf');
		const r = await classifyPromptTier(
			apiKey,
			modelId,
			{
				prompt: c.prompt,
				hasImageAttachment: hasImage,
				hasFileAttachment: hasFile,
				enabledToolNames: c.tools ?? []
			},
			referer,
			2500
		);
		if (!r) continue;
		latencies.push(r.latencyMs);
		parseOk++;
		let tier = r.tier;
		if (hasImage || hasFile) tier = 'vision';
		else if ((c.tools?.length ?? 0) > 0) tier = 'tools';
		if (tier === c.expect) accurate++;
	}
	latencies.sort((a, b) => a - b);
	const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
	const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
	return {
		modelId,
		parseOk,
		accuracy: CASES.length ? accurate / CASES.length : 0,
		p50,
		p95
	};
}

async function main() {
	const key = process.env.OPENROUTER_API_KEY;
	if (!key) {
		console.error('Missing OPENROUTER_API_KEY');
		process.exit(1);
	}
	const referer = process.env.OPENROUTER_HTTP_REFERER || undefined;
	console.log('Router benchmark (%d cases)\n', CASES.length);
	const rows = [];
	for (const id of CANDIDATES) {
		console.log('Testing', id, '…');
		rows.push(await benchModel(key, id, referer));
	}
	rows.sort((a, b) => b.accuracy - a.accuracy || a.p50 - b.p50);
	console.log('\nModel                          | parse | accuracy | p50 ms | p95 ms');
	for (const r of rows) {
		console.log(
			`${r.modelId.padEnd(32)} | ${String(r.parseOk).padStart(5)}/${CASES.length} | ${(r.accuracy * 100).toFixed(0).padStart(7)}% | ${String(r.p50).padStart(6)} | ${String(r.p95).padStart(6)}`
		);
	}
	const winner = rows[0];
	console.log('\nSuggested OPENROUTER_ROUTER_MODEL=', winner?.modelId ?? CANDIDATES[0]);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
