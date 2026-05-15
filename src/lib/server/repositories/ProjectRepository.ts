import { db } from '../db';
import { projects } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import type { Project, CreateProjectInput, UpdateProjectInput } from '../domain/Project.types';
import { DomainError } from '../domain/DomainError';

export class ProjectRepository {
	async findById(id: string): Promise<Project | null> {
		const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
		return rows[0] ?? null;
	}

	async findByUserId(userId: string): Promise<Project[]> {
		return db
			.select()
			.from(projects)
			.where(eq(projects.userId, userId))
			.orderBy(desc(projects.updatedAt));
	}

	async create(input: CreateProjectInput): Promise<Project> {
		const id = crypto.randomUUID();
		const now = new Date();
		await db.insert(projects).values({
			id,
			userId: input.userId,
			name: input.name,
			systemPrompt: input.systemPrompt ?? null,
			createdAt: now,
			updatedAt: now
		});
		const proj = await this.findById(id);
		if (!proj) throw new DomainError('Failed to create project', 500);
		return proj;
	}

	async update(id: string, input: UpdateProjectInput): Promise<Project> {
		const updateData: Partial<typeof projects.$inferInsert> = { updatedAt: new Date() };
		if (input.name !== undefined) updateData.name = input.name;
		if (input.systemPrompt !== undefined) updateData.systemPrompt = input.systemPrompt;

		await db.update(projects).set(updateData).where(eq(projects.id, id));
		const proj = await this.findById(id);
		if (!proj) throw new DomainError('Project not found', 404);
		return proj;
	}

	async delete(id: string): Promise<void> {
		await db.delete(projects).where(eq(projects.id, id));
	}
}
