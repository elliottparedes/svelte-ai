import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { User, CreateUserInput } from '../domain/User.types';
import { DomainError } from '../domain/DomainError';

export class UserRepository {
	async findById(id: string): Promise<User | null> {
		const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
		return rows[0] ?? null;
	}

	async findByEmail(email: string): Promise<User | null> {
		const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
		return rows[0] ?? null;
	}

	async findByApiKey(apiKey: string): Promise<User | null> {
		const rows = await db.select().from(users).where(eq(users.apiKey, apiKey)).limit(1);
		return rows[0] ?? null;
	}

	async create(input: CreateUserInput): Promise<User> {
		const id = crypto.randomUUID();
		await db.insert(users).values({
			id,
			email: input.email,
			name: input.name ?? null,
			apiKey: input.apiKey ?? null
		});
		const user = await this.findById(id);
		if (!user) throw new DomainError('Failed to create user', 500);
		return user;
	}
}
