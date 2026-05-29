/** Billing tier; change via SQL on `users.subscription_tier` until a billing UI exists. */
export type SubscriptionTier = 'free' | 'standard' | 'pro';

export const SUBSCRIPTION_TIERS: readonly SubscriptionTier[] = ['free', 'standard', 'pro'];

export const CHAT_LIMITS: Record<SubscriptionTier, number | null> = {
	free: 20,
	standard: 500,
	pro: null
};

export function isSubscriptionTier(v: string): v is SubscriptionTier {
	return (SUBSCRIPTION_TIERS as readonly string[]).includes(v);
}

export function parseSubscriptionTier(raw: string | null | undefined): SubscriptionTier {
	const t = String(raw ?? 'free').trim().toLowerCase();
	return isSubscriptionTier(t) ? t : 'free';
}

export function chatLimitForTier(tier: SubscriptionTier): number | null {
	return CHAT_LIMITS[tier];
}
