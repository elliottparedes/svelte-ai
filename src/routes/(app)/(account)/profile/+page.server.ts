import type { PageServerLoad } from './$types';
import { resolveUserAltModelIds } from '$lib/shared/optionalDashboardModels';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	return {
		enabledAltModelIds: resolveUserAltModelIds(user.altModelIds)
	};
};
