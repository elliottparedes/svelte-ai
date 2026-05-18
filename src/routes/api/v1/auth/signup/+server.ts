import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { AuthService } from '$lib/server/services/AuthService';
import { signupSchema } from '$lib/server/validation/auth.schema';
import { handleDomainError } from '$lib/server/domain/DomainError';
import { setSessionCookie } from '$lib/server/infrastructure/session';

export const POST: RequestHandler = async ({ request, cookies }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	const parseResult = signupSchema.safeParse(body);
	if (!parseResult.success) {
		error(400, parseResult.error.issues.map((i) => i.message).join(', '));
	}

	try {
		const auth = new AuthService();
		const { email, password, name } = parseResult.data;
		const user = await auth.register(email, password, name);
		setSessionCookie(cookies, user.id);
		return json(
			{
				success: true,
				user: { id: user.id, email: user.email, name: user.name }
			},
			{ status: 201 }
		);
	} catch (err) {
		handleDomainError(err);
	}
};
