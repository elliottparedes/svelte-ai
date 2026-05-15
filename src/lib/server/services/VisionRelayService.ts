import type { ChatAttachment } from '../domain/ChatProvider.interface';
import { completeOpenRouterVisionRelay } from '../infrastructure/visionRelayOpenRouter';

export class VisionRelayService {
	constructor(
		private readonly apiKey: string,
		private readonly relayModelId: string,
		private readonly maxTokens: number,
		private readonly httpReferer?: string
	) {}

	async summarizeForNonVisionModel(userPrompt: string, images: readonly ChatAttachment[]): Promise<string> {
		return completeOpenRouterVisionRelay(
			this.apiKey,
			this.relayModelId,
			userPrompt,
			images,
			this.maxTokens,
			this.httpReferer
		);
	}
}
