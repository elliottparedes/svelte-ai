import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { ELEVENLABS_API_KEY, isElevenLabsConfigured } from '$lib/server/db/config';
import { TtsVoiceService } from '$lib/server/services/TtsVoiceService';
import { handleDomainError } from '$lib/server/domain/DomainError';
import { logger } from '$lib/server/logger';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) error(401, 'Unauthorized');
	if (!isElevenLabsConfigured()) error(503, 'Text-to-speech is not configured');

	const voiceId = params.id?.trim();
	if (!voiceId) error(400, 'Missing voice id');

	const service = new TtsVoiceService(ELEVENLABS_API_KEY, '');
	try {
		const { bytes, contentType } = await service.previewAudio(voiceId);
		return new Response(bytes.slice(), {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'private, max-age=3600'
			}
		});
	} catch (err) {
		logger.warn('TTS voice preview failed', { voiceId, error: String(err) });
		handleDomainError(err);
	}
};
