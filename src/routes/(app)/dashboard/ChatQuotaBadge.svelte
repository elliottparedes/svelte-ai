<script lang="ts">
	import type { ChatQuotaView } from '$lib/types/dashboard';

	let { quota } = $props<{ quota: ChatQuotaView }>();

	const label = $derived(() => {
		if (quota.tier === 'pro') return 'Pro · unlimited';
		if (quota.limit === null) return '';
		const left = Math.max(0, quota.limit - quota.used);
		const period = quota.resetsMonthly ? 'this month' : 'total';
		return `${left} of ${quota.limit} chats left (${period})`;
	});
</script>

{#if label()}
	<span class="quota" title="Subscription usage">{label()}</span>
{/if}

<style>
	.quota {
		font-size: 0.75rem;
		color: #a6adc8;
		white-space: nowrap;
	}
</style>
