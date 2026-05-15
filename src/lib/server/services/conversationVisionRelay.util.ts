import type { ChatAttachment } from '../domain/ChatProvider.interface';
import { DomainError } from '../domain/DomainError';
import { logger } from '../logger';
import { modelSendsNativeImagePixels } from '../model/modelCapabilities';
import type { VisionRelayService } from './VisionRelayService';

/** Extra system text when images were relayed to text — steers models away from spurious web_search loops. */
export const VISION_RELAY_SYSTEM_HINT =
	'The latest user message includes [Vision summary]: that block is the description of image(s) they attached; you do not have the raw image. Treat it as the visual ground truth. Answer from that summary and the user’s question. Do not use web_search in a loop to identify a specific building, artwork, product, or person from the photo unless the user explicitly asks you to look things up or verify online. If the summary is ambiguous, say what you can infer and what you cannot.';

export async function maybeApplyVisionRelay(args: {
	userId: string;
	conversationId: string;
	augmentedPrompt: string;
	imageAttachments: readonly ChatAttachment[] | undefined;
	model: string | undefined;
	visionRelay: VisionRelayService | undefined;
}): Promise<{ augmentedPrompt: string; relayApplied: boolean }> {
	let { augmentedPrompt } = args;
	let relayApplied = false;

	if (
		args.imageAttachments &&
		args.imageAttachments.length > 0 &&
		!modelSendsNativeImagePixels(args.model) &&
		args.visionRelay
	) {
		const summary = await args.visionRelay.summarizeForNonVisionModel(
			augmentedPrompt,
			args.imageAttachments
		);
		augmentedPrompt = `${augmentedPrompt}\n\n[Vision summary]\n${summary}`;
		relayApplied = true;
		logger.info('Vision relay applied', {
			userId: args.userId,
			conversationId: args.conversationId,
			model: args.model ?? 'default'
		});
	}

	if (
		args.imageAttachments &&
		args.imageAttachments.length > 0 &&
		!modelSendsNativeImagePixels(args.model) &&
		!args.visionRelay
	) {
		throw new DomainError(
			'This model cannot take raw images on the active route. Enable vision relay (VISION_RELAY_ENABLED in .env) or use another model.',
			400
		);
	}

	return { augmentedPrompt, relayApplied };
}
