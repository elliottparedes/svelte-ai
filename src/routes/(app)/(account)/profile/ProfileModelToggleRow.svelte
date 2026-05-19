<script lang="ts">
	import type { AltModelTier } from '$lib/shared/optionalDashboardModels';

	let {
		title,
		description,
		tier,
		checked = false,
		disabled = false,
		onChange
	} = $props<{
		title: string;
		description: string;
		tier: AltModelTier;
		checked?: boolean;
		disabled?: boolean;
		onChange: (next: boolean) => void;
	}>();
</script>

<button
	type="button"
	class="row"
	role="switch"
	aria-checked={checked}
	aria-label={title}
	{disabled}
	onclick={() => onChange(!checked)}
>
	<span class="txt">
		<span class="tit-row">
			<span class="tit">{title}</span>
			<span class="tier" class:must={tier === 'must'}>{tier === 'must' ? 'Must-have' : 'Nice-to-have'}</span>
		</span>
		<span class="sub">{description}</span>
	</span>
	<span class="sw" class:on={checked} aria-hidden="true"><span class="knob"></span></span>
</button>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		width: 100%;
		padding: 0.55rem 0.65rem;
		border: none;
		border-radius: 10px;
		background: transparent;
		color: inherit;
		cursor: pointer;
		text-align: left;
	}
	.row:hover:not(:disabled) {
		background: #252537;
	}
	.row:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.txt {
		flex: 1;
		min-width: 0;
	}
	.tit-row {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		flex-wrap: wrap;
	}
	.tit {
		font-size: 0.82rem;
		font-weight: 600;
		color: #cdd6f4;
	}
	.tier {
		font-size: 0.58rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		background: #313244;
		color: #7f849c;
	}
	.tier.must {
		background: #89b4fa22;
		color: #89b4fa;
	}
	.sub {
		display: block;
		font-size: 0.68rem;
		color: #6c7086;
		margin-top: 0.12rem;
		line-height: 1.25;
	}
	.sw {
		width: 2.75rem;
		height: 1.5rem;
		border-radius: 999px;
		background: #45475a;
		position: relative;
		flex-shrink: 0;
		transition: background 0.15s ease;
	}
	.sw.on {
		background: #89b4fa;
	}
	.knob {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 1.15rem;
		height: 1.15rem;
		border-radius: 50%;
		background: #f5f5f5;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
		transition: transform 0.18s ease;
	}
	.sw.on .knob {
		transform: translateX(1.22rem);
	}
</style>
