import type { ImageGenerationToolPayload } from '$lib/shared/imageGeneration.types';
import {
	OPENROUTER_API_KEY,
	OPENROUTER_HTTP_REFERER,
	OPENROUTER_IMAGE_GEN_ENABLED,
	OPENROUTER_IMAGE_MODEL
} from '../env';
import { buildImageGenerationPrompt, parseAspectRatio } from './imageGenerationPrompt';
import { completeOpenRouterImageGeneration } from './imageGenerationOpenRouter';

function fail(error: string, prompt = ''): string {
	return JSON.stringify({ ok: false, prompt, error } satisfies ImageGenerationToolPayload);
}

export class ImageGenerationService {
	async run(args: Record<string, unknown>): Promise<string> {
		if (!OPENROUTER_IMAGE_GEN_ENABLED) {
			return fail('Image generation is disabled (OPENROUTER_IMAGE_GEN_ENABLED=false)');
		}
		const model = OPENROUTER_IMAGE_MODEL.trim();
		if (!model) return fail('Image model not configured (OPENROUTER_IMAGE_MODEL)');

		const prompt = String(args.prompt ?? '').trim();
		if (!prompt) return fail('prompt is required');

		const aspectRatio = parseAspectRatio(
			args.aspect_ratio != null ? String(args.aspect_ratio) : undefined
		);
		const finalPrompt = buildImageGenerationPrompt(prompt, aspectRatio);

		const { imageUrl, error } = await completeOpenRouterImageGeneration(
			OPENROUTER_API_KEY,
			model,
			finalPrompt,
			OPENROUTER_HTTP_REFERER || undefined
		);

		if (!imageUrl) return fail(error ?? 'Generation failed', prompt);

		const payload: ImageGenerationToolPayload = {
			ok: true,
			prompt,
			imageUrl,
			mimeType: imageUrl.startsWith('data:') ? imageUrl.slice(5).split(';')[0] : 'image/png'
		};
		return JSON.stringify(payload);
	}
}
