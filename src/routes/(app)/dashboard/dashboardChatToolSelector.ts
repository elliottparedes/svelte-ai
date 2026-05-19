import {
	ALL_CHAT_TOOL_IDS,
	CHAT_TOOL_ORDER,
	normalizeChatToolIds,
	type ChatToolId
} from '$lib/shared/chatToolSystemPrompt';

export type ToolRowMeta = { id: ChatToolId; title: string; description: string; icon: string };

type MetaRow = Omit<ToolRowMeta, 'id'>;

const META: Record<ChatToolId, MetaRow> = {
	calculator: { title: 'Calculator', description: 'Evaluate math in chat', icon: '🔢' },
	datetime: { title: 'Date & time', description: 'Use the current date and time', icon: '🕐' },
	fetch_url: { title: 'Fetch URL', description: 'Read text from a webpage link', icon: '🔗' },
	web_search: { title: 'Web search', description: 'Brave Search for live information', icon: '🔍' },
	map_route: { title: 'Route map', description: 'Directions between two places', icon: '🗺️' }
};

export const TOOL_ROWS: readonly ToolRowMeta[] = CHAT_TOOL_ORDER.map((id) => ({ id, ...META[id] }));

export const PRESET = {
	none: [] as ChatToolId[],
	local: ['calculator', 'datetime', 'fetch_url', 'map_route'] as ChatToolId[],
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
