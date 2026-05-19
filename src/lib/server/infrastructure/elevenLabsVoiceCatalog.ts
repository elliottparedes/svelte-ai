import type { TtsVoiceOption } from '$lib/shared/ttsVoice';

const VOICES_URL = 'https://api.elevenlabs.io/v1/voices';
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { at: number; voices: TtsVoiceOption[]; previewUrls: Map<string, string> } | null =
	null;

type RawVoice = {
	voice_id: string;
	name: string;
	category?: string;
	preview_url?: string | null;
};

/** Lists account voices from ElevenLabs (cached). */
export async function fetchElevenLabsVoiceCatalog(apiKey: string): Promise<TtsVoiceOption[]> {
	if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.voices;

	const res = await fetch(VOICES_URL, { headers: { 'xi-api-key': apiKey } });
	if (!res.ok) {
		const detail = await res.text().catch(() => '');
		throw new Error(`ElevenLabs voices failed (${res.status}): ${detail.slice(0, 200)}`);
	}
	const body = (await res.json()) as { voices?: RawVoice[] };
	const previewUrls = new Map<string, string>();
	const voices = (body.voices ?? [])
		.map((v) => {
			if (v.preview_url) previewUrls.set(v.voice_id, v.preview_url);
			return {
				id: v.voice_id,
				name: v.name,
				category: v.category ?? 'unknown',
				hasPreview: Boolean(v.preview_url)
			};
		})
		.sort((a, b) => a.name.localeCompare(b.name));

	cache = { at: Date.now(), voices, previewUrls };
	return voices;
}

/** Premade sample MP3 URL — not a billed TTS generation (uses cached voice list). */
export async function fetchElevenLabsPreviewUrl(
	apiKey: string,
	voiceId: string
): Promise<string> {
	await fetchElevenLabsVoiceCatalog(apiKey);
	const cached = cache?.previewUrls.get(voiceId);
	if (cached) return cached;

	const res = await fetch(`${VOICES_URL}/${encodeURIComponent(voiceId)}`, {
		headers: { 'xi-api-key': apiKey }
	});
	if (!res.ok) throw new Error(`Voice not found (${res.status})`);
	const body = (await res.json()) as { preview_url?: string | null };
	if (!body.preview_url) throw new Error('Voice has no preview sample');
	return body.preview_url;
}
