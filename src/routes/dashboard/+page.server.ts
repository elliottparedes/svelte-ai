import type { PageServerLoad } from './$types';
import type { ChatModel } from '$lib/server/domain/ChatProvider.interface';
import { ChatRepository } from '$lib/server/repositories/ChatRepository';
import { ProjectRepository } from '$lib/server/repositories/ProjectRepository';
import { OpenRouterProvider } from '$lib/server/infrastructure/OpenRouterProvider';
import {
	OPENROUTER_API_KEY,
	OPENROUTER_HTTP_REFERER,
	OPENROUTER_DEFAULT_MODEL
} from '$lib/server/db/config';
import { redirect } from '@sveltejs/kit';
import { logger } from '$lib/server/logger';
import {
	hydrateOpenRouterCapabilities,
	isOpenRouterCapabilitiesHydrated
} from '$lib/server/model/modelCapabilities';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) redirect(302, '/login');

	const chatRepo = new ChatRepository();
	const projectRepo = new ProjectRepository();

	const [conversations, projects] = await Promise.all([
		chatRepo.findByUserId(user.id),
		projectRepo.findByUserId(user.id)
	]);

	const provider = new OpenRouterProvider(
		OPENROUTER_API_KEY,
		OPENROUTER_HTTP_REFERER || undefined
	);
	let models: ChatModel[] = [];
	try {
		models = [...(await provider.listModels())].sort((a, b) =>
			a.name.localeCompare(b.name)
		);
	} catch (err) {
		logger.error('OpenRouter models failed', { error: String(err) });
	}
	if (!isOpenRouterCapabilitiesHydrated() && models.length > 0) {
		hydrateOpenRouterCapabilities(models);
	}

	logger.info('Dashboard load', {
		userId: user.id,
		conversations: conversations.length,
		projects: projects.length,
		models: models.length
	});

	return { conversations, projects, models, defaultModelId: OPENROUTER_DEFAULT_MODEL };
};
