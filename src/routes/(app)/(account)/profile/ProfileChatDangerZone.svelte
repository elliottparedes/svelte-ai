<script lang="ts">
	import DeleteChatConfirmModal from '../../dashboard/DeleteChatConfirmModal.svelte';

	let openConfirm = $state(false);
	let busy = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	function openClearConfirm() {
		if (busy) return;
		errorMessage = '';
		successMessage = '';
		openConfirm = true;
	}

	function cancelClearConfirm() {
		if (busy) return;
		openConfirm = false;
	}

	async function clearAllChats() {
		busy = true;
		errorMessage = '';
		successMessage = '';
		try {
			const res = await fetch('/api/v1/conversations', { method: 'DELETE' });
			if (!res.ok) throw new Error('Failed to clear chats');
			openConfirm = false;
			successMessage = 'All chats were deleted.';
		} catch {
			errorMessage = 'Could not clear chats. Please try again.';
		} finally {
			busy = false;
		}
	}
</script>

<section class="danger-card" aria-labelledby="chat-settings-heading">
	<header class="danger-head">
		<h2 id="chat-settings-heading" class="danger-title">Chat settings</h2>
		<p class="danger-subtitle">Manage destructive chat actions for your account.</p>
	</header>
	<div class="danger-row">
		<div class="copy">
			<p class="label">Clear all chats</p>
			<p class="hint">Delete every conversation permanently, including project chats.</p>
		</div>
		<button type="button" class="clear-btn" onclick={openClearConfirm} disabled={busy}>
			{busy ? 'Clearing...' : 'Clear all chats'}
		</button>
	</div>
	{#if successMessage}<p class="status ok">{successMessage}</p>{/if}
	{#if errorMessage}<p class="status err">{errorMessage}</p>{/if}
</section>

<DeleteChatConfirmModal
	open={openConfirm}
	chatTitle="all chats"
	onCancel={cancelClearConfirm}
	onConfirm={clearAllChats}
/>

<style>
	.danger-card {
		max-width: 40rem;
		padding: 1.25rem;
		border-radius: 12px;
		background: #1e1e2e;
		border: 1px solid rgba(243, 139, 168, 0.35);
	}
	.danger-head {
		margin-bottom: 1rem;
	}
	.danger-title {
		margin: 0 0 0.35rem;
		font-size: 1.05rem;
		color: #f5c2e7;
	}
	.danger-subtitle {
		margin: 0;
		font-size: 0.9rem;
		color: #a6adc8;
	}
	.danger-row {
		display: flex;
		gap: 1rem;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
	}
	.copy {
		flex: 1;
		min-width: 16rem;
	}
	.label {
		margin: 0;
		color: #f38ba8;
		font-size: 0.92rem;
		font-weight: 600;
	}
	.hint {
		margin: 0.35rem 0 0;
		color: #a6adc8;
		font-size: 0.86rem;
	}
	.clear-btn {
		border: 1px solid rgba(243, 139, 168, 0.45);
		background: rgba(243, 139, 168, 0.18);
		color: #f38ba8;
		border-radius: 10px;
		padding: 0.55rem 0.95rem;
		font-size: 0.88rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s ease;
	}
	.clear-btn:hover:not(:disabled) {
		background: rgba(243, 139, 168, 0.28);
	}
	.clear-btn:disabled {
		opacity: 0.7;
		cursor: default;
	}
	.status {
		margin: 0.75rem 0 0;
		font-size: 0.84rem;
	}
	.ok {
		color: #a6e3a1;
	}
	.err {
		color: #f38ba8;
	}
</style>
