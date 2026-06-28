import type { ChatAttachment } from '../domain/ChatProvider.interface';
import { modelSupportsTools } from '../model/modelCapabilities';

const PRIMARY_CHAT_MODEL = 'qwen/qwen3.7-max';
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
		void input.attachments;
		void input.prompt;
		return this.ensureCapabilitySafe(
			PRIMARY_CHAT_MODEL,
			input.enabledToolNames,
			input.defaultModel
		);
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
