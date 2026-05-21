import type { ChatAttachment } from '../domain/ChatProvider.interface';
import { modelSupportsTools } from '../model/modelCapabilities';

const ULTRA_CHEAP_MODEL = 'z-ai/glm-4.7-flash';
const VALUE_MODEL = 'qwen/qwen3.5-flash-02-23';
const TOOL_FALLBACK_MODEL = 'openai/gpt-4o-mini';

export type ModelRoutingInput = {
	prompt: string;
	requestedModel?: string;
	attachments?: readonly ChatAttachment[];
	enabledToolNames?: readonly string[];
	defaultModel: string;
};

export class ModelRoutingService {
	resolve(input: ModelRoutingInput): string {
		const requested = input.requestedModel?.trim();
		if (requested) {
			return this.ensureCapabilitySafe(requested, input.enabledToolNames, input.defaultModel);
		}
		const hasAttachments = (input.attachments?.length ?? 0) > 0;
		const hasTools = (input.enabledToolNames?.length ?? 0) > 0;
		if (!hasAttachments && !hasTools && input.prompt.trim().length < 120) {
			return ULTRA_CHEAP_MODEL;
		}
		const candidate = hasTools ? VALUE_MODEL : input.defaultModel;
		return this.ensureCapabilitySafe(candidate, input.enabledToolNames, input.defaultModel);
	}

	private ensureCapabilitySafe(
		modelId: string,
		enabledToolNames: readonly string[] | undefined,
		defaultModel: string
	): string {
		const requiresTools = (enabledToolNames?.length ?? 0) > 0;
		if (requiresTools && !modelSupportsTools(modelId)) {
			if (modelSupportsTools(defaultModel)) return defaultModel;
			return TOOL_FALLBACK_MODEL;
		}
		return modelId;
	}
}
