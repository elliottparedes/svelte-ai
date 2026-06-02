import 'dotenv/config';

type WebSearchFallback = 'brave_search' | 'brave_answers';

function getOptionalEnv(key: string, defaultValue = ''): string {
	return process.env[key] ?? defaultValue;
}

function parseFallbacks(): WebSearchFallback[] {
	return getOptionalEnv('WEB_SEARCH_FALLBACK_ORDER', '')
		.split(',')
		.map((x) => x.trim())
		.filter((x): x is WebSearchFallback => x === 'brave_search' || x === 'brave_answers');
}

export const SERPER_API_KEY = getOptionalEnv('SERPER_API_KEY');
export const WEB_SEARCH_PROVIDER = getOptionalEnv('WEB_SEARCH_PROVIDER', 'serper');
export const WEB_SEARCH_FALLBACK_ORDER = parseFallbacks();

export function isSerperConfigured(): boolean {
	return SERPER_API_KEY.trim().length > 0;
}

export function isWebSearchConfigured(): boolean {
	return isSerperConfigured() || WEB_SEARCH_FALLBACK_ORDER.length > 0;
}
