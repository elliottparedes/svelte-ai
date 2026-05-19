import type { TtsVoiceOption } from '$lib/shared/ttsVoice';

export async function fetchTtsVoices(): Promise<TtsVoiceOption[]> {
	const res = await fetch('/api/v1/tts/voices');
	if (!res.ok) throw new Error('Could not load voices');
	const data = (await res.json()) as { voices: TtsVoiceOption[] };
	return data.voices;
}

export async function saveTtsVoicePreference(voiceId: string | null): Promise<void> {
	const res = await fetch('/api/v1/profile/tts-voice', {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ voiceId })
	});
	if (!res.ok) throw new Error('Save failed');
}

export async function playTtsVoicePreview(voiceId: string): Promise<void> {
	const res = await fetch(`/api/v1/tts/voices/${encodeURIComponent(voiceId)}/preview`);
	if (!res.ok) throw new Error('Preview failed');
	const blob = await res.blob();
	const url = URL.createObjectURL(blob);
	const audio = new Audio(url);
	audio.onended = () => URL.revokeObjectURL(url);
	await audio.play();
}
