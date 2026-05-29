import type { User } from '../domain/User.types';
import type { PublicUser } from '$lib/types/app';
import { parseSubscriptionTier } from '$lib/shared/subscriptionTier';

export function toPublicUser(user: User): PublicUser {
	return {
		id: user.id,
		email: user.email,
		name: user.name,
		ttsVoiceId: user.ttsVoiceId,
		subscriptionTier: parseSubscriptionTier(user.subscriptionTier),
		createdAt: user.createdAt
	};
}
