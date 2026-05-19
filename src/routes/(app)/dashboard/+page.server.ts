import type { PageServerLoad } from './$types';
import type { ChatModel } from '$lib/server/domain/ChatProvider.interface';
import { ChatRepository } from '$lib/server/repositories/ChatRepository';
import { ProjectRepository } from '$lib/server/repositories/ProjectRepository';
import { OpenRouterProvider } from '$lib/server/infrastructure/OpenRouterProvider';
import {
	OPENROUTER_API_KEY,
	OPENROUTER_HTTP_REFERER,
	OPENROUTER_DEFAULT_MODEL,
	isElevenLabsConfigured
} from '$lib/server/db/config';
import { logger } from '$lib/server/logger';
import {
	hydrateOpenRouterCapabilities,
	isOpenRouterCapabilitiesHydrated
} from '$lib/server/model/modelCapabilities';
import { pickCuratedDashboardModels } from '$lib/server/model/curatedDashboardModels';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;

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
	let catalog: ChatModel[] = [];
	try {
		catalog = [...(await provider.listModels())].sort((a, b) => a.name.localeCompare(b.name));
	} catch (err) {
		logger.error('OpenRouter models failed', { error: String(err) });
	}
	if (!isOpenRouterCapabilitiesHydrated() && catalog.length > 0) {
		hydrateOpenRouterCapabilities(catalog);
	}
	const { models, groups: modelGroups } = pickCuratedDashboardModels(catalog);

	logger.info('Dashboard load', {
		userId: user.id,
		conversations: conversations.length,
		projects: projects.length,
		catalogModels: catalog.length,
		curatedModels: models.length
	});

	return {
		conversations,
		projects,
		models,
		modelGroups,
		defaultModelId: OPENROUTER_DEFAULT_MODEL,
		ttsEnabled: isElevenLabsConfigured()
	};
};
