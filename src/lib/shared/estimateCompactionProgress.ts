import {
	compactionThreshold,
	SUMMARY_HOT_TAIL_DEFAULT,
	SUMMARY_INTERVAL_DEFAULT
} from './conversationSummaryConfig';

export type CompactionEstimatableMessage = {
	id: string;
	role: string;
};

export function filterSummarizableForCompaction(
	messages: readonly CompactionEstimatableMessage[]
): CompactionEstimatableMessage[] {
	return messages.filter((m) => m.role === 'user' || m.role === 'assistant');
}

export function messagesAfterWatermarkForCompaction(
	all: readonly CompactionEstimatableMessage[],
	watermarkId: string | null | undefined
): CompactionEstimatableMessage[] {
	if (!watermarkId) return [...all];
	const idx = all.findIndex((m) => m.id === watermarkId);
	if (idx === -1) return [...all];
	return all.slice(idx + 1);
}

export function estimateCompactionProgress(
	messages: readonly CompactionEstimatableMessage[],
	watermarkId: string | null | undefined,
	interval = SUMMARY_INTERVAL_DEFAULT,
	hotTail = SUMMARY_HOT_TAIL_DEFAULT
): { unsummarizedCount: number; threshold: number; pct: number } {
	const summarizable = filterSummarizableForCompaction(
		messagesAfterWatermarkForCompaction(messages, watermarkId)
	);
	const threshold = compactionThreshold(interval, hotTail);
	const unsummarizedCount = summarizable.length;
	const pct =
		threshold > 0 ? Math.min(100, Math.round((unsummarizedCount / threshold) * 100)) : 0;
	return { unsummarizedCount, threshold, pct };
}
