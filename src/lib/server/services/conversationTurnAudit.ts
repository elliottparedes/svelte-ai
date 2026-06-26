import type { ChatAttachment } from '../domain/ChatProvider.interface';
import type { ConversationToolAudit } from '../domain/ConversationTurn.types';

export type ConversationTurnAuditState = {
	turnId?: string;
	assistantMessageId?: string;
	assistantChars: number;
	toolCalls: ConversationToolAudit[];
};

export function createConversationTurnAuditState(): ConversationTurnAuditState {
	return { assistantChars: 0, toolCalls: [] };
}

export function attachmentsAuditJson(attachments: readonly ChatAttachment[] | undefined): string | null {
	if (!attachments?.length) return null;
	return JSON.stringify(
		attachments.map((a) => ({
			type: a.type,
			name: a.name,
			mimeType: a.mimeType ?? null,
			chars: a.content?.length ?? null,
			dataUrlChars: a.dataUrl?.length ?? null
		}))
	);
}
