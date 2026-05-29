import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { OpenRouterProvider } from '$lib/server/infrastructure/OpenRouterProvider';
import { OPENROUTER_API_KEY, OPENROUTER_HTTP_REFERER } from '$lib/server/db/config';
import { logger } from '$lib/server/logger';
import {
	hydrateOpenRouterCapabilities,
	isOpenRouterCapabilitiesHydrated
} from '$lib/server/model/modelCapabilities';
import { loadDashboardModelsForTier } from '$lib/server/model/dashboardModelsForTier';
import { parseSubscriptionTier } from '$lib/shared/subscriptionTier';

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');

	const provider = new OpenRouterProvider(
		OPENROUTER_API_KEY,
		OPENROUTER_HTTP_REFERER || undefined
	);
	let catalog;
	try {
		catalog = await provider.listModels();
	} catch (err) {
		logger.error('OpenRouter models API failed', { error: String(err) });
		error(502, 'Failed to load models');
	}
	if (!isOpenRouterCapabilitiesHydrated() && catalog.length > 0) {
		hydrateOpenRouterCapabilities(catalog);
	}

	const tier = parseSubscriptionTier(user.subscriptionTier);
	const tierModels = loadDashboardModelsForTier(tier, catalog);

	logger.info('Models API', {
		userId: user.id,
		subscriptionTier: tier,
		count: tierModels.models.length
	});
	return json({
		models: tierModels.models,
		modelGroups: tierModels.modelGroups,
		usesAutoRouting: tierModels.usesAutoRouting
	});
};
