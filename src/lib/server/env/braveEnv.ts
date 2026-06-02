import 'dotenv/config';

function getOptionalEnv(key: string, defaultValue = ''): string {
	return process.env[key] ?? defaultValue;
}

function boundedInt(key: string, defaultValue: number, min: number, max: number): number {
	const raw = Number(getOptionalEnv(key, String(defaultValue)));
	return Math.min(max, Math.max(min, Number.isFinite(raw) ? raw : defaultValue));
}

function contextSize(): 'low' | 'medium' | 'high' {
	const raw = getOptionalEnv('BRAVE_ANSWERS_SEARCH_CONTEXT_SIZE', 'low').toLowerCase();
	return raw === 'medium' || raw === 'high' ? raw : 'low';
}

export const BRAVE_ANSWER_API_KEY = getOptionalEnv('BRAVE_ANSWER_API_KEY');
export const BRAVE_ANSWERS_COUNTRY = getOptionalEnv('BRAVE_ANSWERS_COUNTRY', 'US');
export const BRAVE_ANSWERS_LANG = getOptionalEnv('BRAVE_ANSWERS_LANG', 'en');
export const BRAVE_ANSWERS_MAX_COMPLETION_TOKENS = boundedInt(
	'BRAVE_ANSWERS_MAX_COMPLETION_TOKENS',
	600,
	128,
	4096
);
export const BRAVE_ANSWERS_SEARCH_CONTEXT_SIZE = contextSize();
export const BRAVE_ANSWERS_ENABLE_RESEARCH =
	getOptionalEnv('BRAVE_ANSWERS_ENABLE_RESEARCH', 'false').toLowerCase() === 'true';

export function isBraveAnswersConfigured(): boolean {
	return BRAVE_ANSWER_API_KEY.trim().length > 0;
}
