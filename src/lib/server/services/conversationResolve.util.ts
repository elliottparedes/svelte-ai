import { DomainError } from '../domain/DomainError';
import type { ChatRepository } from '../repositories/ChatRepository';

export async function resolveConversationForPrompt(
	chatRepo: ChatRepository,
	userId: string,
	conversationId: string | undefined,
	projectId: string | undefined,
	prompt: string
): Promise<string> {
	if (!conversationId) {
		const conv = await chatRepo.create({ userId, projectId, title: prompt.slice(0, 60) });
		return conv.id;
	}
	const existing = await chatRepo.findById(conversationId);
	if (!existing || existing.userId !== userId) throw new DomainError('Conversation not found', 404);
	await chatRepo.update(conversationId, { title: undefined });
	return conversationId;
}
