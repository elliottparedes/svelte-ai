import type { ChatMessage } from '../domain/ChatProvider.interface';
import { estimateMessagesTokens } from '$lib/shared/estimateContextTokens';

/** Drops oldest messages until estimated prompt tokens fit the budget (keeps at least one). */
export function trimChatMessagesByTokenBudget(
	messages: readonly ChatMessage[],
	maxPromptTokens: number
): ChatMessage[] {
	const copy = [...messages];
	while (copy.length > 1 && estimateMessagesTokens(copy) > maxPromptTokens) {
		copy.shift();
	}
	return copy;
}
