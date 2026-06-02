import type { MessageRepository } from '../repositories/MessageRepository';
import type { ChatRepository } from '../repositories/ChatRepository';
import type { ConversationTitleService } from './ConversationTitleService';
import type { ConversationSummaryService } from './ConversationSummaryService';
import type { SummaryTurnConfig } from './conversationSummaryTurn.util';
import type { ConversationProcessEvent } from './conversationProcess.types';
import type { ChatTurnUsageAccumulator } from './chatTurnUsageAccumulator';
import { completeNewThreadTitleJob } from './conversationTitleBackground';
import { extendRollingSummaryAfterReply } from './conversationSummaryTurn.util';

export async function* afterAssistantSaved(params: {
	isNewThread: boolean;
	conversationId: string;
	userPrompt: string;
	assistantContent: string;
	userId: string;
	chatRepo: ChatRepository;
	titleService: ConversationTitleService | undefined;
	summaryService: ConversationSummaryService | undefined;
	summaryConfig: SummaryTurnConfig | undefined;
	messageRepo: MessageRepository;
	usageAcc: ChatTurnUsageAccumulator;
	assistantMessageId: string;
}): AsyncGenerator<ConversationProcessEvent> {
	yield { type: 'done' as const, conversationId: params.conversationId };
	if (params.isNewThread) {
		completeNewThreadTitleJob(
			params.conversationId,
			params.assistantContent,
			params.assistantMessageId,
			params.usageAcc
		);
	}
	yield* extendRollingSummaryAfterReply({
		conversationId: params.conversationId,
		userId: params.userId,
		chatRepo: params.chatRepo,
		messageRepo: params.messageRepo,
		summaryService: params.summaryService,
		config: params.summaryConfig,
		usageAcc: params.usageAcc,
		assistantMessageId: params.assistantMessageId
	});
}
