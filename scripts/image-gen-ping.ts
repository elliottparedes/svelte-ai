/**
 * Smoke-test image generation via OpenRouter.
 * Usage: npm run image:ping -- ["prompt"]
 */
import 'dotenv/config';
import { ImageGenerationService } from '../src/lib/server/infrastructure/imageGenerationService';

async function main() {
	const prompt = process.argv[2] ?? 'A serene mountain lake at sunset, digital art';
	const svc = new ImageGenerationService();
	console.log(`Generate: ${prompt}`);
	const result = await svc.run({ prompt });
	const parsed = JSON.parse(result);
	if (!parsed.ok) {
		console.error(parsed.error ?? result);
		process.exit(1);
	}
	console.log('imageUrl prefix:', String(parsed.imageUrl).slice(0, 80));
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
