import type { ChatRepository } from '../repositories/ChatRepository';
import type { MessageRepository } from '../repositories/MessageRepository';
import type { ConversationTitleService } from './ConversationTitleService';
import type { ConversationProcessEvent } from './conversationProcess.types';
import type { ChatTurnUsageAccumulator } from './chatTurnUsageAccumulator';
import { logger } from '../logger';
import { fallbackTitleFromPrompt } from './ConversationTitleService';
import { usageProcessEvent } from './conversationTurnUsage.util';

export async function* yieldNewThreadTitleEvents(params: {
	isNewThread: boolean;
	conversationId: string;
	userPrompt: string;
	assistantContent: string;
	userId: string;
	chatRepo: ChatRepository;
	titleService: ConversationTitleService | undefined;
	usageAcc?: ChatTurnUsageAccumulator;
	assistantMessageId?: string;
	messageRepo?: MessageRepository;
}): AsyncGenerator<ConversationProcessEvent, void, unknown> {
	if (!params.isNewThread) return;
	try {
		let llmTitle: string | null = null;
		if (params.titleService) {
			const { title, usage } = await params.titleService.generate(
				params.userPrompt,
				params.assistantContent
			);
			llmTitle = title;
			if (usage) {
				params.usageAcc?.add(usage);
				if (params.assistantMessageId && params.messageRepo) {
					await params.messageRepo.addUsage(params.assistantMessageId, usage);
				}
				if (params.usageAcc) yield usageProcessEvent(params.usageAcc);
			}
		}
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
