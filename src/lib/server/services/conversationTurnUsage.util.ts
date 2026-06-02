import type { OpenRouterUsage } from '../domain/OpenRouterUsage.types';
import type { ExternalToolUsageSummary } from '../domain/ExternalToolUsage.types';
import type { ConversationProcessEvent } from './conversationProcess.types';
import type { ChatTurnUsageAccumulator } from './chatTurnUsageAccumulator';

export function usageProcessEvent(acc: ChatTurnUsageAccumulator): ConversationProcessEvent {
	const s = acc.snapshot();
	const external = acc.snapshotExternal();
	return {
		type: 'usage',
		turnCostUsd: s.costUsd + external.costUsd,
		turnLlmCostUsd: s.costUsd,
		turnToolCostUsd: external.costUsd,
		turnPromptTokens: s.promptTokens,
		turnCompletionTokens: s.completionTokens
	};
}

export function usageFieldsForMessage(usage: OpenRouterUsage | null | undefined): {
	costUsd: string | null;
	promptTokens: number | null;
	completionTokens: number | null;
} {
	if (!usage || usage.costUsd === 0) {
		return { costUsd: null, promptTokens: null, completionTokens: null };
	}
	return {
		costUsd: usage.costUsd.toFixed(6),
		promptTokens: usage.promptTokens || null,
		completionTokens: usage.completionTokens || null
	};
}

export function toolUsageFieldsForMessage(usage: ExternalToolUsageSummary | null | undefined): {
	toolCostUsd: string | null;
	toolUsageJson: string | null;
} {
	if (!usage || usage.costUsd === 0) return { toolCostUsd: null, toolUsageJson: null };
	return {
		toolCostUsd: usage.costUsd.toFixed(6),
		toolUsageJson: JSON.stringify(usage.items)
	};
}

export function parseMessageCostUsd(raw: string | null | undefined): number | undefined {
	if (raw == null || raw === '') return undefined;
	const n = Number(raw);
	return Number.isFinite(n) && n > 0 ? n : undefined;
}
