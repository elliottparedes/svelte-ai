import { DomainError } from '../domain/DomainError';
import type { ChatRepository } from '../repositories/ChatRepository';

export type ResolvedConversation = { convId: string; effectiveModel: string | undefined };

export async function resolveConversationForPrompt(
	chatRepo: ChatRepository,
	userId: string,
	conversationId: string | undefined,
	projectId: string | undefined,
	prompt: string,
	model?: string
): Promise<ResolvedConversation> {
	const requestedModel = model?.trim() || undefined;
	if (!conversationId) {
		const conv = await chatRepo.create({
			userId,
			projectId,
			title: 'New chat',
			modelId: requestedModel
		});
		return { convId: conv.id, effectiveModel: requestedModel };
	}
	const existing = await chatRepo.findById(conversationId);
	if (!existing || existing.userId !== userId) throw new DomainError('Conversation not found', 404);
	const effectiveModel = existing.modelId ?? requestedModel;
	if (!existing.modelId && requestedModel) {
		await chatRepo.update(conversationId, { modelId: requestedModel });
	}
	await chatRepo.update(conversationId, {});
	return { convId: conversationId, effectiveModel };
}
