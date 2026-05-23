import type { ChatRepository } from '../repositories/ChatRepository';
import type { MessageRepository } from '../repositories/MessageRepository';
import type { ConversationSummaryService } from './ConversationSummaryService';
import { normalizeHistoryForProvider } from './conversationHistoryForProvider';
import { maybeExtendRollingSummary } from './conversationSummaryExtend';
import type { ConversationProcessEvent } from './conversationProcess.types';

const HISTORY_FETCH_LIMIT = 2000;

export type SummaryTurnConfig = {
	interval: number;
	hotTail: number;
	backfillMin: number;
};

export async function* extendRollingSummaryAfterReply(params: {
	conversationId: string;
	userId: string;
	chatRepo: ChatRepository;
	messageRepo: MessageRepository;
	summaryService: ConversationSummaryService | undefined;
	config: SummaryTurnConfig | undefined;
}): AsyncGenerator<ConversationProcessEvent, void, unknown> {
	if (!params.summaryService || !params.config) return;
	const conv = await params.chatRepo.findById(params.conversationId);
	if (!conv) return;
	const raw = await params.messageRepo.findByConversationId(
		params.conversationId,
		HISTORY_FETCH_LIMIT
	);
	const normalizedHistory = normalizeHistoryForProvider(raw);
	yield* maybeExtendRollingSummary({
		conversationId: params.conversationId,
		userId: params.userId,
		conv,
		normalizedHistory,
		summaryService: params.summaryService,
		chatRepo: params.chatRepo,
		config: params.config
	});
}
