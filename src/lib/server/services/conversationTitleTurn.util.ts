import type { ChatRepository } from '../repositories/ChatRepository';
import type { ConversationTitleService } from './ConversationTitleService';
import type { ConversationProcessEvent } from './conversationProcess.types';
import { logger } from '../logger';
import { fallbackTitleFromPrompt } from './ConversationTitleService';

export async function* yieldNewThreadTitleEvents(params: {
	isNewThread: boolean;
	conversationId: string;
	userPrompt: string;
	assistantContent: string;
	userId: string;
	chatRepo: ChatRepository;
	titleService: ConversationTitleService | undefined;
}): AsyncGenerator<ConversationProcessEvent, void, unknown> {
	if (!params.isNewThread) return;
	try {
		const llmTitle = params.titleService
			? await params.titleService.generate(params.userPrompt, params.assistantContent)
			: null;
		const title = llmTitle ?? fallbackTitleFromPrompt(params.userPrompt);
		const source = llmTitle ? 'llm' : 'fallback';
		if (!title) return;
		await params.chatRepo.update(params.conversationId, { title });
		logger.info('Chat title generated', {
			userId: params.userId,
			conversationId: params.conversationId,
			titleChars: title.length,
			source
		});
		yield { type: 'title', conversationId: params.conversationId, title };
	} catch (err) {
		const fallback = fallbackTitleFromPrompt(params.userPrompt);
		try {
			await params.chatRepo.update(params.conversationId, { title: fallback });
		} catch {
			// If title persistence fails, keep the stream alive.
		}
		logger.warn('Chat title generation failed', {
			userId: params.userId,
			conversationId: params.conversationId,
			error: err instanceof Error ? err.message : String(err)
		});
		yield { type: 'title', conversationId: params.conversationId, title: fallback };
	}
}
