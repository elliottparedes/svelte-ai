import { SEARXNG_URL } from '../env';
import { searxngWebSearch, searxngImageSearch } from './searxngClient';
import { ImageGenerationService } from './imageGenerationService';
import { executePythonOnPiston } from './pistonClient';
export type ToolRunContext = { conversationId: string };

export class ToolExecutor {
	private readonly imageGenerationService = new ImageGenerationService();

	constructor(private readonly searxngUrl: string = SEARXNG_URL) {}

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
				return await this.runFetchUrl(String(args.url ?? ''));
			case 'web_search':
				return await searxngWebSearch(this.searxngUrl, String(args.query ?? ''));
			case 'image_search':
				return await searxngImageSearch(this.searxngUrl, String(args.query ?? ''));
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

	private async runFetchUrl(url: string): Promise<string> {
		try {
			const res = await fetch(url, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
					Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
				}
			});
			if (!res.ok) return `Error: HTTP ${res.status}`;
			const html = await res.text();
			return this.htmlToText(html).slice(0, 8000);
		} catch {
			return 'Error: failed to fetch URL';
		}
	}

	private htmlToText(html: string): string {
		return html
			.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
			.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/&nbsp;/g, ' ')
			.replace(/&#[0-9]+;/g, ' ')
			.replace(/&[a-z]+;/gi, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}
}
