import type { ImageAspectRatio } from '$lib/shared/imageGeneration.types';

const ASPECT_HINT: Record<ImageAspectRatio, string> = {
	square: 'Square 1:1 composition.',
	portrait: 'Tall portrait composition.',
	landscape: 'Wide landscape composition.'
};

export function parseAspectRatio(raw: string | undefined): ImageAspectRatio | undefined {
	if (!raw) return undefined;
	const a = raw.trim().toLowerCase();
	if (a === 'portrait' || a === 'landscape' || a === 'square') return a;
	return undefined;
}

export function buildImageGenerationPrompt(prompt: string, aspectRatio?: ImageAspectRatio): string {
	const parts = ['Generate a single high-quality image.', prompt.trim()];
	if (aspectRatio) parts.push(ASPECT_HINT[aspectRatio]);
	return parts.join('\n\n');
}
