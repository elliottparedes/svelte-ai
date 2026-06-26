import type { ChatMessage } from '$lib/types/dashboard';

export type ChatDisplayRow = {
	id: string;
	msg: ChatMessage;
	toolMessages: ChatMessage[];
};

export function groupDisplayRows(messages: readonly ChatMessage[]): ChatDisplayRow[] {
	const rows: ChatDisplayRow[] = [];
	for (let i = 0; i < messages.length; i++) {
		const msg = messages[i];
		if (msg.role !== 'assistant') {
			if (msg.role === 'tool' && messages[i - 1]?.role === 'assistant') continue;
			rows.push({ id: msg.id, msg, toolMessages: [] });
			continue;
		}
		const toolMessages: ChatMessage[] = [];
		let j = i + 1;
		while (j < messages.length && messages[j].role === 'tool') {
			toolMessages.push(messages[j]);
			j++;
		}
		rows.push({ id: msg.id, msg, toolMessages });
		i = j - 1;
	}
	return rows;
}
