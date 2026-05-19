<script lang="ts">
	import type { ChatMessage } from '$lib/types/dashboard';
	import { formatMessageTime } from '$lib/client/chatMessageList.utils';

	let {
		msg,
		imageNames,
		fileNames,
		text
	} = $props<{
		msg: ChatMessage;
		imageNames: string[];
		fileNames: string[];
		text: string;
	}>();
</script>

<div class="user-row">
	<div class="user-col">
		<div class="user-bubble">
			{#if imageNames.length > 0 || fileNames.length > 0}
				<div class="user-attachments">
					{#each imageNames as name}
						<div class="image-thumb">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
								<circle cx="8.5" cy="8.5" r="1.5"></circle>
								<polyline points="21 15 16 10 5 21"></polyline>
							</svg>
							<span>{name}</span>
						</div>
					{/each}
					{#each fileNames as name}
						{@const ext = name.split('.').pop()?.toUpperCase().slice(0, 4) ?? 'FILE'}
						<div class="file-badge">
							<span class="file-ext">{ext}</span>
							<span class="file-label">{name}</span>
						</div>
					{/each}
				</div>
			{/if}
			{#if text}
				<div>{text}</div>
			{/if}
		</div>
		<div class="msg-time">{formatMessageTime(msg.createdAt)}</div>
	</div>
</div>

<style>
	.user-row {
		display: flex;
		justify-content: flex-end;
		width: 100%;
		animation: messageIn 0.25s ease-out;
	}
	.user-col {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.25rem;
		max-width: 75%;
	}
	.user-bubble {
		padding: 0.75rem 1.25rem;
		border-radius: 18px;
		background: #45475a;
		color: #cdd6f4;
		font-size: 0.95rem;
		line-height: 1.5;
		word-break: break-word;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.user-attachments {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.image-thumb {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: #313244;
		border: 1px solid #45475a;
		border-radius: 8px;
		padding: 0.35rem 0.6rem;
		font-size: 0.8rem;
		color: #cdd6f4;
	}
	.file-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: #1e1e2e;
		border: 1px solid #313244;
		border-radius: 8px;
		padding: 0.35rem 0.6rem;
		font-size: 0.8rem;
		color: #cdd6f4;
	}
	.file-ext {
		background: #45475a;
		color: #cdd6f4;
		font-size: 0.65rem;
		font-weight: 700;
		padding: 0.15rem 0.35rem;
		border-radius: 4px;
		letter-spacing: 0.03em;
	}
	.file-label {
		color: #a6adc8;
		font-size: 0.8rem;
	}
	.msg-time {
		font-size: 0.7rem;
		color: #6c7086;
	}
	@keyframes messageIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
