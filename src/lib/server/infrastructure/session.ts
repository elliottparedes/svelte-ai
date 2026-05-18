import type { Cookies } from '@sveltejs/kit';

export const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function setSessionCookie(cookies: Cookies, userId: string): void {
	cookies.set(SESSION_COOKIE, userId, {
		path: '/',
		httpOnly: true,
		secure: false,
		maxAge: SESSION_MAX_AGE
	});
}
