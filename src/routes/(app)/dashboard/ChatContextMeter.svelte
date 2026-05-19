<script lang="ts">
	import {
		estimateMessagesTokens,
		estimateTokensFromText,
		estimateAttachmentInputTokens
	} from '$lib/shared/estimateContextTokens';
	import { promptInputTokenBudget } from '$lib/shared/contextWindowBudget';
	import type { ChatAttachmentInput, ChatMessage, Model } from '$lib/types/dashboard';
	import ChatContextMeterRing from './ChatContextMeterRing.svelte';

	let {
		messages,
		draftText,
		attachments,
		models,
		selectedModel,
		extraSystemTokens = 0,
		toolStackEstimate
	} = $props<{
		messages: ChatMessage[];
		draftText: string;
		attachments: ChatAttachmentInput[];
		models: Model[];
		selectedModel: string;
		extraSystemTokens?: number;
		toolStackEstimate: number;
	}>();

	const model = $derived(models.find((m: Model) => m.id === selectedModel));
	const contextLen = $derived(model?.contextLength);
	const maxComp = $derived(model?.maxCompletionTokens);

	const usedEstimate = $derived(
		estimateMessagesTokens(messages) +
			estimateTokensFromText(draftText) +
			estimateAttachmentInputTokens(attachments) +
			toolStackEstimate +
			extraSystemTokens
	);

	const promptBudget = $derived(
		typeof contextLen === 'number' && contextLen >= 2048
			? promptInputTokenBudget(contextLen, maxComp)
			: null
	);

	const pct = $derived(
		promptBudget != null && promptBudget > 0 ? Math.min(100, (usedEstimate / promptBudget) * 100) : null
	);

	function fmt(n: number) {
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
		return String(Math.round(n));
	}

	const hoverTip = $derived(
		promptBudget != null && pct != null
			? `Context (est.): ${fmt(usedEstimate)} / ${fmt(promptBudget)} tokens (~${Math.round(pct)}% of prompt budget). Rough chars÷4; server drops oldest messages when over budget.`
			: ''
	);

	const ariaLabel = $derived(
		promptBudget != null && pct != null
			? `Estimated context use ${Math.round(pct)} percent, about ${fmt(usedEstimate)} of ${fmt(promptBudget)} tokens`
			: ''
	);
</script>

{#if promptBudget != null && pct != null}
	<div class="meter-wrap">
		<button type="button" class="meter" aria-label={ariaLabel}>
			<ChatContextMeterRing {pct} warn={pct > 88} />
		</button>
		<div class="hover-tip" role="tooltip">{hoverTip}</div>
	</div>
{/if}

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
