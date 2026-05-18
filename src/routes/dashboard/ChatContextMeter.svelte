<script lang="ts">
	import {
		estimateMessagesTokens,
		estimateTokensFromText,
		estimateAttachmentInputTokens
	} from '$lib/shared/estimateContextTokens';
	import { promptInputTokenBudget } from '$lib/shared/contextWindowBudget';
	import type { ChatAttachmentInput, ChatMessage, Model } from '$lib/types/dashboard';

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
	<div class="meter" role="img" aria-label={ariaLabel} tabindex="0">
		<div class="track">
			<div class="fill" class:warn={pct > 88} style:width="{pct}%"></div>
		</div>
		<div class="hover-tip" role="tooltip">{hoverTip}</div>
	</div>
{/if}

<style>
	.meter {
		position: relative;
		margin-bottom: 0.5rem;
		z-index: 5;
	}
	.meter:focus {
		outline: none;
	}
	.meter:focus-visible .track {
		box-shadow: 0 0 0 2px #45475a;
		border-radius: 2px;
	}
	.track {
		height: 4px;
		border-radius: 2px;
		background: #313244;
		overflow: hidden;
	}
	.fill {
		height: 100%;
		background: #89b4fa;
		border-radius: 2px;
		transition: width 0.15s ease;
	}
	.fill.warn {
		background: #fab387;
	}
	.hover-tip {
		position: absolute;
		left: 0;
		top: calc(100% + 6px);
		max-width: min(22rem, 85vw);
		padding: 0.45rem 0.55rem;
		font-size: 0.72rem;
		line-height: 1.35;
		color: #cdd6f4;
		background: #11111b;
		border: 1px solid #45475a;
		border-radius: 8px;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		transition: opacity 0.12s ease, visibility 0.12s ease;
		z-index: 30;
	}
	.meter:hover .hover-tip,
	.meter:focus-visible .hover-tip {
		opacity: 1;
		visibility: visible;
	}
</style>
