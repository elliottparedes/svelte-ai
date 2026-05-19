<script lang="ts">
	let {
		title,
		description,
		icon,
		checked = false,
		disabled = false,
		onChange
	} = $props<{
		title: string;
		description: string;
		icon: string;
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
	<span class="ico" aria-hidden="true">{icon}</span>
	<span class="txt">
		<span class="tit">{title}</span>
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
	.ico {
		font-size: 1.15rem;
		width: 2rem;
		text-align: center;
		flex-shrink: 0;
		line-height: 1.2;
	}
	.txt {
		flex: 1;
		min-width: 0;
	}
	.tit {
		display: block;
		font-size: 0.82rem;
		font-weight: 600;
		color: #cdd6f4;
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
