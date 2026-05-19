import type { LayoutServerLoad } from './$types';
import { requireUserOrRedirect } from '$lib/server/auth/requireUser';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	requireUserOrRedirect(locals, url.pathname);
	return {};
};
