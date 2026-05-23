import { completeOpenRouterText } from '../infrastructure/openRouterCompleteText';
import { isModelRoutingTier, type ModelRoutingTier } from '$lib/shared/modelRoutingTier';

const ROUTER_SYSTEM = `You route user chat requests to a model tier. Reply with JSON only, no markdown:
{"tier":"ultra_cheap"|"standard"|"complex"|"tools"|"vision"}

Rules:
- ultra_cheap: greetings, thanks, tiny factual one-liners, no tools/images needed
- standard: normal Q&A, writing, summaries
- complex: multi-step reasoning, proofs, architecture, hard debugging, long analysis
- tools: user needs live web search, maps, code execution, image generation, or similar tools
- vision: user attached or clearly needs image/PDF understanding`;

export type RouterClassifyInput = {
	prompt: string;
	hasImageAttachment: boolean;
	hasFileAttachment: boolean;
	enabledToolNames: readonly string[];
	recentSnippet?: string;
};

export async function classifyPromptTier(
	apiKey: string,
	routerModelId: string,
	input: RouterClassifyInput,
	httpReferer: string | undefined,
	timeoutMs: number
): Promise<{ tier: ModelRoutingTier; latencyMs: number } | null> {
	const user = [
		input.hasImageAttachment ? 'attachments: image' : '',
		input.hasFileAttachment ? 'attachments: file/pdf' : '',
		input.enabledToolNames.length ? `tools_enabled: ${input.enabledToolNames.join(', ')}` : '',
		input.recentSnippet ? `recent:\n${input.recentSnippet}` : '',
		'message:',
		input.prompt.slice(0, 2000)
	]
		.filter(Boolean)
		.join('\n');

	const started = performance.now();
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	let raw: string | null;
	try {
		raw = await completeOpenRouterText(
			apiKey,
			routerModelId,
			[
				{ role: 'system', content: ROUTER_SYSTEM },
				{ role: 'user', content: user }
			],
			48,
			httpReferer,
			controller.signal
		);
	} catch {
		return null;
	} finally {
		clearTimeout(timer);
	}
	const latencyMs = Math.round(performance.now() - started);
	if (!raw) return null;
	const tier = parseTierFromRouterReply(raw);
	return tier ? { tier, latencyMs } : null;
}

function parseTierFromRouterReply(raw: string): ModelRoutingTier | null {
	const trimmed = raw.trim();
	const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
	if (!jsonMatch) return null;
	try {
		const parsed = JSON.parse(jsonMatch[0]) as { tier?: string };
		const t = String(parsed.tier ?? '').trim();
		return isModelRoutingTier(t) ? t : null;
	} catch {
		return null;
	}
}
