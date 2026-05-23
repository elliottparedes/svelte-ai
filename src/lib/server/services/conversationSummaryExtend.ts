import type { Conversation } from '../domain/Conversation.types';
import type { ChatRepository } from '../repositories/ChatRepository';
import type { ConversationSummaryService } from './ConversationSummaryService';
import {
	filterSummarizableMessages,
	messagesAfterWatermark,
	pickSummaryBatch
} from './conversationSummaryBatch';
import type { ChatMessage } from '../domain/ChatProvider.interface';
import type { ConversationProcessEvent } from './conversationProcess.types';
import {
	logRollingSummaryCheck,
	logRollingSummaryExtended,
	logRollingSummaryFailed,
	logRollingSummarySkipped,
	logRollingSummaryStarted
} from './conversationSummaryLog.util';
import type { SummaryTurnConfig } from './conversationSummaryTurn.util';

export async function* maybeExtendRollingSummary(params: {
	conversationId: string;
	userId: string;
	conv: Conversation | null;
	normalizedHistory: readonly ChatMessage[];
	summaryService: ConversationSummaryService | undefined;
	chatRepo: ChatRepository;
	config: SummaryTurnConfig;
}): AsyncGenerator<ConversationProcessEvent, void, unknown> {
	if (!params.summaryService || !params.conv) return;

	const summarizable = filterSummarizableMessages(
		messagesAfterWatermark(params.normalizedHistory, params.conv.summaryThroughMessageId)
	);
	const batch = pickSummaryBatch(summarizable, params.config.interval, params.config.hotTail);
	const needsBackfill =
		!params.conv.rollingSummary && summarizable.length >= params.config.backfillMin;
	const willExtend =
		batch.length >= params.config.interval || (needsBackfill && batch.length > 0);

	logRollingSummaryCheck({
		userId: params.userId,
		conversationId: params.conversationId,
		unsummarizedCount: summarizable.length,
		batchSize: batch.length,
		interval: params.config.interval,
		hotTail: params.config.hotTail,
		needsBackfill,
		willExtend,
		watermarkMessageId: params.conv.summaryThroughMessageId,
		hasExistingSummary: Boolean(params.conv.rollingSummary?.trim())
	});

	if (batch.length < params.config.interval && !needsBackfill) {
		logRollingSummarySkipped({
			userId: params.userId,
			conversationId: params.conversationId,
			reason: 'threshold_not_met',
			unsummarizedCount: summarizable.length,
			interval: params.config.interval,
			hotTail: params.config.hotTail
		});
		return;
	}
	if (batch.length === 0) {
		logRollingSummarySkipped({
			userId: params.userId,
			conversationId: params.conversationId,
			reason: 'empty_batch',
			unsummarizedCount: summarizable.length,
			interval: params.config.interval,
			hotTail: params.config.hotTail
		});
		return;
	}

	const expectedWatermark = params.conv.summaryThroughMessageId;
	const batchFirstId = batch[0]?.id ?? '';
	const batchLastId = batch[batch.length - 1]?.id ?? '';
	const previousSummaryChars = params.conv.rollingSummary?.length ?? 0;

	try {
		const fresh = await params.chatRepo.findById(params.conversationId);
		if (!fresh) {
			logRollingSummaryFailed({
				userId: params.userId,
				conversationId: params.conversationId,
				stage: 'load',
				error: 'conversation not found'
			});
			return;
		}
		if (fresh.summaryThroughMessageId !== expectedWatermark) {
			logRollingSummaryFailed({
				userId: params.userId,
				conversationId: params.conversationId,
				stage: 'race',
				error: 'watermark changed before update'
			});
			return;
		}

		logRollingSummaryStarted({
			userId: params.userId,
			conversationId: params.conversationId,
			batchSize: batch.length,
			batchFirstMessageId: batchFirstId,
			batchLastMessageId: batchLastId,
			previousSummaryChars,
			incremental: Boolean(fresh.rollingSummary?.trim()),
			modelId: params.summaryService.modelId
		});

		yield { type: 'summary_start' as const };

		const started = performance.now();
		const next = await params.summaryService.extend(fresh.rollingSummary, batch);
		const durationMs = Math.round(performance.now() - started);

		if (!next) {
			logRollingSummaryFailed({
				userId: params.userId,
				conversationId: params.conversationId,
				stage: 'model',
				error: 'empty model response'
			});
			return;
		}
		if (!batchLastId) return;

		await params.chatRepo.update(params.conversationId, {
			rollingSummary: next,
			summaryThroughMessageId: batchLastId
		});
		logRollingSummaryExtended({
			userId: params.userId,
			conversationId: params.conversationId,
			batchSize: batch.length,
			previousSummaryChars,
			summaryChars: next.length,
			watermarkMessageId: batchLastId,
			durationMs
		});
		yield {
			type: 'summary_done' as const,
			conversationId: params.conversationId,
			summaryThroughMessageId: batchLastId,
			summaryChars: next.length
		};
	} catch (err) {
		logRollingSummaryFailed({
			userId: params.userId,
			conversationId: params.conversationId,
			stage: 'persist',
			error: err instanceof Error ? err.message : String(err)
		});
	}
}
