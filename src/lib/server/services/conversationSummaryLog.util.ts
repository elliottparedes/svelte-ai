import { logger } from '../logger';

export function logRollingSummaryContextApplied(meta: {
	userId: string;
	conversationId: string;
	summaryChars: number;
	watermarkMessageId: string | null;
	tailMessageCount: number;
	rawHistoryCount: number;
}): void {
	logger.info('Rolling summary applied to prompt context', meta);
}

export function logRollingSummaryStaleWatermark(meta: {
	userId: string;
	conversationId: string;
	watermarkMessageId: string | null;
	rawHistoryCount: number;
}): void {
	logger.warn('Rolling summary watermark stale; sending full history to model', meta);
}

export function logRollingSummaryCheck(meta: {
	userId: string;
	conversationId: string;
	unsummarizedCount: number;
	batchSize: number;
	interval: number;
	hotTail: number;
	needsBackfill: boolean;
	willExtend: boolean;
	watermarkMessageId: string | null;
	hasExistingSummary: boolean;
}): void {
	logger.info('Rolling summary post-reply check', meta);
}

export function logRollingSummarySkipped(meta: {
	userId: string;
	conversationId: string;
	reason: 'threshold_not_met' | 'empty_batch';
	unsummarizedCount: number;
	interval: number;
	hotTail: number;
}): void {
	logger.debug('Rolling summary skipped', meta);
}

export function logRollingSummaryStarted(meta: {
	userId: string;
	conversationId: string;
	batchSize: number;
	batchFirstMessageId: string;
	batchLastMessageId: string;
	previousSummaryChars: number;
	incremental: boolean;
	modelId: string;
}): void {
	logger.info('Rolling summary compression started', meta);
}

export function logRollingSummaryExtended(meta: {
	userId: string;
	conversationId: string;
	batchSize: number;
	previousSummaryChars: number;
	summaryChars: number;
	watermarkMessageId: string;
	durationMs: number;
}): void {
	logger.info('Rolling summary extended', meta);
}

export function logRollingSummaryFailed(meta: {
	userId: string;
	conversationId: string;
	stage: 'load' | 'race' | 'model' | 'persist';
	error?: string;
}): void {
	logger.warn('Rolling summary failed', meta);
}
