import { estimateTokensFromText } from './estimateContextTokens';

/** Legacy meter baseline: full tool stack (system copy + OpenRouter tool JSON overhead). */
export const ESTIMATED_FULL_TOOL_STACK_TOKENS = 3200;
export const CHAT_TOOL_ORDER = [
	'execute_python',
	'calculator',
	'datetime',
	'fetch_url',
	'web_search',
	'image_search',
	'map_route',
	'generate_image'
] as const;
export type ChatToolId = (typeof CHAT_TOOL_ORDER)[number];

export const ALL_CHAT_TOOL_IDS: ChatToolId[] = [...CHAT_TOOL_ORDER];

/** Dashboard default: live/web tools on; calculator and map_route off. */
export const DEFAULT_CHAT_TOOL_IDS: ChatToolId[] = [
	'execute_python',
	'datetime',
	'fetch_url',
	'web_search',
	'image_search'
];

const BULLETS: Record<ChatToolId, string> = {
	execute_python:
		'Run Python 3.12. Includes numpy, pandas, scipy, sympy + urllib HTTP. Use for: DataFrames, CSV/TSV you paste, stats, plots as text, weather APIs, Monte Carlo, exact math. No requests/beautifulsoup/matplotlib — use fetch_url for HTML then parse with pandas. Always print() results.',
	calculator: 'Evaluate a simple one-line math expression only (e.g. 25 * 47). Prefer execute_python for harder problems.',
	datetime:
		'Get the current date and time. Use when the user asks about "now", "today", or current time.',
	fetch_url:
		'Fetch and strip text from a specific webpage URL (HTML → plain text). Use when the user gives a link or you need the body of one known page. For weather or simple APIs, execute_python with urllib is often faster than fetch_url.',
	web_search:
		'Search the web via SearXNG (snippets + links). Use to discover sources or current news; not required for simple weather if execute_python can call wttr.in or open-meteo. Do not use repeated web searches to identify something shown only in an in-chat [Vision summary] unless the user asks for web lookup or verification.',
	image_search:
		'Search the web for images. Use when the user wants to see images of something. IMPORTANT: after the tool returns, copy the markdown image links from the result verbatim into your response exactly as-is — do not describe or summarize them. The markdown will render as real images in the UI.',
	map_route:
		'Get driving, walking, or cycling route between two places (geocode + OSM routing). Use for directions, distance, travel time, or comparing locations. Pass clear place names or "lat,lon" coordinates; summarize distance and duration in natural language after the tool returns.',
	generate_image:
		'Generate an image from a text prompt. Use when the user asks to create, draw, or generate an image. Pass a detailed prompt. The image appears as its own chat message; reply briefly in text only (no image URLs).'
};

export const TOOL_PROMPT_NONE_ENABLED =
	'No tools are enabled for this message. Answer from the conversation and attachments only.';

export const MODEL_DOES_NOT_SUPPORT_TOOLS_PROMPT =
	'Answer helpfully from the conversation. This model does not support tool calls (no calculator, web search, or fetch_url from this app).';

export function normalizeChatToolIds(ids: readonly string[]): ChatToolId[] {
	const want = new Set(ids);
	const out: ChatToolId[] = [];
	for (const id of CHAT_TOOL_ORDER) {
		if (want.has(id)) out.push(id);
	}
	return out;
}

export function buildChatToolSystemPrompt(ids: readonly ChatToolId[]): string {
	const lines = ids.map((id) => `- ${id}: ${BULLETS[id]}`).join('\n');
	return `You have access to the following tools. Use them whenever they would help answer the user's question accurately:\n\n${lines}\n\nImportant: For real-time data (weather, prices, news), you MUST call a tool — do not guess from training data. Weather in a city: prefer execute_python fetching wttr.in or open-meteo.com. User-provided URL: fetch_url. Finding sources: web_search. You may chain tools (e.g. web_search then execute_python to parse).`;
}

export function buildChatToolSystemPromptNoWeb(ids: readonly ChatToolId[]): string {
	const filtered = ids.filter((id) => id !== 'web_search');
	if (filtered.length === 0) {
		return `You do not have web search or other tools in this turn. Answer from the conversation. If the user message includes [Vision summary], use that as the only description of any images.`;
	}
	const lines = filtered.map((id) => `- ${id}: ${BULLETS[id]}`).join('\n');
	return `You have access to the following tools. Use them whenever they would help answer the user's question accurately:\n\n${lines}\n\nYou do not have web search in this turn. Answer from the conversation. If the user message includes [Vision summary], use that as the only description of any images.`;
}

export function estimateChatToolsTurnTokens(normalizedIds: readonly ChatToolId[]): number {
	if (normalizedIds.length === 0) return estimateTokensFromText(TOOL_PROMPT_NONE_ENABLED) + 80;
	const full = ALL_CHAT_TOOL_IDS;
	const fullPromptTok = estimateTokensFromText(buildChatToolSystemPrompt(full));
	const defsSlop = Math.max(400, ESTIMATED_FULL_TOOL_STACK_TOKENS - fullPromptTok);
	const partialTok = estimateTokensFromText(buildChatToolSystemPrompt(normalizedIds));
	return Math.ceil(partialTok + defsSlop * (normalizedIds.length / full.length));
}
