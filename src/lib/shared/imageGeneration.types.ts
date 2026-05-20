export type ImageAspectRatio = 'square' | 'portrait' | 'landscape';

export interface ImageGenerationToolPayload {
	ok: boolean;
	prompt: string;
	imageUrl?: string;
	mimeType?: string;
	error?: string;
}
