import type { ChatAttachment, ChatMessage } from '../domain/ChatProvider.interface';

export function buildAugmentedPrompt(prompt: string, attachments: readonly ChatAttachment[] | undefined): string {
	if (!attachments || attachments.length === 0) return prompt;
	const textParts: string[] = [];
	for (const a of attachments) {
		if (a.type === 'text' && a.content) {
			textParts.push(`--- ${a.name} ---\n${a.content}\n---`);
		}
	}
	if (textParts.length === 0) return prompt;
	return textParts.join('\n\n') + '\n\n' + prompt;
}

export function augmentHistory(history: ChatMessage[], augmentedPrompt: string): ChatMessage[] {
	const lastUserIndex = [...history].reverse().findIndex((m) => m.role === 'user');
	if (lastUserIndex === -1) return history;
	const actualIndex = history.length - 1 - lastUserIndex;
	return history.map((m, i) => (i === actualIndex ? { ...m, content: augmentedPrompt } : m));
}
