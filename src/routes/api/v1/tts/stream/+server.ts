import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import {
	ELEVENLABS_API_KEY,
	ELEVENLABS_VOICE_ID,
	ELEVENLABS_MODEL_ID,
	isElevenLabsConfigured
} from '$lib/server/db/config';
import { runTtsNdjsonStream, type TtsOutLine } from '$lib/server/services/TtsStreamService';
import { logger } from '$lib/server/logger';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');
	if (!isElevenLabsConfigured()) error(503, 'Text-to-speech is not configured');
	const body = request.body;
	if (!body) error(400, 'Missing request body');

	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			const writeOut = (line: TtsOutLine) => {
				controller.enqueue(encoder.encode(`${JSON.stringify(line)}\n`));
			};
			try {
				await runTtsNdjsonStream(body, writeOut, {
					apiKey: ELEVENLABS_API_KEY,
					voiceId: ELEVENLABS_VOICE_ID,
					modelId: ELEVENLABS_MODEL_ID
				});
				controller.close();
			} catch (err) {
				const msg = err instanceof Error ? err.message : 'TTS stream error';
				logger.error('TTS stream failed', { error: msg, userId: locals.user?.id });
				writeOut({ type: 'error', message: msg });
				controller.close();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'application/x-ndjson',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
