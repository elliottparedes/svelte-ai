import { DomainError } from '../domain/DomainError';
import type { ChatRepository } from '../repositories/ChatRepository';
import type { ConversationIssueReportRepository } from '../repositories/ConversationIssueReportRepository';
import type { ConversationTurnRepository } from '../repositories/ConversationTurnRepository';
import type { MessageRepository } from '../repositories/MessageRepository';

export class ConversationIssueReportService {
	constructor(
		private readonly chatRepo: ChatRepository,
		private readonly turnRepo: ConversationTurnRepository,
		private readonly messageRepo: MessageRepository,
		private readonly issueRepo: ConversationIssueReportRepository
	) {}

	async report(userId: string, conversationId: string, clientContext?: Record<string, unknown>) {
		const conv = await this.chatRepo.findById(conversationId);
		if (!conv || conv.userId !== userId) throw new DomainError('Conversation not found', 404);
		const latestTurn = await this.turnRepo.findLatestByConversationId(conversationId);
		if (!latestTurn) throw new DomainError('No chat turn available to report', 400);
		const messages = await this.messageRepo.findByConversationId(conversationId, 1);
		const latestMessageId = messages.at(-1)?.id ?? latestTurn.assistantMessageId ?? latestTurn.userMessageId;
		const reportId = await this.issueRepo.create({
			conversationId,
			turnId: latestTurn.id,
			reportedByUserId: userId,
			latestMessageId,
			clientContextJson: clientContext ? JSON.stringify(clientContext) : null
		});
		return { reportId, turnId: latestTurn.id };
	}
}
