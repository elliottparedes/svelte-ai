import 'dotenv/config';
import { resolveMysqlConn } from './db/mysqlConn';

function getEnv(key: string, defaultValue?: string): string {
	const value = process.env[key];
	if (!value && defaultValue === undefined) {
		throw new Error(`Missing environment variable: ${key}`);
	}
	return value ?? defaultValue!;
}

const _mysql = resolveMysqlConn();
export const DB_HOST = _mysql.host;
export const DB_PORT = _mysql.port;
export const DB_USER = _mysql.user;
export const DB_PASSWORD = _mysql.password;
export const DB_NAME = _mysql.database;
export const SESSION_SECRET = getEnv('SESSION_SECRET', 'dev-secret-change-me');
export const OPENROUTER_API_KEY = getEnv('OPENROUTER_API_KEY');
/** Optional; sent as HTTP-Referer for OpenRouter rankings. */
export const OPENROUTER_HTTP_REFERER = getEnv('OPENROUTER_HTTP_REFERER', '');
/** Preferred model id when the client omits `model` (must exist on OpenRouter). */
export const OPENROUTER_DEFAULT_MODEL = getEnv(
	'OPENROUTER_DEFAULT_MODEL',
	'google/gemini-2.0-flash-001'
);
export const BRAVE_SEARCH_API_KEY = getEnv('BRAVE_SEARCH_API_KEY', '');

/** When false, non-vision models receive images as before (may error). Default: enabled. */
export const VISION_RELAY_ENABLED = getEnv('VISION_RELAY_ENABLED', 'true').toLowerCase() !== 'false';
/** OpenRouter model id with vision; used only to summarize images for non-vision models. */
export const VISION_RELAY_MODEL = getEnv('VISION_RELAY_MODEL', 'google/gemini-2.0-flash-001');
export const VISION_RELAY_MAX_TOKENS = Number(getEnv('VISION_RELAY_MAX_TOKENS', '512')) || 512;
