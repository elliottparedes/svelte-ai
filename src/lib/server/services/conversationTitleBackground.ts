import type { ChatRepository } from '../repositories/ChatRepository';
import type { MessageRepository } from '../repositories/MessageRepository';
import type { ConversationTitleService } from './ConversationTitleService';
import type { ChatTurnUsageAccumulator } from './chatTurnUsageAccumulator';
import { CHAT_TITLE_TIMEOUT_MS } from '../db/config';
import { logger } from '../logger';
import { fallbackTitleFromPrompt } from './ConversationTitleService';

export type NewThreadTitleDeps = {
	userId: string;
	chatRepo: ChatRepository;
	titleService: ConversationTitleService | undefined;
	messageRepo?: MessageRepository;
};

type TitlePassResult = { persisted: boolean; llmFailed: boolean };

type PendingTitle = NewThreadTitleDeps & {
	userPrompt: string;
	earlyPass?: Promise<TitlePassResult>;
};

const pending = new Map<string, PendingTitle>();

function isPlaceholderTitle(title: string | null | undefined): boolean {
	const t = title?.trim();
	return !t || t === 'New chat';
}

export function beginNewThreadTitleJob(conversationId: string, userPrompt: string, deps: NewThreadTitleDeps): void {
	if (!deps.titleService) return;
	const job: PendingTitle = { ...deps, userPrompt };
	job.earlyPass = runEarlyTitlePass({ ...job, conversationId });
	pending.set(conversationId, job);
}

export function completeNewThreadTitleJob(
	conversationId: string,
	assistantContent: string,
	assistantMessageId?: string,
	usageAcc?: ChatTurnUsageAccumulator
): void {
	const job = pending.get(conversationId);
	pending.delete(conversationId);
	if (!job) return;
	void finishTitleAfterReply(job, conversationId, assistantContent, assistantMessageId, usageAcc);
}

async function finishTitleAfterReply(
	job: PendingTitle,
	conversationId: string,
	assistantContent: string,
	assistantMessageId?: string,
	usageAcc?: ChatTurnUsageAccumulator
): Promise<void> {
	let early: TitlePassResult = { persisted: false, llmFailed: false };
	try {
		early = (await job.earlyPass) ?? early;
	} catch {
		// logged in runTitlePass
	}
	const conv = await job.chatRepo.findById(conversationId);
	if (!isPlaceholderTitle(conv?.title)) return;

	await runTitlePass({
		...job,
		conversationId,
		assistantContent,
		assistantMessageId,
		usageAcc,
		phase: 'after_reply',
		skipLlm: early.llmFailed
	});
}

async function runEarlyTitlePass(
	params: PendingTitle & { conversationId: string }
): Promise<TitlePassResult> {
	return runTitlePass({ ...params, assistantContent: '', phase: 'early' });
}

async function runTitlePass(params: PendingTitle & {
	conversationId: string;
	assistantContent: string;
	assistantMessageId?: string;
	usageAcc?: ChatTurnUsageAccumulator;
	phase: 'early' | 'after_reply';
	skipLlm?: boolean;
}): Promise<TitlePassResult> {
	const logCtx = { userId: params.userId, conversationId: params.conversationId, phase: params.phase };
	let llmTitle: string | null = null;
	let llmFailed = false;

	if (params.titleService && !params.skipLlm) {
		const started = performance.now();
		try {
			const result =
				params.phase === 'early'
					? await params.titleService.generateFromUserPrompt(params.userPrompt, {
							timeoutMs: CHAT_TITLE_TIMEOUT_MS
						})
					: await params.titleService.generate(params.userPrompt, params.assistantContent, {
							timeoutMs: CHAT_TITLE_TIMEOUT_MS
						});
			llmTitle = result.title;
			if (!llmTitle) llmFailed = true;
			if (result.usage && params.assistantMessageId && params.messageRepo && params.phase === 'after_reply') {
				await params.messageRepo.addUsage(params.assistantMessageId, result.usage);
			}
			if (llmTitle) {
				logger.info('Chat title generated', {
					...logCtx,
					titleChars: llmTitle.length,
					source: 'llm',
					durationMs: Math.round(performance.now() - started)
				});
			}
		} catch (err) {
			llmFailed = true;
			logger.warn('Chat title LLM failed', {
				...logCtx,
				durationMs: Math.round(performance.now() - started),
				error: err instanceof Error ? err.message : String(err)
			});
		}
	}

	const title = llmTitle ?? (params.phase === 'after_reply' ? fallbackTitleFromPrompt(params.userPrompt) : null);
	if (!title) return { persisted: false, llmFailed };

	try {
		await params.chatRepo.update(params.conversationId, { title });
		if (!llmTitle) {
			logger.info('Chat title generated', { ...logCtx, titleChars: title.length, source: 'fallback' });
		}
		return { persisted: true, llmFailed };
	} catch (err) {
		logger.warn('Chat title persist failed', {
			...logCtx,
			error: err instanceof Error ? err.message : String(err)
		});
		return { persisted: false, llmFailed };
	}
}
