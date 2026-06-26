<script lang="ts">
	import Markdown from './Markdown.svelte';
	import CopyButton from './CopyButton.svelte';
	import ChatReasoningBlock from './ChatReasoningBlock.svelte';
	import ChatToolBlock from './ChatToolBlock.svelte';
	import type { ChatMessage } from '$lib/types/dashboard';
	import { formatMessageTime } from '$lib/client/chatMessageList.utils';

	let {
		msg,
		toolMessages = [],
		showCopy,
		streaming = false,
		modelLabel = ''
	} = $props<{
		msg: ChatMessage;
		toolMessages?: ChatMessage[];
		showCopy: boolean;
		streaming?: boolean;
		modelLabel?: string;
	}>();

	const reasoning = $derived(msg.reasoningContent?.trim() ?? '');
</script>

<div class="assistant-turn">
	{#if reasoning}
		<ChatReasoningBlock content={reasoning} {streaming} />
	{/if}
	{#if toolMessages.length > 0}
		<div class="tool-stack">
			{#each toolMessages as tool (tool.id)}
				<ChatToolBlock msg={tool} compact />
			{/each}
		</div>
	{/if}
	{#if msg.content.trim()}
		<div class="assistant-body">
			<Markdown content={msg.content} />
			<div class="msg-meta">
				<span class="msg-time">{formatMessageTime(msg.createdAt)}</span>
				{#if modelLabel}
					<span class="msg-model" title={modelLabel}>
						<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="flex-shrink:0;opacity:.65"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
						{modelLabel}
					</span>
				{/if}
				{#if showCopy}
					<div class="msg-actions">
						<CopyButton text={msg.content} />
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.assistant-turn {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
	}
	.tool-stack {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}
	.assistant-body {
		width: 100%;
		font-size: 0.95rem;
		line-height: 1.6;
	}
	.assistant-body :global(.inkstream-markdown) {
		color: #b4befe;
	}
	.assistant-body :global(pre) {
		white-space: pre-wrap;
		background: #1e1e2e;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		color: #cdd6f4;
		font-family: 'Fira Code', 'Consolas', monospace;
		overflow-x: auto;
	}
	.assistant-body :global(code) {
		font-family: 'Fira Code', 'Consolas', monospace;
		background: #1e1e2e;
		padding: 0.15rem 0.35rem;
		border-radius: 4px;
		font-size: 0.85em;
	}
	.assistant-body :global(p) {
		margin: 0 0 0.75rem;
	}
	.assistant-body :global(p:last-child) {
		margin-bottom: 0;
	}
	.assistant-body :global(ul),
	.assistant-body :global(ol) {
		margin: 0 0 0.75rem;
		padding-left: 1.25rem;
	}
	.assistant-body :global(li) {
		margin-bottom: 0.25rem;
	}
	.assistant-body :global(blockquote) {
		border-left: 3px solid #45475a;
		margin: 0 0 0.75rem;
		padding-left: 0.75rem;
		color: #a6adc8;
	}
	.assistant-body :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 0.75rem;
	}
	.assistant-body :global(th),
	.assistant-body :global(td) {
		border: 1px solid #313244;
		padding: 0.4rem 0.6rem;
		text-align: left;
	}
	.assistant-body :global(th) {
		background: #1e1e2e;
	}
	.msg-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}
	.msg-actions {
		display: flex;
		gap: 0.5rem;
		opacity: 0;
		transition: opacity 0.2s;
	}
	.assistant-turn:hover .msg-actions {
		opacity: 1;
	}
	.msg-time {
		font-size: 0.7rem;
		color: #6c7086;
	}
	.msg-model {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.68rem;
		color: #585b70;
		background: #1e1e2e;
		border: 1px solid #313244;
		border-radius: 999px;
		padding: 0.1rem 0.45rem;
		white-space: nowrap;
	}
</style>
