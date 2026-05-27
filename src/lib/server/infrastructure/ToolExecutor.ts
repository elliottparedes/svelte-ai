import { BRAVE_SEARCH_API_KEY } from '../env';
import { braveWebSearch, braveImageSearch } from './braveSearchClient';
import { fetchUrlContent } from './fetchUrlContent';
import { ImageGenerationService } from './imageGenerationService';
import { executePythonOnPiston } from './pistonClient';
export type ToolRunContext = { conversationId: string };

export class ToolExecutor {
	private readonly imageGenerationService = new ImageGenerationService();

	constructor(private readonly braveApiKey: string = BRAVE_SEARCH_API_KEY) {}

	async run(
		name: string,
		args: Record<string, unknown>,
		ctx?: ToolRunContext
	): Promise<string> {
		switch (name) {
			case 'execute_python':
				return await executePythonOnPiston(String(args.code ?? ''));
			case 'datetime':
				return this.runDatetime();
			case 'fetch_url':
				return await fetchUrlContent(String(args.url ?? ''), args.offset);
			case 'web_search':
				return await braveWebSearch(this.braveApiKey, String(args.query ?? ''));
			case 'image_search':
				return await braveImageSearch(this.braveApiKey, String(args.query ?? ''));
			case 'map_route':
				return 'Error: map_route is disabled';
			case 'generate_image':
				return await this.imageGenerationService.run(args);
			default:
				return `Error: unknown tool ${name}`;
		}
	}

	private runDatetime(): string {
		return new Date().toISOString();
	}
}
