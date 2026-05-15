import type { Handle } from '@sveltejs/kit';
import { resolveUser } from '$lib/server/infrastructure/auth';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = await resolveUser(event);
	return resolve(event);
};
