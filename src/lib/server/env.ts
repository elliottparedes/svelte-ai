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
	'qwen/qwen3.5-flash-02-23'
);
/** SearXNG base URL (e.g. http://searxng:8080). Empty string disables web search. */
export const SEARXNG_URL = getEnv('SEARXNG_URL', '');
/** Nominatim geocoder base URL (no trailing slash required). */
export const NOMINATIM_BASE_URL = getEnv('NOMINATIM_BASE_URL', 'https://nominatim.openstreetmap.org');
/** OSRM router base URL (no trailing slash required). */
export const OSRM_BASE_URL = getEnv('OSRM_BASE_URL', 'https://router.project-osrm.org');
/** User-Agent for Nominatim requests (required by usage policy). */
export const MAP_HTTP_USER_AGENT = getEnv('MAP_HTTP_USER_AGENT', 'Inkstream/1.0');

/** When false, non-vision models receive images as before (may error). Default: enabled. */
export const VISION_RELAY_ENABLED = getEnv('VISION_RELAY_ENABLED', 'true').toLowerCase() !== 'false';
/** OpenRouter model id with vision; used only to summarize images for non-vision models. */
export const VISION_RELAY_MODEL = getEnv('VISION_RELAY_MODEL', 'google/gemini-2.0-flash-001');
export const VISION_RELAY_MAX_TOKENS = Number(getEnv('VISION_RELAY_MAX_TOKENS', '512')) || 512;
/** Cheap OpenRouter model for auto-generated chat titles after the first reply. */
export const CHAT_TITLE_MODEL = getEnv('CHAT_TITLE_MODEL', 'google/gemini-2.0-flash-lite-001');
export const CHAT_TITLE_ENABLED = getEnv('CHAT_TITLE_ENABLED', 'true').toLowerCase() !== 'false';

/** ElevenLabs streaming TTS; empty disables voice mode. */
export const ELEVENLABS_API_KEY = getEnv('ELEVENLABS_API_KEY', '');
export const ELEVENLABS_VOICE_ID = getEnv('ELEVENLABS_VOICE_ID', '21m00Tcm4TlvDq8ikWAM');
export const ELEVENLABS_MODEL_ID = getEnv('ELEVENLABS_MODEL_ID', 'eleven_flash_v2_5');

export function isElevenLabsConfigured(): boolean {
	return ELEVENLABS_API_KEY.trim().length > 0;
}

/** OpenRouter image model for generate_image tool. */
export const OPENROUTER_IMAGE_MODEL = getEnv(
	'OPENROUTER_IMAGE_MODEL',
	'google/gemini-2.5-flash-image'
);
export const OPENROUTER_IMAGE_GEN_ENABLED =
	getEnv('OPENROUTER_IMAGE_GEN_ENABLED', 'true').toLowerCase() !== 'false';

export function isImageGenerationConfigured(): boolean {
	return OPENROUTER_IMAGE_GEN_ENABLED && OPENROUTER_IMAGE_MODEL.trim().length > 0;
}
