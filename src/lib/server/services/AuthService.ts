import { UserRepository } from '../repositories/UserRepository';
import { DomainError } from '../domain/DomainError';
import type { User } from '../domain/User.types';
import { hashPassword, verifyPassword } from '../infrastructure/password';

export class AuthService {
	constructor(private readonly userRepo: UserRepository = new UserRepository()) {}

	async authenticateByApiKey(apiKey: string): Promise<User | null> {
		return this.userRepo.findByApiKey(apiKey);
	}

	async authenticateBySession(userId: string): Promise<User | null> {
		return this.userRepo.findById(userId);
	}

	async register(email: string, password: string, name?: string): Promise<User> {
		const existing = await this.userRepo.findByEmail(email);
		if (existing) {
			throw new DomainError('Email already registered', 409);
		}
		const passwordHash = await hashPassword(password);
		return this.userRepo.create({ email, passwordHash, name });
	}

	async login(email: string, password: string): Promise<User> {
		const record = await this.userRepo.findByEmailWithPassword(email);
		if (!record?.passwordHash) {
			throw new DomainError('Invalid credentials', 401);
		}
		const valid = await verifyPassword(password, record.passwordHash);
		if (!valid) {
			throw new DomainError('Invalid credentials', 401);
		}
		return {
			id: record.id,
			email: record.email,
			name: record.name,
			apiKey: record.apiKey,
			createdAt: record.createdAt
		};
	}
}
