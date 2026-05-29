import type { LayoutServerLoad } from './$types';
import { toPublicUser } from '$lib/server/auth/toPublicUser';
import { ChatQuotaService } from '$lib/server/services/ChatQuotaService';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return { user: null, chatQuota: null };
	}
	const chatQuota = await new ChatQuotaService().snapshot(locals.user);
	return {
		user: toPublicUser(locals.user),
		chatQuota
	};
};
