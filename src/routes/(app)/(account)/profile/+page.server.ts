import type { PageServerLoad } from './$types';
import { ConversationTurnRepository } from '$lib/server/repositories/ConversationTurnRepository';

function monthBounds(now = new Date()) {
	const start = new Date(now.getFullYear(), now.getMonth(), 1);
	const endExclusive = new Date(now.getFullYear(), now.getMonth() + 1, 1);
	const endInclusive = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	return { start, endExclusive, endInclusive };
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) return { user: null, monthlySpend: null };
	const { start, endExclusive, endInclusive } = monthBounds();
	const amountUsd = await new ConversationTurnRepository().sumUserSpendBetween(
		user.id,
		start,
		endExclusive
	);
	return {
		user,
		monthlySpend: {
			amountUsd,
			rangeLabel: `${start.toLocaleDateString()} - ${endInclusive.toLocaleDateString()}`
		}
	};
};
