import { z } from 'zod';
import { normalizeAltModelIds } from '$lib/shared/optionalDashboardModels';

export const profileTtsVoiceSchema = z.object({
	voiceId: z.string().min(1).max(64).nullable()
});

export const profileAltModelsSchema = z.object({
	enabledIds: z.array(z.string().min(3).max(128)).max(20)
});

export type ProfileTtsVoiceInput = z.infer<typeof profileTtsVoiceSchema>;
export type ProfileAltModelsInput = z.infer<typeof profileAltModelsSchema>;

export function parseProfileAltModelIds(body: ProfileAltModelsInput): string[] {
	return normalizeAltModelIds(body.enabledIds);
}
