import type { PageServerLoad } from './$types';
import {
	ELEVENLABS_API_KEY,
	ELEVENLABS_VOICE_ID,
	isElevenLabsConfigured
} from '$lib/server/db/config';
import { fetchElevenLabsVoiceCatalog } from '$lib/server/infrastructure/elevenLabsVoiceCatalog';
import { resolveUserAltModelIds } from '$lib/shared/optionalDashboardModels';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	let defaultVoiceName: string | null = null;
	if (isElevenLabsConfigured()) {
		try {
			const voices = await fetchElevenLabsVoiceCatalog(ELEVENLABS_API_KEY);
			defaultVoiceName = voices.find((v) => v.id === ELEVENLABS_VOICE_ID)?.name ?? null;
		} catch {
			/* name resolves client-side after list loads */
		}
	}
	return {
		ttsEnabled: isElevenLabsConfigured(),
		defaultVoiceId: ELEVENLABS_VOICE_ID,
		defaultVoiceName,
		ttsVoiceId: user.ttsVoiceId,
		enabledAltModelIds: resolveUserAltModelIds(user.altModelIds)
	};
};
