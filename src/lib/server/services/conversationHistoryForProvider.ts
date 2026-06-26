import type { ChatMessage } from '../domain/ChatProvider.interface';
import {
	isPersistedImageGenToolAck,
	stripGeneratedImageFromAssistantContent
} from '$lib/shared/stripGeneratedImageContent';
import { persistedToolCallForMessage } from './persistedToolHistory';

/** DB/UI history → OpenRouter-safe messages (valid tool turns, no multi-MB image payloads). */
export function normalizeHistoryForProvider(messages: readonly ChatMessage[]): ChatMessage[] {
	const out: ChatMessage[] = [];
	for (const m of messages) {
		if (m.role === 'tool' && isPersistedImageGenToolAck(m.content)) continue;
		if (m.role === 'tool') {
			const toolCall = persistedToolCallForMessage(m);
			if (!toolCall) continue;
			out.push({
				id: `${m.id}-call`,
				role: 'assistant',
				content: '',
				createdAt: m.createdAt,
				toolCalls: [toolCall]
			});
			out.push({ ...m });
			continue;
		}
		if (m.role === 'assistant') {
			out.push({
				...m,
				content: stripGeneratedImageFromAssistantContent(m.content),
				toolCalls: undefined
			});
			continue;
		}
		out.push(m);
	}
	return out;
}
