import {
	DEFAULT_CHAT_TOOL_IDS,
	buildChatToolSystemPrompt,
	buildChatToolSystemPromptNoWeb,
	normalizeChatToolIds,
	TOOL_PROMPT_NONE_ENABLED,
	type ChatToolId
} from '$lib/shared/chatToolSystemPrompt';
import { isPistonConfigured } from '../env';
import { isWebSearchConfigured } from '../env/searchEnv';
import { TOOL_SYSTEM_PROMPT_NO_TOOLS } from './conversationTools.config';

// Temporary cost-control switch: keep image generation disabled in chat tool turns.
const IMAGE_GENERATION_TEMP_DISABLED = true;

function stripUnconfiguredTools(ids: ChatToolId[]): ChatToolId[] {
	let out = ids;
	if (!isPistonConfigured()) out = out.filter((id) => id !== 'execute_python');
	if (!isWebSearchConfigured()) out = out.filter((id) => id !== 'web_search');
	if (IMAGE_GENERATION_TEMP_DISABLED) out = out.filter((id) => id !== 'generate_image');
	return out;
}

export function resolveToolingForTurn(params: {
	toolsCapable: boolean;
	relayApplied: boolean;
	enabledToolNames: readonly string[] | undefined;
}): { effectiveNames: ChatToolId[]; systemContentForMessages: string } {
	const { toolsCapable, relayApplied, enabledToolNames } = params;
	const clientTools =
		enabledToolNames !== undefined ? normalizeChatToolIds(enabledToolNames) : null;
	let effectiveNames: ChatToolId[] = !toolsCapable
		? []
		: clientTools !== null
			? relayApplied
				? clientTools.filter((n) => n !== 'web_search')
				: [...clientTools]
			: relayApplied
				? DEFAULT_CHAT_TOOL_IDS.filter((id) => id !== 'web_search')
				: [...DEFAULT_CHAT_TOOL_IDS];
	effectiveNames = stripUnconfiguredTools(effectiveNames);

	if (!toolsCapable) return { effectiveNames, systemContentForMessages: TOOL_SYSTEM_PROMPT_NO_TOOLS };
	if (effectiveNames.length === 0) return { effectiveNames, systemContentForMessages: TOOL_PROMPT_NONE_ENABLED };
	const systemContentForMessages = relayApplied
		? buildChatToolSystemPromptNoWeb(effectiveNames)
		: buildChatToolSystemPrompt(effectiveNames);
	return { effectiveNames, systemContentForMessages };
}
