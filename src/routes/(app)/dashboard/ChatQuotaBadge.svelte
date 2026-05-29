<script lang="ts">
	import type { ChatQuotaView } from '$lib/types/dashboard';

	let { quota } = $props<{ quota: ChatQuotaView }>();

	const label = $derived(() => {
		if (quota.tier === 'pro') return 'Pro · unlimited chats';
		if (quota.limit === null) return `${quota.tier} tier`;
		const left = Math.max(0, quota.limit - quota.used);
		const period = quota.resetsMonthly ? 'this month' : 'total';
		return `${quota.tier} · ${left}/${quota.limit} chats (${period})`;
	});
</script>

<span class="quota" class:pro={quota.tier === 'pro'} title="Subscription usage">{label()}</span>

<style>
	.quota {
		font-size: 0.75rem;
		color: #a6adc8;
		white-space: nowrap;
	}
	.quota.pro {
		color: #a6e3a1;
		font-weight: 600;
	}
</style>
