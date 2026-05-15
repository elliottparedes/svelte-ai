import type { ToolDefinition } from '../domain/ChatProvider.interface';

export const MAX_TOOL_TURNS = 12;

export const TOOLS: ToolDefinition[] = [
	{
		name: 'calculator',
		description: 'Evaluate a mathematical expression and return the result.',
		parameters: {
			type: 'object',
			properties: {
				expression: { type: 'string', description: 'Math expression like "25 * 47"' }
			},
			required: ['expression']
		}
	},
	{
		name: 'datetime',
		description: 'Get the current date and time in ISO 8601 format.',
		parameters: { type: 'object', properties: {} }
	},
	{
		name: 'fetch_url',
		description: 'Fetch and extract the text content from a webpage URL.',
		parameters: {
			type: 'object',
			properties: {
				url: { type: 'string', description: 'Full URL to fetch, e.g. https://example.com' }
			},
			required: ['url']
		}
	},
	{
		name: 'web_search',
		description:
			'Search the web via Brave Search API and return top results with titles, snippets, and URLs. Use for current events, news, or any topic that may have changed since your training data.',
		parameters: {
			type: 'object',
			properties: {
				query: { type: 'string', description: 'Search query' }
			},
			required: ['query']
		}
	}
];

/** Used when vision relay provided a text summary instead of pixels — avoids spurious identify-the-photo web searches. */
export const TOOLS_WITHOUT_WEB_SEARCH: ToolDefinition[] = TOOLS.filter((t) => t.name !== 'web_search');

export const TOOL_SYSTEM_PROMPT = `You have access to the following tools. Use them whenever they would help answer the user's question accurately:

- calculator: Evaluate a mathematical expression. Use for any math.
- datetime: Get the current date and time. Use when the user asks about "now", "today", or current time.
- fetch_url: Fetch the text content of a specific webpage URL. Use when the user provides a URL or asks about a specific page.
- web_search: Search the web (Brave Search) for current information. Use for news, current events, sports scores, weather, stock prices, or anything that may have changed since your training data. Do not use repeated web searches to identify something shown only in an in-chat [Vision summary] unless the user asks for web lookup or verification.

Important: If the user asks about current events, news, real-time data, or specific webpages, you MUST use the appropriate tool rather than relying on your training data.`;

/** Models without tool-calling (e.g. many image-generation routes): no tools are sent to the API. */
export const TOOL_SYSTEM_PROMPT_NO_TOOLS = `Answer helpfully from the conversation. This model does not support tool calls (no calculator, web search, or fetch_url from this app).`;

export const TOOL_SYSTEM_PROMPT_NO_WEB_SEARCH = `You have access to the following tools. Use them whenever they would help answer the user's question accurately:

- calculator: Evaluate a mathematical expression. Use for any math.
- datetime: Get the current date and time. Use when the user asks about "now", "today", or current time.
- fetch_url: Fetch the text content of a specific webpage URL. Use when the user provides a URL or asks about a specific page.

You do not have web search in this turn. Answer from the conversation. If the user message includes [Vision summary], use that as the only description of any images.`;
