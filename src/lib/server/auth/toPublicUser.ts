import type { User } from '../domain/User.types';
import type { PublicUser } from '$lib/types/app';

export function toPublicUser(user: User): PublicUser {
	return {
		id: user.id,
		email: user.email,
		name: user.name,
		ttsVoiceId: user.ttsVoiceId,
		createdAt: user.createdAt
	};
}
