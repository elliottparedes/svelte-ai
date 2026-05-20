import type { ChatMessage } from '../domain/ChatProvider.interface';
import {
	isPersistedImageGenToolAck,
	stripGeneratedImageFromAssistantContent
} from '$lib/shared/stripGeneratedImageContent';

/** DB/UI history → OpenRouter-safe messages (valid tool turns, no multi-MB image payloads). */
export function normalizeHistoryForProvider(messages: readonly ChatMessage[]): ChatMessage[] {
	const out: ChatMessage[] = [];
	for (const m of messages) {
		if (m.role === 'tool' && isPersistedImageGenToolAck(m.content)) continue;
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
