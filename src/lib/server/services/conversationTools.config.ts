import type { ToolDefinition } from '../domain/ChatProvider.interface';
import {
	ALL_CHAT_TOOL_IDS,
	buildChatToolSystemPrompt,
	buildChatToolSystemPromptNoWeb,
	MODEL_DOES_NOT_SUPPORT_TOOLS_PROMPT
} from '$lib/shared/chatToolSystemPrompt';
import { EXECUTE_PYTHON_TOOL } from './conversationToolsExecutePython';
export const MAX_TOOL_TURNS = 12;

export const TOOLS: ToolDefinition[] = [
	EXECUTE_PYTHON_TOOL,
	{
		name: 'datetime',
		description: 'Get the current date and time in ISO 8601 format.',
		parameters: { type: 'object', properties: {} }
	},
	{
		name: 'fetch_url',
		description:
			'Fetch webpage text (HTML stripped to plain text). Returns one chunk per call; use offset to read later sections of long pages.',
		parameters: {
			type: 'object',
			properties: {
				url: { type: 'string', description: 'Full URL to fetch, e.g. https://example.com/article' },
				offset: {
					type: 'integer',
					description:
						'Character offset into the page text (default 0). If the result says more content is available, call again with the suggested offset.'
				}
			},
			required: ['url']
		}
	},
	{
		name: 'web_search',
		description:
			'Search the web via Brave: news, FAQ, infobox, and ranked snippets with URLs (live index, not fiction). Report dates and headlines as real; never dismiss as future-dated vs training. Follow with fetch_url on the best 1–2 links for full articles. Use for current events, news, or anything not in training data.',
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
	// MAP_ROUTE_DISABLED: import MAP_ROUTE_TOOL from './conversationTools.mapRoute.ts'
	{
		name: 'generate_image',
		description: 'Generate an image from a text description using the configured image model.',
		parameters: {
			type: 'object',
			properties: {
				prompt: { type: 'string', description: 'Detailed description of the image to create' },
				aspect_ratio: {
					type: 'string',
					enum: ['square', 'portrait', 'landscape'],
					description: 'Optional composition hint'
				}
			},
			required: ['prompt']
		}
	}
];

export const TOOLS_WITHOUT_WEB_SEARCH: ToolDefinition[] = TOOLS.filter((t) => t.name !== 'web_search');

export const TOOL_SYSTEM_PROMPT = buildChatToolSystemPrompt(ALL_CHAT_TOOL_IDS);

export const TOOL_SYSTEM_PROMPT_NO_WEB_SEARCH = buildChatToolSystemPromptNoWeb(
	ALL_CHAT_TOOL_IDS.filter((id) => id !== 'web_search')
);

export const TOOL_SYSTEM_PROMPT_NO_TOOLS = MODEL_DOES_NOT_SUPPORT_TOOLS_PROMPT;
