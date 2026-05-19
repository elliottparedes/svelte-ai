import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import {
	ELEVENLABS_API_KEY,
	ELEVENLABS_VOICE_ID,
	isElevenLabsConfigured
} from '$lib/server/db/config';
import { TtsVoiceService } from '$lib/server/services/TtsVoiceService';
import { profileTtsVoiceSchema } from '$lib/server/validation/profile.schema';
import { handleDomainError } from '$lib/server/domain/DomainError';
import { toPublicUser } from '$lib/server/auth/toPublicUser';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');
	if (!isElevenLabsConfigured()) error(503, 'Text-to-speech is not configured');

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	const parsed = profileTtsVoiceSchema.safeParse(body);
	if (!parsed.success) {
		error(400, parsed.error.issues.map((i) => i.message).join(', '));
	}

	const service = new TtsVoiceService(ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID);
	try {
		const updated = await service.setUserVoice(user.id, parsed.data.voiceId);
		return json({ user: toPublicUser(updated) });
	} catch (err) {
		handleDomainError(err);
	}
};
