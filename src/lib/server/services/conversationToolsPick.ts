import { CHAT_TOOL_ORDER } from '$lib/shared/chatToolSystemPrompt';
import type { ToolDefinition } from '../domain/ChatProvider.interface';
import { TOOLS } from './conversationTools.config';

const byName = new Map(TOOLS.map((t) => [t.name, t]));

export function toolDefinitionsForOrderedNames(names: readonly string[]): ToolDefinition[] {
	const out: ToolDefinition[] = [];
	for (const id of CHAT_TOOL_ORDER) {
		if (!names.includes(id)) continue;
		const t = byName.get(id);
		if (t) out.push(t);
	}
	return out;
}
