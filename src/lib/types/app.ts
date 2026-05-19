/** Client-safe user shape — never includes apiKey or password fields. */
export interface PublicUser {
	id: string;
	email: string;
	name: string | null;
	/** ElevenLabs voice_id; null uses server default. */
	ttsVoiceId: string | null;
	createdAt: Date | string;
}
