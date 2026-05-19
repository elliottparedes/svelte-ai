import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import {
	ELEVENLABS_API_KEY,
	isElevenLabsConfigured
} from '$lib/server/db/config';
import { TtsVoiceService } from '$lib/server/services/TtsVoiceService';
import { logger } from '$lib/server/logger';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Unauthorized');
	if (!isElevenLabsConfigured()) error(503, 'Text-to-speech is not configured');

	const service = new TtsVoiceService(ELEVENLABS_API_KEY, '');
	try {
		const voices = await service.listVoices();
		return json({ voices });
	} catch (err) {
		logger.error('TTS voices list failed', { error: String(err), userId: locals.user.id });
		error(502, 'Failed to load voices');
	}
};
