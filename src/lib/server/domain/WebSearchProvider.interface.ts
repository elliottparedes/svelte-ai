import type { ExternalToolUsage } from './ExternalToolUsage.types';

export type WebSearchProviderResult = {
	content: string;
	usage?: ExternalToolUsage;
};

export interface WebSearchProvider {
	search(query: string): Promise<WebSearchProviderResult>;
}
