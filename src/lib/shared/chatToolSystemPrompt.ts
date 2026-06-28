import { estimateTokensFromText } from './estimateContextTokens';

export const ESTIMATED_FULL_TOOL_STACK_TOKENS = 3200;
export const CHAT_TOOL_ORDER = [
	'execute_javascript',
	'fetch_url',
	'web_search',
	'generate_image'
] as const;
export type ChatToolId = (typeof CHAT_TOOL_ORDER)[number];

export const ALL_CHAT_TOOL_IDS: ChatToolId[] = [...CHAT_TOOL_ORDER];
export const DEFAULT_CHAT_TOOL_IDS: ChatToolId[] = ['execute_javascript', 'fetch_url', 'web_search'];

const BULLETS: Record<ChatToolId, string> = {
	execute_javascript:
		'Run browser-safe JavaScript in a Web Worker. Helpers: listFiles(), readTextFile(name), parseCsv(name), previewRows(rows, limit), and console.log(). Text/CSV attachments are preloaded as files. No DOM, no secrets, no Node APIs. Always log the final answer.',
	fetch_url:
		'Fetch plain text from a webpage URL (prefers main/article content). Returns one chunk per call; long pages include total length and an offset hint - call again with offset to read the next section.',
	web_search:
		'Search the live web for ranked snippets, quick answers, and source URLs. Treat [Quick answer] as unverified. For latest/current/newest/available-now claims, fetch_url 1-2 authoritative URLs before finalizing.',
	generate_image:
		'Generate an image from a text prompt. Use when the user asks to create, draw, or generate an image. The image appears as its own chat message; reply briefly in text only.'
};

export const TOOL_PROMPT_NONE_ENABLED =
	'No tools are enabled for this message. Answer from the conversation and attachments only.';
export const MODEL_DOES_NOT_SUPPORT_TOOLS_PROMPT =
	'Answer helpfully from the conversation. This model does not support tool calls (no web search or fetch_url from this app).';

export function normalizeChatToolIds(ids: readonly string[]): ChatToolId[] {
	const want = new Set(ids);
	return CHAT_TOOL_ORDER.filter((id) => want.has(id));
}

export function buildChatToolSystemPrompt(ids: readonly ChatToolId[]): string {
	const lines = ids.map((id) => `- ${id}: ${BULLETS[id]}`).join('\n');
	return `You have access to the following tools. Use them whenever they would help answer the user's question accurately:\n\n${lines}\n\nImportant: For real-time data, you MUST call a tool. For latest/current/newest claims, use web_search and then fetch_url 1-2 authoritative URLs before finalizing. If web_search/fetch_url was used, cite source URLs. User-attached CSV/text: use execute_javascript with parseCsv() or readTextFile() - not web_search. Live weather conditions: web_search. User-provided URL: fetch_url.`;
}

export function buildChatToolSystemPromptNoWeb(ids: readonly ChatToolId[]): string {
	const filtered = ids.filter((id) => id !== 'web_search');
	if (filtered.length === 0) {
		return 'You do not have web search or other tools in this turn. Answer from the conversation.';
	}
	const lines = filtered.map((id) => `- ${id}: ${BULLETS[id]}`).join('\n');
	return `You have access to the following tools. Use them whenever they would help answer the user's question accurately:\n\n${lines}\n\nYou do not have web search in this turn. Answer from the conversation.`;
}

export function estimateChatToolsTurnTokens(normalizedIds: readonly ChatToolId[]): number {
	if (normalizedIds.length === 0) return estimateTokensFromText(TOOL_PROMPT_NONE_ENABLED) + 80;
	const fullPromptTok = estimateTokensFromText(buildChatToolSystemPrompt(ALL_CHAT_TOOL_IDS));
	const defsSlop = Math.max(400, ESTIMATED_FULL_TOOL_STACK_TOKENS - fullPromptTok);
	const partialTok = estimateTokensFromText(buildChatToolSystemPrompt(normalizedIds));
	return Math.ceil(partialTok + defsSlop * (normalizedIds.length / ALL_CHAT_TOOL_IDS.length));
}
