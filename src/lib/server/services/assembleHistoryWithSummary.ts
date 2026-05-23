import type { ChatMessage } from '../domain/ChatProvider.interface';
import type { Conversation } from '../domain/Conversation.types';
import { messagesAfterWatermark } from './conversationSummaryBatch';

export type SummaryAssemblyResult = {
	history: ChatMessage[];
	applied: boolean;
	staleWatermark: boolean;
	summaryChars: number;
	tailMessageCount: number;
	rawHistoryCount: number;
};

/** Prepend rolling summary system message; tail is raw messages after watermark. */
export function assembleHistoryWithSummary(
	conv: Conversation | null,
	history: readonly ChatMessage[]
): SummaryAssemblyResult {
	const rawHistoryCount = history.length;
	const summary = conv?.rollingSummary?.trim();
	if (!summary) {
		return {
			history: [...history],
			applied: false,
			staleWatermark: false,
			summaryChars: 0,
			tailMessageCount: rawHistoryCount,
			rawHistoryCount
		};
	}

	const tail = messagesAfterWatermark(history, conv?.summaryThroughMessageId ?? null);
	if (tail.length === 0 && history.length > 0) {
		return {
			history: [...history],
			applied: false,
			staleWatermark: true,
			summaryChars: summary.length,
			tailMessageCount: 0,
			rawHistoryCount
		};
	}

	return {
		history: [
			{
				id: 'system-rolling-summary',
				role: 'system',
				content: `Earlier in this conversation:\n${summary}`,
				createdAt: new Date(0)
			},
			...tail
		],
		applied: true,
		staleWatermark: false,
		summaryChars: summary.length,
		tailMessageCount: tail.length,
		rawHistoryCount
	};
}
