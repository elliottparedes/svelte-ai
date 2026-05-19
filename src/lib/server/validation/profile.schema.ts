import { z } from 'zod';

export const profileTtsVoiceSchema = z.object({
	voiceId: z.string().min(1).max(64).nullable()
});

export type ProfileTtsVoiceInput = z.infer<typeof profileTtsVoiceSchema>;
