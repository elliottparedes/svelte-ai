import type { ChatAttachment } from '../domain/ChatProvider.interface';
import {
	OPENROUTER_API_KEY,
	OPENROUTER_DEFAULT_MODEL,
	OPENROUTER_HTTP_REFERER,
	OPENROUTER_REASONING_MODEL,
	OPENROUTER_ROUTER_MODEL
} from '../db/config';
import { logger } from '../logger';
import type { ModelRoutingTier } from '$lib/shared/modelRoutingTier';
import { classifyPromptTier } from './modelRouterLlmClassify';
import { modelIdForRoutingTier } from './modelRoutingTierMap';
import { ModelRoutingService, type ModelRoutingInput } from './ModelRoutingService';

export type ModelRouteSource = 'explicit' | 'deep_reasoning' | 'router_llm' | 'heuristic';

export type ModelRouteResult = {
	modelId: string;
	source: ModelRouteSource;
	tier?: ModelRoutingTier;
	routerLatencyMs?: number;
	fallbackReason?: string;
};

export type IntelligentModelRouteInput = {
	userId: string;
	conversationId?: string;
	prompt: string;
	requestedModel?: string;
	deepReasoning?: boolean;
	attachments?: readonly ChatAttachment[];
	enabledToolNames?: readonly string[];
	recentSnippet?: string;
};

const ROUTER_TIMEOUT_MS = 2000;
const heuristic = new ModelRoutingService();

export class IntelligentModelRouter {
	async route(input: IntelligentModelRouteInput): Promise<ModelRouteResult> {
		const baseLog = {
			userId: input.userId,
			conversationId: input.conversationId,
			promptChars: input.prompt.length
		};

		const explicit = input.requestedModel?.trim();
		if (explicit) {
			const modelId = heuristic.resolve(this.toHeuristicInput(input, explicit));
			const result: ModelRouteResult = { modelId, source: 'explicit' };
			logger.info('Model route', { ...baseLog, ...result });
			return result;
		}

		if (input.deepReasoning) {
			const modelId = heuristic.resolve(
				this.toHeuristicInput(input, OPENROUTER_REASONING_MODEL)
			);
			const result: ModelRouteResult = { modelId, source: 'deep_reasoning' };
			logger.info('Model route', { ...baseLog, ...result });
			return result;
		}

		const hasImage = input.attachments?.some((a) => a.type === 'image') ?? false;
		const hasFile = input.attachments?.some((a) => a.type === 'file') ?? false;
		const classified = await classifyPromptTier(
			OPENROUTER_API_KEY,
			OPENROUTER_ROUTER_MODEL,
			{
				prompt: input.prompt,
				hasImageAttachment: hasImage,
				hasFileAttachment: hasFile,
				enabledToolNames: input.enabledToolNames ?? [],
				recentSnippet: input.recentSnippet
			},
			OPENROUTER_HTTP_REFERER || undefined,
			ROUTER_TIMEOUT_MS
		);

		if (classified) {
			let tier = classified.tier;
			if (hasImage || hasFile) tier = 'vision';
			const candidate = modelIdForRoutingTier(tier);
			const modelId = heuristic.resolve(this.toHeuristicInput(input, candidate));
			const result: ModelRouteResult = {
				modelId,
				source: 'router_llm',
				tier,
				routerLatencyMs: classified.latencyMs
			};
			logger.info('Model route', { ...baseLog, routerModel: OPENROUTER_ROUTER_MODEL, ...result });
			return result;
		}

		const modelId = heuristic.resolve(this.toHeuristicInput(input));
		const result: ModelRouteResult = {
			modelId,
			source: 'heuristic',
			fallbackReason: 'router_llm_failed'
		};
		logger.info('Model route', { ...baseLog, routerModel: OPENROUTER_ROUTER_MODEL, ...result });
		return result;
	}

	private toHeuristicInput(
		input: IntelligentModelRouteInput,
		requestedModel?: string
	): ModelRoutingInput {
		return {
			prompt: input.prompt,
			requestedModel,
			attachments: input.attachments,
			enabledToolNames: input.enabledToolNames,
			defaultModel: OPENROUTER_DEFAULT_MODEL
		};
	}
}
