import type { RequestHandler } from '@sveltejs/kit';
import { error, json, redirect } from '@sveltejs/kit';
import { UserRepository } from '$lib/server/repositories/UserRepository';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json().catch(() => ({}));
	const email = body?.email;

	if (!email || typeof email !== 'string') {
		error(400, 'Email required');
	}

	const repo = new UserRepository();
	const user = await repo.findByEmail(email);
	if (!user) {
		error(401, 'Invalid credentials');
	}

	cookies.set('session', user.id, {
		path: '/',
		httpOnly: true,
		secure: false,
		maxAge: 60 * 60 * 24 * 30
	});

	return json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
};
