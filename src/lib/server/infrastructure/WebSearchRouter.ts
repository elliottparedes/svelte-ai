import { BRAVE_SEARCH_API_KEY } from '../env';
import { BRAVE_ANSWER_API_KEY } from '../env/braveEnv';
import { SERPER_API_KEY, WEB_SEARCH_FALLBACK_ORDER } from '../env/searchEnv';
import type { WebSearchProviderResult } from '../domain/WebSearchProvider.interface';
import { braveAnswersSearch } from './braveAnswersClient';
import { braveWebSearchWithUsage } from './braveSearchClient';
import { serperWebSearch } from './serperSearchClient';

function isError(result: WebSearchProviderResult): boolean {
	return result.content.startsWith('Error:');
}

export class WebSearchRouter {
	constructor(
		private readonly serperApiKey: string = SERPER_API_KEY,
		private readonly braveApiKey: string = BRAVE_SEARCH_API_KEY,
		private readonly braveAnswersApiKey: string = BRAVE_ANSWER_API_KEY
	) {}

	async search(query: string): Promise<WebSearchProviderResult> {
		if (this.serperApiKey.trim()) {
			const result = await serperWebSearch(this.serperApiKey, query);
			if (!isError(result)) return result;
			const fallback = await this.tryFallbacks(query);
			return fallback ?? result;
		}
		return (await this.tryFallbacks(query)) ?? {
			content: 'Error: web search is not configured (set SERPER_API_KEY)'
		};
	}

	private async tryFallbacks(query: string): Promise<WebSearchProviderResult | null> {
		for (const provider of WEB_SEARCH_FALLBACK_ORDER) {
			if (provider === 'brave_search' && this.braveApiKey.trim()) {
				const result = await braveWebSearchWithUsage(this.braveApiKey, query);
				if (!isError(result)) return result;
			}
			if (provider === 'brave_answers' && this.braveAnswersApiKey.trim()) {
				const result = await braveAnswersSearch(this.braveAnswersApiKey, query);
				if (!isError(result)) return result;
			}
		}
		return null;
	}
}
