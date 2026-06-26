<script lang="ts">
	let {
		amountUsd,
		rangeLabel
	} = $props<{
		amountUsd: number;
		rangeLabel: string;
	}>();

	const amountLabel = $derived(
		new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 4
		}).format(amountUsd)
	);
</script>

<div class="spend-card">
	<div class="eyebrow">Usage this month</div>
	<div class="amount">{amountLabel}</div>
	<p class="range">{rangeLabel}</p>
</div>

<style>
	.spend-card {
		max-width: 32rem;
		padding: 1.5rem;
		border-radius: 12px;
		background: #1e1e2e;
		border: 1px solid #313244;
	}
	.eyebrow {
		font-size: 0.8rem;
		font-weight: 600;
		color: #bac2de;
	}
	.amount {
		margin-top: 0.35rem;
		font-size: 1.8rem;
		font-weight: 700;
		color: #cdd6f4;
	}
	.range {
		margin: 0.45rem 0 0;
		font-size: 0.84rem;
		color: #a6adc8;
	}
</style>
