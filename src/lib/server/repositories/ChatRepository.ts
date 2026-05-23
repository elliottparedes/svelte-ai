import { db } from '../db';
import { conversations } from '../db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import type { Conversation, CreateConversationInput, UpdateConversationInput } from '../domain/Conversation.types';
import { DomainError } from '../domain/DomainError';

export class ChatRepository {
	async findById(id: string): Promise<Conversation | null> {
		const rows = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
		return rows[0] ?? null;
	}

	async findByUserId(userId: string): Promise<Conversation[]> {
		return db
			.select()
			.from(conversations)
			.where(and(eq(conversations.userId, userId), isNull(conversations.projectId)))
			.orderBy(desc(conversations.updatedAt));
	}

	async findByProjectId(projectId: string): Promise<Conversation[]> {
		return db
			.select()
			.from(conversations)
			.where(eq(conversations.projectId, projectId))
			.orderBy(desc(conversations.updatedAt));
	}

	async create(input: CreateConversationInput): Promise<Conversation> {
		const id = crypto.randomUUID();
		const now = new Date();
		await db.insert(conversations).values({
			id,
			userId: input.userId,
			projectId: input.projectId ?? null,
			title: input.title,
			modelId: input.modelId ?? null,
			createdAt: now,
			updatedAt: now
		});
		const conv = await this.findById(id);
		if (!conv) throw new DomainError('Failed to create conversation', 500);
		return conv;
	}

	async update(id: string, input: UpdateConversationInput): Promise<Conversation> {
		const updateData: Partial<typeof conversations.$inferInsert> = { updatedAt: new Date() };
		if (input.title !== undefined) updateData.title = input.title;
		if (input.projectId !== undefined) updateData.projectId = input.projectId;
		if (input.modelId !== undefined) updateData.modelId = input.modelId;
		if (input.rollingSummary !== undefined) updateData.rollingSummary = input.rollingSummary;
		if (input.summaryThroughMessageId !== undefined) {
			updateData.summaryThroughMessageId = input.summaryThroughMessageId;
		}

		await db.update(conversations).set(updateData).where(eq(conversations.id, id));
		const conv = await this.findById(id);
		if (!conv) throw new DomainError('Conversation not found', 404);
		return conv;
	}

	async delete(id: string): Promise<void> {
		await db.delete(conversations).where(eq(conversations.id, id));
	}
}
