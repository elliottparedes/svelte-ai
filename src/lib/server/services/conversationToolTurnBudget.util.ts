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
				undefined,
				ev.reasoning.trim() || undefined,
				params.usageAcc.snapshot()
			);
			logger.info('Assistant reply complete', {
				userId: params.userId,
				conversationId: params.conversationId,
				model: params.modelLabel,
				replyChars: ev.reply.length,
				toolInvocations: params.toolInvocations,
				llmTurn: params.llmTurn,
				afterMaxToolTurns: true,
				costUsd: params.usageAcc.costUsd
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
