export const CLIENT_CODE_TOOL = 'execute_javascript';

export type SandboxDataFile = {
	name: string;
	content: string;
};

export type ResumableUsageSnapshot = {
	llmCostUsd: number;
	promptTokens: number;
	completionTokens: number;
	externalItems: {
		provider: string;
		toolName: string;
		costUsd: number;
		requests?: number;
		queries?: number;
		inputTokens?: number;
		outputTokens?: number;
	}[];
};

export function isClientExecutedTool(name: string): boolean {
	return name === CLIENT_CODE_TOOL;
}
