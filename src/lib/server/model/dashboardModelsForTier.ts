import type { ChatModel } from '../domain/ChatProvider.interface';
import type { ModelProviderGroup } from '$lib/types/dashboard';
import type { SubscriptionTier } from '$lib/shared/subscriptionTier';
import { pickRoutingPoolModels } from './routingPoolModels';
import {
	flattenProviderGroups,
	groupOpenRouterModelsByProvider
} from './openRouterProviderGroups';

export type DashboardModelsLoad = {
	models: ChatModel[];
	modelGroups: ModelProviderGroup[];
	defaultModelId: string;
	usesAutoRouting: boolean;
};

export function loadDashboardModelsForTier(
	tier: SubscriptionTier,
	catalog: readonly ChatModel[]
): DashboardModelsLoad {
	if (tier === 'pro') {
		const modelGroups = groupOpenRouterModelsByProvider(catalog);
		const models = flattenProviderGroups(modelGroups);
		return {
			models,
			modelGroups,
			defaultModelId: models[0]?.id ?? '',
			usesAutoRouting: false
		};
	}
	const models = pickRoutingPoolModels(catalog);
	return {
		models,
		modelGroups: [],
		defaultModelId: models[0]?.id ?? '',
		usesAutoRouting: true
	};
}
