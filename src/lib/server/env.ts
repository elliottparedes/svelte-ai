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
export const TELEGRAM_TOKEN_ENCRYPTION_KEY = getEnv('TELEGRAM_TOKEN_ENCRYPTION_KEY', SESSION_SECRET);
export const OPENROUTER_API_KEY = getEnv('OPENROUTER_API_KEY');
/** Optional; sent as HTTP-Referer for OpenRouter rankings. */
export const OPENROUTER_HTTP_REFERER = getEnv('OPENROUTER_HTTP_REFERER', '');
/** Preferred model id when the client omits `model` (must exist on OpenRouter). */
export const OPENROUTER_DEFAULT_MODEL = getEnv(
	'OPENROUTER_DEFAULT_MODEL',
	'google/gemini-2.0-flash-lite-001'
);
/** Brave Search API key. Empty disables web_search and image_search tools. */
export const BRAVE_SEARCH_API_KEY = getEnv('BRAVE_SEARCH_API_KEY', '');
/** Max unique web results passed to the model (1–30; Brave returns up to 20 per page). */
export const BRAVE_SEARCH_MAX_RESULTS = Math.min(
	30,
	Math.max(1, Number(getEnv('BRAVE_SEARCH_MAX_RESULTS', '20')) || 20)
);
/** Max characters in web_search tool output (2k–64k). */
export const BRAVE_SEARCH_MAX_OUTPUT_CHARS = Math.min(
	65_536,
	Math.max(2000, Number(getEnv('BRAVE_SEARCH_MAX_OUTPUT_CHARS', '28000')) || 28_000)
);
/** Request extra_snippets on web results (richer context for smaller models). */
export const BRAVE_SEARCH_EXTRA_SNIPPETS =
	getEnv('BRAVE_SEARCH_EXTRA_SNIPPETS', 'true').toLowerCase() !== 'false';
/** Max images returned by image_search (1–50). */
export const BRAVE_SEARCH_IMAGE_MAX_RESULTS = Math.min(
	50,
	Math.max(1, Number(getEnv('BRAVE_SEARCH_IMAGE_MAX_RESULTS', '16')) || 16)
);
/** Brave search country code (2-letter, default US). */
export const BRAVE_SEARCH_COUNTRY = getEnv('BRAVE_SEARCH_COUNTRY', 'US');
/** Brave search language code (default en). */
export const BRAVE_SEARCH_LANG = getEnv('BRAVE_SEARCH_LANG', 'en');

export function isBraveSearchConfigured(): boolean {
	return BRAVE_SEARCH_API_KEY.trim().length > 0;
}
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
/** Cheap model for incremental rolling conversation summaries (LLM context only). */
export const CHAT_SUMMARY_MODEL = getEnv('CHAT_SUMMARY_MODEL', 'google/gemini-2.0-flash-lite-001');
export const CHAT_SUMMARY_ENABLED = getEnv('CHAT_SUMMARY_ENABLED', 'true').toLowerCase() !== 'false';
export const CHAT_SUMMARY_INTERVAL = Math.min(
	100,
	Math.max(5, Number(getEnv('CHAT_SUMMARY_INTERVAL', '15')) || 15)
);
export const CHAT_SUMMARY_HOT_TAIL = Math.min(
	200,
	Math.max(4, Number(getEnv('CHAT_SUMMARY_HOT_TAIL', '20')) || 20)
);
export const CHAT_SUMMARY_MAX_TOKENS = Math.min(
	2048,
	Math.max(128, Number(getEnv('CHAT_SUMMARY_MAX_TOKENS', '512')) || 512)
);
/** Lazy backfill when thread has at least this many normalized messages and no summary yet. */
export const CHAT_SUMMARY_BACKFILL_MIN = Math.min(
	500,
	Math.max(30, Number(getEnv('CHAT_SUMMARY_BACKFILL_MIN', '100')) || 100)
);
/** Tiny model that classifies each chat turn into a routing tier (JSON). */
export const OPENROUTER_ROUTER_MODEL = getEnv(
	'OPENROUTER_ROUTER_MODEL',
	'google/gemini-2.0-flash-lite-001'
);
/** Model used when the user enables deep reasoning on the dashboard. */
export const OPENROUTER_REASONING_MODEL = getEnv(
	'OPENROUTER_REASONING_MODEL',
	'deepseek/deepseek-r1-0528'
);

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

/** Max characters returned per fetch_url call (2k–32k). */
export const FETCH_URL_MAX_CHARS = Math.min(
	32_768,
	Math.max(2000, Number(getEnv('FETCH_URL_MAX_CHARS', '12000')) || 12_000)
);
/** Max extracted page text before pagination stops (32k–500k). */
export const FETCH_URL_MAX_PAGE_CHARS = Math.min(
	500_000,
	Math.max(32_768, Number(getEnv('FETCH_URL_MAX_PAGE_CHARS', '200000')) || 200_000)
);

/** Piston API base URL (e.g. https://piston.paredes.cloud). Empty disables execute_python. */
export const PISTON_URL = getEnv('PISTON_URL', '');
/** Installed Python semver on Piston; empty = probe /api/v2/runtimes once. */
export const PISTON_PYTHON_VERSION = getEnv('PISTON_PYTHON_VERSION', '3.12.0');
export const PISTON_RUN_TIMEOUT_MS = Math.min(
	30_000,
	Math.max(1000, Number(getEnv('PISTON_RUN_TIMEOUT_MS', '3000')) || 3000)
);
export const PISTON_MAX_OUTPUT_CHARS =
	Math.min(131_072, Math.max(1024, Number(getEnv('PISTON_MAX_OUTPUT_CHARS', '32768')) || 32768)) ||
	32768;
/** Optional public base URL used to set Telegram webhook endpoints. */
export const TELEGRAM_WEBHOOK_BASE_URL = getEnv('TELEGRAM_WEBHOOK_BASE_URL', '');
/** Optional route secret segment appended to Telegram webhook endpoints. */
export const TELEGRAM_WEBHOOK_ROUTE_SECRET = getEnv('TELEGRAM_WEBHOOK_ROUTE_SECRET', '');

export function isPistonConfigured(): boolean {
	return PISTON_URL.trim().length > 0;
}
