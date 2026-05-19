import { error, redirect } from '@sveltejs/kit';
import type { User } from '../domain/User.types';

export function requireUserOrRedirect(locals: App.Locals, redirectTo: string): User {
	if (!locals.user) {
		redirect(302, `/login?redirect=${encodeURIComponent(redirectTo)}`);
	}
	return locals.user;
}

export function requireUserOrError(locals: App.Locals): User {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}
	return locals.user;
}
