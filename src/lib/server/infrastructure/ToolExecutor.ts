import type { ExternalToolUsage } from '../domain/ExternalToolUsage.types';
import { braveImageSearchWithUsage } from './braveImageSearch';
import { fetchUrlContent } from './fetchUrlContent';
import { exaUrlContent } from './exaUrlContent';
import { ImageGenerationService } from './imageGenerationService';
import { WebSearchRouter } from './WebSearchRouter';
import { BRAVE_SEARCH_API_KEY } from '../env';
import { EXA_AI_API_KEY } from '../env/searchEnv';
export type ToolRunContext = {
	conversationId: string;
	userId?: string;
	llmTurn?: number;
	sandboxFiles?: readonly { name: string; content: string }[];
};
export type ToolRunResult = { content: string; usage?: ExternalToolUsage };
const IMAGE_GENERATION_TEMP_DISABLED = true;

export class ToolExecutor {
	private readonly imageGenerationService = new ImageGenerationService();

	constructor(
		private readonly braveApiKey: string = BRAVE_SEARCH_API_KEY,
		private readonly exaApiKey: string = EXA_AI_API_KEY,
		private readonly webSearchRouter: WebSearchRouter = new WebSearchRouter()
	) {}

	async run(
		name: string,
		args: Record<string, unknown>,
		ctx?: ToolRunContext
	): Promise<ToolRunResult> {
		switch (name) {
			case 'execute_javascript':
				return {
					content: 'Error: execute_javascript must run in the browser worker.'
				};
			case 'fetch_url':
				return await this.runFetchUrl(String(args.url ?? ''), args.offset);
			case 'web_search':
				return await this.runWebSearch(String(args.query ?? ''), ctx);
			case 'image_search':
				return await braveImageSearchWithUsage(this.braveApiKey, String(args.query ?? ''));
			case 'map_route':
				return { content: 'Error: map_route is disabled' };
			case 'generate_image':
				return {
					content: IMAGE_GENERATION_TEMP_DISABLED
						? 'Error: generate_image is temporarily disabled.'
						: await this.imageGenerationService.run(args)
				};
			default:
				return { content: `Error: unknown tool ${name}` };
		}
	}

	private async runWebSearch(query: string, ctx?: ToolRunContext): Promise<ToolRunResult> {
		void ctx;
		return await this.webSearchRouter.search(query);
	}

	private async runFetchUrl(url: string, offset?: unknown): Promise<ToolRunResult> {
		if (this.exaApiKey.trim()) {
			const result = await exaUrlContent(this.exaApiKey, url, offset);
			if (!result.content.startsWith('Error:')) return result;
		}
		return { content: await fetchUrlContent(url, offset) };
	}
}
