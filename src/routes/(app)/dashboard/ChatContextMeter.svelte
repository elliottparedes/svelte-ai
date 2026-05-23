<script lang="ts">
	import { estimateCompactionProgress } from '$lib/shared/estimateCompactionProgress';
	import type { ChatMessage } from '$lib/types/dashboard';
	import ChatContextMeterRing from './ChatContextMeterRing.svelte';

	let {
		messages,
		summaryThroughMessageId = null
	} = $props<{
		messages: ChatMessage[];
		summaryThroughMessageId?: string | null;
	}>();

	const progress = $derived(
		estimateCompactionProgress(messages, summaryThroughMessageId ?? null)
	);

	const hoverTip = $derived(
		`Compaction progress: ~${progress.unsummarizedCount} of ${progress.threshold} user/assistant turns before older messages are summarized for the model. Full history stays in the chat.${
			progress.pct >= 88 ? ' Compaction likely on next reply.' : ''
		}`
	);

	const ariaLabel = $derived(
		`Compaction progress ${progress.pct} percent, about ${progress.unsummarizedCount} of ${progress.threshold} turns`
	);
</script>

<div class="meter-wrap">
	<button type="button" class="meter" aria-label={ariaLabel}>
		<ChatContextMeterRing pct={progress.pct} warn={progress.pct >= 88} />
	</button>
	<div class="hover-tip" role="tooltip">{hoverTip}</div>
</div>

<style>
	.meter-wrap {
		position: relative;
		flex-shrink: 0;
		z-index: 5;
	}
	.meter {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		padding: 0;
		border: none;
		background: transparent;
		border-radius: 50%;
		cursor: default;
	}
	.meter:focus {
		outline: none;
	}
	.meter:focus-visible {
		box-shadow: 0 0 0 2px #45475a;
	}
	.hover-tip {
		position: absolute;
		left: 50%;
		bottom: calc(100% + 8px);
		transform: translateX(-50%);
		width: max-content;
		min-width: 14rem;
		max-width: min(22rem, 85vw);
		padding: 0.5rem 0.65rem;
		font-size: 0.72rem;
		line-height: 1.4;
		color: #cdd6f4;
		background: #11111b;
		border: 1px solid #45475a;
		border-radius: 8px;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		text-align: left;
		transition: opacity 0.12s ease, visibility 0.12s ease;
		z-index: 30;
	}
	.meter-wrap:hover .hover-tip,
	.meter-wrap:focus-within .hover-tip {
		opacity: 1;
		visibility: visible;
	}
</style>
