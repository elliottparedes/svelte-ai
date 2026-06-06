import { BRAVE_SEARCH_API_KEY } from '../env';
import { BRAVE_ANSWER_API_KEY } from '../env/braveEnv';
import {
	EXA_AI_API_KEY,
	SERPER_API_KEY,
	WEB_SEARCH_FALLBACK_ORDER,
	WEB_SEARCH_PROVIDER,
	type WebSearchProviderName
} from '../env/searchEnv';
import type { WebSearchProviderResult } from '../domain/WebSearchProvider.interface';
import { braveAnswersSearch } from './braveAnswersClient';
import { braveWebSearchWithUsage } from './braveSearchClient';
import { exaWebSearch } from './exaSearchClient';
import { serperWebSearch } from './serperSearchClient';

function isError(result: WebSearchProviderResult): boolean {
	return result.content.startsWith('Error:');
}

export class WebSearchRouter {
	constructor(
		private readonly exaApiKey: string = EXA_AI_API_KEY,
		private readonly serperApiKey: string = SERPER_API_KEY,
		private readonly braveApiKey: string = BRAVE_SEARCH_API_KEY,
		private readonly braveAnswersApiKey: string = BRAVE_ANSWER_API_KEY,
		private readonly provider: WebSearchProviderName = WEB_SEARCH_PROVIDER
	) {}

	async search(query: string): Promise<WebSearchProviderResult> {
		let firstError: WebSearchProviderResult | null = null;
		for (const provider of this.providerOrder()) {
			const result = await this.tryProvider(provider, query);
			if (!result) continue;
			if (!isError(result)) return result;
			firstError ??= result;
		}
		return firstError ?? { content: 'Error: web search is not configured (set EXA_AI_API_KEY or SERPER_API_KEY)' };
	}

	private providerOrder(): WebSearchProviderName[] {
		const order: WebSearchProviderName[] = [
			this.provider,
			...WEB_SEARCH_FALLBACK_ORDER,
			'serper',
			'brave_search',
			'brave_answers'
		];
		return order.filter((provider, index) => order.indexOf(provider) === index);
	}

	private async tryProvider(provider: WebSearchProviderName, query: string): Promise<WebSearchProviderResult | null> {
		if (provider === 'exa' && this.exaApiKey.trim()) return exaWebSearch(this.exaApiKey, query);
		if (provider === 'serper' && this.serperApiKey.trim()) return serperWebSearch(this.serperApiKey, query);
		if (provider === 'brave_search' && this.braveApiKey.trim()) {
			return braveWebSearchWithUsage(this.braveApiKey, query);
		}
		if (provider === 'brave_answers' && this.braveAnswersApiKey.trim()) {
			return braveAnswersSearch(this.braveAnswersApiKey, query);
		}
		return null;
	}
}
