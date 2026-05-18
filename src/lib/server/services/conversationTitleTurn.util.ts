import type { ChatRepository } from '../repositories/ChatRepository';
import type { ConversationTitleService } from './ConversationTitleService';
import type { ConversationProcessEvent } from './conversationProcess.types';
import { logger } from '../logger';

export async function* yieldNewThreadTitleEvents(params: {
	isNewThread: boolean;
	conversationId: string;
	userPrompt: string;
	assistantContent: string;
	userId: string;
	chatRepo: ChatRepository;
	titleService: ConversationTitleService | undefined;
}): AsyncGenerator<ConversationProcessEvent, void, unknown> {
	if (!params.isNewThread || !params.titleService) return;
	try {
		const title = await params.titleService.generate(params.userPrompt, params.assistantContent);
		if (!title) return;
		await params.chatRepo.update(params.conversationId, { title });
		logger.info('Chat title generated', {
			userId: params.userId,
			conversationId: params.conversationId,
			titleChars: title.length
		});
		yield { type: 'title', conversationId: params.conversationId, title };
	} catch (err) {
		logger.warn('Chat title generation failed', {
			userId: params.userId,
			conversationId: params.conversationId,
			error: err instanceof Error ? err.message : String(err)
		});
	}
}
