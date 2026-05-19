/** WebSocket URL for ElevenLabs input streaming TTS (PCM for gapless Web Audio playback). */
export function elevenLabsStreamInputUrl(voiceId: string, modelId: string): string {
	const q = new URLSearchParams({
		model_id: modelId,
		output_format: 'pcm_24000',
		optimize_streaming_latency: '3'
	});
	return `wss://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream-input?${q}`;
}
