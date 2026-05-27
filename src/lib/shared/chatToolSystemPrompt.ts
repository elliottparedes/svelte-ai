import { estimateTokensFromText } from './estimateContextTokens';

/** Legacy meter baseline: full tool stack (system copy + OpenRouter tool JSON overhead). */
export const ESTIMATED_FULL_TOOL_STACK_TOKENS = 3200;
export const CHAT_TOOL_ORDER = [
	'execute_python',
	'datetime',
	'fetch_url',
	'web_search',
	'image_search',
	// 'map_route', // MAP_ROUTE_DISABLED — re-enable when route tool returns
	'generate_image'
] as const;
export type ChatToolId = (typeof CHAT_TOOL_ORDER)[number];

export const ALL_CHAT_TOOL_IDS: ChatToolId[] = [...CHAT_TOOL_ORDER];

/** Dashboard default: live/web tools on; generate_image off. */
export const DEFAULT_CHAT_TOOL_IDS: ChatToolId[] = [
	'execute_python',
	'datetime',
	'fetch_url',
	'web_search',
	'image_search'
];

const BULLETS: Record<ChatToolId, string> = {
	execute_python:
		'Run Python 3.12. Includes numpy, pandas, scipy, sympy + urllib HTTP. Use for: DataFrames, CSV/TSV you paste, stats, weather APIs, Monte Carlo, exact math. No requests/beautifulsoup/matplotlib — use fetch_url for HTML then parse with pandas. Always print() results.',
	datetime:
		'Get the current date and time (ISO). The system message already states today; call this if you need to re-check mid-conversation.',
	fetch_url:
		'Fetch plain text from a webpage URL (prefers main/article content). Returns one chunk per call; long pages include total length and an offset hint — call again with offset to read the next section. For weather/API JSON, execute_python with urllib is often faster.',
	web_search:
		'Search the web via Brave (news, FAQ, infobox, ranked snippets + URLs). Results are live indexed pages — report them as real news/facts, never as fictional or "future" because of training cutoff. Call fetch_url on key URLs for full page text. Not required for simple weather if execute_python can call wttr.in or open-meteo. Do not loop web_search for [Vision summary] unless the user asks for web lookup.',
	image_search:
		'Search the web for images. Use when the user wants to see images of something. IMPORTANT: after the tool returns, copy the markdown image links from the result verbatim into your response exactly as-is — do not describe or summarize them. The markdown will render as real images in the UI.',
	generate_image:
		'Generate an image from a text prompt. Use when the user asks to create, draw, or generate an image. Pass a detailed prompt. The image appears as its own chat message; reply briefly in text only (no image URLs).'
};

export const TOOL_PROMPT_NONE_ENABLED =
	'No tools are enabled for this message. Answer from the conversation and attachments only.';

export const MODEL_DOES_NOT_SUPPORT_TOOLS_PROMPT =
	'Answer helpfully from the conversation. This model does not support tool calls (no web search or fetch_url from this app).';

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
	return `You have access to the following tools. Use them whenever they would help answer the user's question accurately:\n\n${lines}\n\nImportant: For real-time data (weather, prices, news), you MUST call a tool — do not guess from training data. Trust web_search and fetch_url dates over your training memory; do not disclaim results as fictional. Weather in a city: prefer execute_python fetching wttr.in or open-meteo.com. User-provided URL: fetch_url. Finding sources: web_search. You may chain tools (e.g. web_search then execute_python to parse).`;
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
