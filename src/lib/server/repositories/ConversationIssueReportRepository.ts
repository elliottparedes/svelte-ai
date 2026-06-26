import { db } from '../db';
import { conversationIssueReports } from '../db/schema';

export class ConversationIssueReportRepository {
	async create(input: {
		conversationId: string;
		turnId: string;
		reportedByUserId: string;
		latestMessageId?: string | null;
		clientContextJson?: string | null;
	}): Promise<string> {
		const id = crypto.randomUUID();
		const now = new Date();
		await db.insert(conversationIssueReports).values({
			id,
			conversationId: input.conversationId,
			turnId: input.turnId,
			reportedByUserId: input.reportedByUserId,
			latestMessageId: input.latestMessageId ?? null,
			clientContextJson: input.clientContextJson ?? null,
			createdAt: now,
			updatedAt: now
		});
		return id;
	}
}
