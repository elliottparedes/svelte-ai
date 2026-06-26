import type { ChatAttachment, ChatMessage, ChatProvider } from '../domain/ChatProvider.interface';
import type { MessageRepository } from '../repositories/MessageRepository';
import { logger } from '../logger';
import { eachBudgetExhaustionChunk } from './conversationMaxToolsFinish';
import type { ConversationProcessEvent } from './conversationProcess.types';
import type { ChatTurnUsageAccumulator } from './chatTurnUsageAccumulator';
import { usageProcessEvent } from './conversationTurnUsage.util';
import { afterAssistantSaved } from './conversationToolTurnAfterSave.util';
import type { runConversationToolTurns } from './conversationToolTurns';

type TurnParams = Parameters<typeof runConversationToolTurns>[0];

export async function* yieldBudgetExhaustionFinish(
	params: TurnParams & { augmentedHistory: ChatMessage[]; toolInvocations: number; llmTurn: number }
): AsyncGenerator<ConversationProcessEvent> {
	for await (const ev of eachBudgetExhaustionChunk(
		params.provider,
		params.augmentedHistory,
		params.streamAttachments,
		params.options,
		params.usageAcc
	)) {
		if (ev.kind === 'reasoning') yield { type: 'reasoning' as const, content: ev.content };
		else if (ev.kind === 'chunk') yield { type: 'chunk' as const, content: ev.content };
		else {
			const saved = await params.messageRepo.create(
				params.conversationId,
				'assistant',
				ev.reply,
				{
					turnId: params.turnId,
					turnSequence: 1000 + params.toolInvocations,
					reasoningContent: ev.reasoning.trim() || undefined,
					usage: params.usageAcc.snapshot(),
					toolUsage: params.usageAcc.snapshotExternal()
				}
			);
			if (params.turnAudit) {
				params.turnAudit.assistantMessageId = saved.id;
				params.turnAudit.assistantChars = ev.reply.length;
			}
			if (params.turnRepo && params.turnId) {
				const snapshot = params.usageAcc.snapshot();
				await params.turnRepo.finalize(params.turnId, {
					assistantMessageId: saved.id,
					responseChars: ev.reply.length,
					llmCostUsd: snapshot.costUsd,
					toolCostUsd: params.usageAcc.toolCostUsd,
					totalCostUsd: params.usageAcc.totalCostUsd,
					promptTokens: snapshot.promptTokens,
					completionTokens: snapshot.completionTokens,
					toolCallsJson: params.turnAudit?.toolCalls.length
						? JSON.stringify(params.turnAudit.toolCalls)
						: null,
					status: 'completed'
				});
			}
			logger.info('Assistant reply complete', {
				userId: params.userId,
				conversationId: params.conversationId,
				model: params.modelLabel,
				replyChars: ev.reply.length,
				toolInvocations: params.toolInvocations,
				llmTurn: params.llmTurn,
				afterMaxToolTurns: true,
				costUsd: params.usageAcc.totalCostUsd,
				llmCostUsd: params.usageAcc.costUsd,
				toolCostUsd: params.usageAcc.toolCostUsd
			});
			yield usageProcessEvent(params.usageAcc);
			yield* afterAssistantSaved({
				...params,
				assistantContent: ev.reply,
				assistantMessageId: saved.id
			});
		}
	}
}
