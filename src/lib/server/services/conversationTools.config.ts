import type { ToolDefinition } from '../domain/ChatProvider.interface';
import {
	ALL_CHAT_TOOL_IDS,
	buildChatToolSystemPrompt,
	buildChatToolSystemPromptNoWeb,
	MODEL_DOES_NOT_SUPPORT_TOOLS_PROMPT
} from '$lib/shared/chatToolSystemPrompt';

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
	},
	{
		name: 'image_search',
		description:
			'Search for images on the web and return image URLs with titles and source pages. Use when the user asks to find, show, or look up images of something.',
		parameters: {
			type: 'object',
			properties: {
				query: { type: 'string', description: 'Image search query' }
			},
			required: ['query']
		}
	},
	{
		name: 'map_route',
		description:
			'Geocode two places and compute a route (driving, walking, or cycling). Returns distance, duration, and route geometry for map display.',
		parameters: {
			type: 'object',
			properties: {
				origin: { type: 'string', description: 'Start place name, address, or "lat,lon"' },
				destination: { type: 'string', description: 'End place name, address, or "lat,lon"' },
				mode: {
					type: 'string',
					enum: ['driving', 'walking', 'cycling'],
					description: 'Travel mode (default driving)'
				}
			},
			required: ['origin', 'destination']
		}
	}
];

export const TOOLS_WITHOUT_WEB_SEARCH: ToolDefinition[] = TOOLS.filter((t) => t.name !== 'web_search');

export const TOOL_SYSTEM_PROMPT = buildChatToolSystemPrompt(ALL_CHAT_TOOL_IDS);

export const TOOL_SYSTEM_PROMPT_NO_WEB_SEARCH = buildChatToolSystemPromptNoWeb(
	ALL_CHAT_TOOL_IDS.filter((id) => id !== 'web_search')
);

export const TOOL_SYSTEM_PROMPT_NO_TOOLS = MODEL_DOES_NOT_SUPPORT_TOOLS_PROMPT;
