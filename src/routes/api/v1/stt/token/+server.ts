import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ELEVENLABS_API_KEY, isElevenLabsConfigured } from '$lib/server/env';
import { resolveUser } from '$lib/server/infrastructure/auth';

export const POST: RequestHandler = async (event) => {
	if (!isElevenLabsConfigured()) error(503, 'ElevenLabs not configured');

	const user = await resolveUser(event);
	if (!user) error(401, 'Unauthorized');

	const resp = await fetch('https://api.elevenlabs.io/v1/single-use-token/realtime_scribe', {
		method: 'POST',
		headers: { 'xi-api-key': ELEVENLABS_API_KEY }
	});

	if (!resp.ok) {
		const body = await resp.text().catch(() => '');
		error(502, `ElevenLabs token error: ${resp.status} ${body}`);
	}

	const { token } = (await resp.json()) as { token: string };
	return json({ token });
};
