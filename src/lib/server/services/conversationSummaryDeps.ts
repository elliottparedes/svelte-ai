import {
	CHAT_SUMMARY_BACKFILL_MIN,
	CHAT_SUMMARY_ENABLED,
	CHAT_SUMMARY_HOT_TAIL,
	CHAT_SUMMARY_INTERVAL,
	CHAT_SUMMARY_MAX_TOKENS,
	CHAT_SUMMARY_MODEL,
	OPENROUTER_API_KEY,
	OPENROUTER_HTTP_REFERER
} from '../env';
import { ConversationSummaryService } from './ConversationSummaryService';
import type { SummaryTurnConfig } from './conversationSummaryTurn.util';

export function buildConversationSummaryDeps(): {
	summaryService: ConversationSummaryService | undefined;
	summaryConfig: SummaryTurnConfig | undefined;
} {
	if (!CHAT_SUMMARY_ENABLED) return { summaryService: undefined, summaryConfig: undefined };
	return {
		summaryService: new ConversationSummaryService(
			OPENROUTER_API_KEY,
			CHAT_SUMMARY_MODEL,
			CHAT_SUMMARY_MAX_TOKENS,
			OPENROUTER_HTTP_REFERER || undefined
		),
		summaryConfig: {
			interval: CHAT_SUMMARY_INTERVAL,
			hotTail: CHAT_SUMMARY_HOT_TAIL,
			backfillMin: CHAT_SUMMARY_BACKFILL_MIN
		}
	};
}
