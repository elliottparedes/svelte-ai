import {
	ALL_CHAT_TOOL_IDS,
	CHAT_TOOL_ORDER,
	DEFAULT_CHAT_TOOL_IDS,
	normalizeChatToolIds,
	type ChatToolId
} from '$lib/shared/chatToolSystemPrompt';

export type ToolRowMeta = { id: ChatToolId; title: string; description: string };

type MetaRow = Omit<ToolRowMeta, 'id'>;

const META: Record<ChatToolId, MetaRow> = {
	execute_python: { title: 'Python', description: 'Math, APIs, light weather/HTTP' },
	calculator: { title: 'Calculator', description: 'Quick one-line math' },
	datetime: { title: 'Date & time', description: 'Use the current date and time' },
	fetch_url: { title: 'Fetch URL', description: 'Read text from a webpage link' },
	web_search: { title: 'Web search', description: 'Search the web for live information' },
	image_search: { title: 'Image search', description: 'Find images on the web' },
	map_route: { title: 'Route map', description: 'Directions between two places' },
	generate_image: { title: 'Generate image', description: 'Create images from a text prompt' }
};

export const TOOL_ROWS: readonly ToolRowMeta[] = CHAT_TOOL_ORDER.map((id) => ({ id, ...META[id] }));

export const PRESET = {
	none: [] as ChatToolId[],
	local: ['datetime', 'fetch_url'] as ChatToolId[],
	default: DEFAULT_CHAT_TOOL_IDS,
	all: ALL_CHAT_TOOL_IDS
};

export function applyPresetSelect(key: string): ChatToolId[] | null {
	if (key === 'custom') return null;
	if (key === 'none') return [];
	if (key === 'local') return [...PRESET.local];
	return [...PRESET.all];
}

export function toggleToolId(enabledIds: readonly ChatToolId[], id: ChatToolId, on: boolean): ChatToolId[] {
	const set = new Set<ChatToolId>(enabledIds);
	if (on) set.add(id);
	else set.delete(id);
	return normalizeChatToolIds([...set]);
}

export { CHAT_TOOL_ORDER };
