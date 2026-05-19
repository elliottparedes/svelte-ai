import 'dotenv/config';
import { ElevenLabsTtsRelay } from '../src/lib/server/infrastructure/ElevenLabsTtsRelay.ts';

const key = process.env.ELEVENLABS_API_KEY?.trim();
const voice = process.env.ELEVENLABS_VOICE_ID ?? '21m00Tcm4TlvDq8ikWAM';
const model = process.env.ELEVENLABS_MODEL_ID ?? 'eleven_flash_v2_5';

if (!key) {
	console.error('ELEVENLABS_API_KEY is not set');
	process.exit(1);
}

let bytes = 0;
const relay = new ElevenLabsTtsRelay();
await relay.connect({ apiKey: key, voiceId: voice, modelId: model }, (chunk) => {
	bytes += chunk.audio.length;
	if (chunk.isFinal) console.log('final');
});
relay.sendText('Hello, this is a quick voice test. ');
relay.end();
await new Promise((r) => setTimeout(r, 8000));
relay.close();
console.log(bytes > 0 ? `OK: received ${bytes} PCM bytes` : 'FAIL: no audio received');
process.exit(bytes > 0 ? 0 : 1);
