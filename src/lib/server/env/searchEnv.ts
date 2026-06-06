import 'dotenv/config';

export type WebSearchProviderName = 'exa' | 'serper' | 'brave_search' | 'brave_answers';

function getOptionalEnv(key: string, defaultValue = ''): string {
	return process.env[key] ?? defaultValue;
}

function isWebSearchProvider(x: string): x is WebSearchProviderName {
	return x === 'exa' || x === 'serper' || x === 'brave_search' || x === 'brave_answers';
}

function parseFallbacks(): WebSearchProviderName[] {
	return getOptionalEnv('WEB_SEARCH_FALLBACK_ORDER', '')
		.split(',')
		.map((x) => x.trim())
		.filter(isWebSearchProvider);
}

export const EXA_AI_API_KEY = getOptionalEnv('EXA_AI_API_KEY', getOptionalEnv('EXA_API_KEY'));
export const SERPER_API_KEY = getOptionalEnv('SERPER_API_KEY');
const rawProvider = getOptionalEnv('WEB_SEARCH_PROVIDER', 'exa');
export const WEB_SEARCH_PROVIDER: WebSearchProviderName = isWebSearchProvider(rawProvider) ? rawProvider : 'exa';
export const WEB_SEARCH_FALLBACK_ORDER = parseFallbacks();

export function isExaConfigured(): boolean {
	return EXA_AI_API_KEY.trim().length > 0;
}

export function isSerperConfigured(): boolean {
	return SERPER_API_KEY.trim().length > 0;
}

export function isWebSearchConfigured(): boolean {
	return isExaConfigured() || isSerperConfigured() || WEB_SEARCH_FALLBACK_ORDER.length > 0;
}
