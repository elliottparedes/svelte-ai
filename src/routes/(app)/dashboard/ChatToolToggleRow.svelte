<script lang="ts">
	import type { ChatToolId } from '$lib/shared/chatToolSystemPrompt';
	import ChatToolIcon from './ChatToolIcon.svelte';

	let {
		toolId,
		title,
		description,
		checked = false,
		disabled = false,
		onChange
	} = $props<{
		toolId: ChatToolId;
		title: string;
		description: string;
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
	<span class="ico-wrap" aria-hidden="true">
		<ChatToolIcon id={toolId} active={checked} />
	</span>
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
	.ico-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		flex-shrink: 0;
		border-radius: 8px;
		background: #252537;
	}
	.row:hover:not(:disabled) .ico-wrap {
		background: #313244;
	}
	.row:hover:not(:disabled) .ico-wrap :global(.ico) {
		color: #bac2de;
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

	@media (max-width: 768px) {
		.row {
			padding: 0.5rem 0.55rem;
			gap: 0.55rem;
		}

		.sub {
			font-size: 0.65rem;
		}
	}
</style>
