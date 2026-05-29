import type { PageServerLoad } from './$types';
import type { ChatModel } from '$lib/server/domain/ChatProvider.interface';
import { ChatRepository } from '$lib/server/repositories/ChatRepository';
import { ProjectRepository } from '$lib/server/repositories/ProjectRepository';
import { OpenRouterProvider } from '$lib/server/infrastructure/OpenRouterProvider';
import {
	OPENROUTER_API_KEY,
	OPENROUTER_HTTP_REFERER,
	isElevenLabsConfigured
} from '$lib/server/db/config';
import { logger } from '$lib/server/logger';
import {
	hydrateOpenRouterCapabilities,
	isOpenRouterCapabilitiesHydrated
} from '$lib/server/model/modelCapabilities';
import { loadDashboardModelsForTier } from '$lib/server/model/dashboardModelsForTier';
import { parseSubscriptionTier } from '$lib/shared/subscriptionTier';
import { ChatQuotaService } from '$lib/server/services/ChatQuotaService';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;

	const chatRepo = new ChatRepository();
	const projectRepo = new ProjectRepository();

	const [conversations, projects, chatQuota] = await Promise.all([
		chatRepo.findByUserId(user.id),
		projectRepo.findByUserId(user.id),
		new ChatQuotaService().snapshot(user)
	]);

	const provider = new OpenRouterProvider(
		OPENROUTER_API_KEY,
		OPENROUTER_HTTP_REFERER || undefined
	);
	let catalog: ChatModel[] = [];
	try {
		catalog = [...(await provider.listModels())];
	} catch (err) {
		logger.error('OpenRouter models failed', { error: String(err) });
	}
	if (!isOpenRouterCapabilitiesHydrated() && catalog.length > 0) {
		hydrateOpenRouterCapabilities(catalog);
	}

	const tier = parseSubscriptionTier(user.subscriptionTier);
	const tierModels = loadDashboardModelsForTier(tier, catalog);

	logger.info('Dashboard load', {
		userId: user.id,
		subscriptionTier: tier,
		conversations: conversations.length,
		projects: projects.length,
		catalogModels: catalog.length,
		dashboardModels: tierModels.models.length
	});

	return {
		conversations,
		projects,
		models: tierModels.models,
		modelGroups: tierModels.modelGroups,
		defaultModelId: tierModels.defaultModelId,
		usesAutoRouting: tierModels.usesAutoRouting,
		chatQuota,
		ttsEnabled: isElevenLabsConfigured()
	};
};
