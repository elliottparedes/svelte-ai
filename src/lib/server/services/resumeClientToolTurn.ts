import type { ChatProvider, ChatMessage } from '../domain/ChatProvider.interface';
import type { Conversation } from '../domain/Conversation.types';
import type { MessageRepository } from '../repositories/MessageRepository';
import type { ProjectRepository } from '../repositories/ProjectRepository';
import { assembleHistoryWithSummary } from './assembleHistoryWithSummary';
import { buildSystemMessagesForTurn } from './conversationSystemMessages';
import { normalizeHistoryForProvider } from './conversationHistoryForProvider';
import { resolveToolingForTurn } from './conversationToolTurnConfig';
import { trimChatMessagesByTokenBudget } from './conversationHistoryTrim';
import { estimateMessagesTokens } from '$lib/shared/estimateContextTokens';
import { toolDefinitionsForOrderedNames } from './conversationToolsPick';

const HISTORY_FETCH_LIMIT = 2000;
const FALLBACK_PROMPT_TOKEN_BUDGET = 28_000;

function parseToolNames(raw: string | null | undefined): string[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw) as unknown;
		return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
	} catch {
		return [];
	}
}

export async function prepareResumedToolTurn(params: {
	conversation: Conversation | null;
	messageRepo: MessageRepository;
	projectRepo?: ProjectRepository;
	provider: ChatProvider;
	modelId: string;
	enabledToolNamesJson?: string | null;
	browserTimeZone?: string;
}): Promise<{
	augmentedHistory: ChatMessage[];
	toolsForTurn: ReturnType<typeof toolDefinitionsForOrderedNames>;
	options: Record<string, unknown>;
}> {
	const rawHistory = await params.messageRepo.findByConversationId(
		params.conversation?.id ?? '',
		HISTORY_FETCH_LIMIT
	);
	const assembled = assembleHistoryWithSummary(
		params.conversation,
		normalizeHistoryForProvider(rawHistory)
	);
	const enabledToolNames = parseToolNames(params.enabledToolNamesJson);
	const tooling = resolveToolingForTurn({
		toolsCapable: true,
		relayApplied: false,
		enabledToolNames
	});
	const prefix = await buildSystemMessagesForTurn(
		params.conversation,
		params.projectRepo,
		tooling.systemContentForMessages,
		params.browserTimeZone
	);
	const promptBudget =
		(await params.provider.getPromptTokenBudget?.(params.modelId)) ?? FALLBACK_PROMPT_TOKEN_BUDGET;
	const historyBudget = Math.max(1024, promptBudget - estimateMessagesTokens(prefix));
	return {
		augmentedHistory: [...prefix, ...trimChatMessagesByTokenBudget(assembled.history, historyBudget)],
		toolsForTurn: toolDefinitionsForOrderedNames(tooling.effectiveNames),
		options: { model: params.modelId }
	};
}
