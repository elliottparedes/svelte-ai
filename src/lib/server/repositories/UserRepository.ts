import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { User, CreateUserInput, UserAuthRecord } from '../domain/User.types';
import { DomainError } from '../domain/DomainError';

type UserRow = typeof users.$inferSelect;

function toUser(row: UserRow): User {
	return {
		id: row.id,
		email: row.email,
		name: row.name,
		apiKey: row.apiKey,
		ttsVoiceId: row.ttsVoiceId,
		altModelIds: row.altModelIds,
		createdAt: row.createdAt
	};
}

function toAuthRecord(row: UserRow): UserAuthRecord {
	return { ...toUser(row), passwordHash: row.passwordHash };
}

export class UserRepository {
	async findById(id: string): Promise<User | null> {
		const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
		return rows[0] ? toUser(rows[0]) : null;
	}

	async findByEmail(email: string): Promise<User | null> {
		const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
		return rows[0] ? toUser(rows[0]) : null;
	}

	async findByEmailWithPassword(email: string): Promise<UserAuthRecord | null> {
		const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
		return rows[0] ? toAuthRecord(rows[0]) : null;
	}

	async findByApiKey(apiKey: string): Promise<User | null> {
		const rows = await db.select().from(users).where(eq(users.apiKey, apiKey)).limit(1);
		return rows[0] ? toUser(rows[0]) : null;
	}

	async create(input: CreateUserInput): Promise<User> {
		const id = crypto.randomUUID();
		await db.insert(users).values({
			id,
			email: input.email,
			name: input.name ?? null,
			passwordHash: input.passwordHash,
			apiKey: input.apiKey ?? null
		});
		const user = await this.findById(id);
		if (!user) throw new DomainError('Failed to create user', 500);
		return user;
	}

	async updateTtsVoiceId(userId: string, ttsVoiceId: string | null): Promise<User> {
		await db.update(users).set({ ttsVoiceId }).where(eq(users.id, userId));
		const user = await this.findById(userId);
		if (!user) throw new DomainError('User not found', 404);
		return user;
	}

	async updateAltModelIds(userId: string, enabledIds: readonly string[]): Promise<User> {
		const altModelIds = JSON.stringify([...enabledIds]);
		await db.update(users).set({ altModelIds }).where(eq(users.id, userId));
		const user = await this.findById(userId);
		if (!user) throw new DomainError('User not found', 404);
		return user;
	}
}
