import { UserRepository } from '../repositories/UserRepository';
import { DomainError } from '../domain/DomainError';
import type { User } from '../domain/User.types';

export class AuthService {
	constructor(private readonly userRepo: UserRepository = new UserRepository()) {}

	async authenticateByApiKey(apiKey: string): Promise<User | null> {
		return this.userRepo.findByApiKey(apiKey);
	}

	async authenticateBySession(userId: string): Promise<User | null> {
		return this.userRepo.findById(userId);
	}

	async registerOrRetrieve(email: string, name?: string): Promise<User> {
		const existing = await this.userRepo.findByEmail(email);
		if (existing) return existing;
		return this.userRepo.create({ email, name });
	}
}
