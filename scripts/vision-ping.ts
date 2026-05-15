/**
 * Smoke-test OpenRouter vision relay path (multimodal chat completion).
 * Usage: npm run vision:ping -- [modelId]
 * Requires OPENROUTER_API_KEY in .env
 */
import 'dotenv/config';
import { completeOpenRouterVisionRelay } from '../src/lib/server/infrastructure/visionRelayOpenRouter';

const MODELS_URL = 'https://openrouter.ai/api/v1/models';

/** 16x16 PNG — some providers reject 1x1 images. */
const PNG_VISION_PING =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAKklEQVQ4T2NkYGD4z0ABYBw1YDQawDgoeFQgPDAwMJAcFRLIB6EBAA1ZA/0qZ7QZAAAAAElFTkSuQmCC';

async function main() {
	const key = process.env.OPENROUTER_API_KEY;
	if (!key) {
		console.error('Missing OPENROUTER_API_KEY');
		process.exit(1);
	}
	const modelId = process.argv[2] ?? process.env.VISION_RELAY_MODEL ?? 'google/gemini-2.0-flash-001';

	console.log('GET', MODELS_URL);
	const listRes = await fetch(MODELS_URL, { headers: { Authorization: `Bearer ${key}` } });
	console.log('Models:', listRes.status, listRes.ok ? 'OK' : await listRes.text().then((t) => t.slice(0, 200)));

	if (listRes.ok) {
		const j = (await listRes.json()) as { data?: Array<{ id: string }> };
		const ids = j.data?.map((m) => m.id) ?? [];
		console.log(
			'Model count:',
			ids.length,
			ids.includes(modelId) ? `(includes ${modelId})` : `(id sample: ${ids.slice(0, 8).join(', ')})`
		);
	}

	const attachments = [
		{
			type: 'image' as const,
			name: 'ping.png',
			dataUrl: PNG_VISION_PING,
			mimeType: 'image/png'
		}
	];

	console.log('\nVision relay completion test:', modelId);
	try {
		const text = await completeOpenRouterVisionRelay(
			key,
			modelId,
			'Describe this tiny image in one short phrase.',
			attachments,
			64,
			process.env.OPENROUTER_HTTP_REFERER || undefined
		);
		console.log('OK:', text);
	} catch (e) {
		console.error('FAIL:', e instanceof Error ? e.message : e);
		process.exit(1);
	}
}

main();
