import type { User } from '$lib/server/domain/User.types';
import type { TtsVoiceOption } from '$lib/shared/ttsVoice';
import { DomainError } from '$lib/server/domain/DomainError';
import {
	fetchElevenLabsPreviewUrl,
	fetchElevenLabsVoiceCatalog
} from '$lib/server/infrastructure/elevenLabsVoiceCatalog';
import { UserRepository } from '$lib/server/repositories/UserRepository';

export class TtsVoiceService {
	constructor(
		private readonly apiKey: string,
		private readonly defaultVoiceId: string,
		private readonly userRepo: UserRepository = new UserRepository()
	) {}

	resolveVoiceId(user: User): string {
		const picked = user.ttsVoiceId?.trim();
		return picked || this.defaultVoiceId;
	}

	listVoices(): Promise<TtsVoiceOption[]> {
		return fetchElevenLabsVoiceCatalog(this.apiKey);
	}

	async previewAudio(voiceId: string): Promise<{ bytes: Uint8Array; contentType: string }> {
		const url = await fetchElevenLabsPreviewUrl(this.apiKey, voiceId);
		const res = await fetch(url);
		if (!res.ok) throw new DomainError('Preview download failed', 502);
		const bytes = new Uint8Array(await res.arrayBuffer());
		return {
			bytes,
			contentType: res.headers.get('content-type') ?? 'audio/mpeg'
		};
	}

	async setUserVoice(userId: string, voiceId: string | null): Promise<User> {
		if (voiceId) {
			const voices = await this.listVoices();
			if (!voices.some((v) => v.id === voiceId)) {
				throw new DomainError('Unknown voice', 400);
			}
		}
		return this.userRepo.updateTtsVoiceId(userId, voiceId);
	}
}
