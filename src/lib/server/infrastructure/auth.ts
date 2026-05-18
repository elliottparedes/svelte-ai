import type { RequestEvent } from '@sveltejs/kit';
import { UserRepository } from '../repositories/UserRepository';
import type { User } from '../domain/User.types';

import { SESSION_COOKIE } from './session';
const AUTH_HEADER = 'authorization';
const BEARER_PREFIX = 'Bearer ';

export async function resolveUser(event: RequestEvent): Promise<User | null> {
	const userRepo = new UserRepository();

	const bearer = extractBearer(event.request.headers);
	if (bearer) {
		const user = await userRepo.findByApiKey(bearer);
		if (user) return user;
	}

	const sessionId = event.cookies.get(SESSION_COOKIE);
	if (sessionId) {
		const user = await userRepo.findById(sessionId);
		if (user) return user;
	}

	return null;
}

function extractBearer(headers: Headers): string | null {
	const auth = headers.get(AUTH_HEADER);
	if (!auth || !auth.startsWith(BEARER_PREFIX)) return null;
	return auth.slice(BEARER_PREFIX.length).trim();
}
