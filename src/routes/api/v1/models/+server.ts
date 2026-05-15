import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { OpenRouterProvider } from '$lib/server/infrastructure/OpenRouterProvider';
import { OPENROUTER_API_KEY, OPENROUTER_HTTP_REFERER } from '$lib/server/db/config';
import { logger } from '$lib/server/logger';
import {
	hydrateOpenRouterCapabilities,
	isOpenRouterCapabilitiesHydrated
} from '$lib/server/model/modelCapabilities';

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');

	const provider = new OpenRouterProvider(
		OPENROUTER_API_KEY,
		OPENROUTER_HTTP_REFERER || undefined
	);
	let models;
	try {
		models = await provider.listModels();
	} catch (err) {
		logger.error('OpenRouter models API failed', { error: String(err) });
		error(502, 'Failed to load models');
	}
	if (!isOpenRouterCapabilitiesHydrated() && models.length > 0) {
		hydrateOpenRouterCapabilities(models);
	}

	logger.info('Models API', { userId: user.id, count: models.length });
	return json({ models });
};
