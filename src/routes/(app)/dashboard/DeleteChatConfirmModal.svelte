<script lang="ts">
	let {
		open,
		chatTitle,
		onCancel,
		onConfirm
	} = $props<{
		open: boolean;
		chatTitle: string;
		onCancel: () => void;
		onConfirm: () => void | Promise<void>;
	}>();

	function onBackdropKey(e: KeyboardEvent) {
		if (!open || e.key !== 'Escape') return;
		onCancel();
	}
</script>

<svelte:window onkeydown={onBackdropKey} />

{#if open}
	<button type="button" class="backdrop" onclick={onCancel} aria-label="Cancel"></button>
	<div class="wrap" role="dialog" aria-modal="true" aria-labelledby="del-modal-title">
		<div class="box">
			<h2 id="del-modal-title" class="title">Delete chat?</h2>
			<p class="msg">
				<span class="muted">This removes </span>
				<span class="name">“{chatTitle}”</span>
				<span class="muted"> permanently. This cannot be undone.</span>
			</p>
			<div class="actions">
				<button type="button" class="btn secondary" onclick={onCancel}>Cancel</button>
				<button type="button" class="btn danger" onclick={() => void onConfirm()}>Delete</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 20000;
		margin: 0;
		padding: 0;
		border: none;
		width: 100%;
		height: 100%;
		cursor: default;
		background: rgba(24, 24, 37, 0.72);
		backdrop-filter: blur(3px);
	}
	.wrap {
		position: fixed;
		inset: 0;
		z-index: 20001;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.25rem;
		pointer-events: none;
		box-sizing: border-box;
	}
	.box {
		pointer-events: auto;
		width: 100%;
		max-width: 22rem;
		padding: 1.35rem 1.35rem 1.15rem;
		background: #1e1e2e;
		border: 1px solid #313244;
		border-radius: 14px;
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
	}
	.title {
		margin: 0 0 0.65rem;
		font-size: 1.05rem;
		font-weight: 600;
		color: #cdd6f4;
	}
	.msg {
		margin: 0 0 1.25rem;
		font-size: 0.88rem;
		line-height: 1.45;
		color: #a6adc8;
	}
	.muted {
		color: #a6adc8;
	}
	.name {
		color: #cdd6f4;
		font-weight: 500;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
	.btn {
		padding: 0.45rem 0.9rem;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.secondary {
		background: #252537;
		color: #cdd6f4;
		border: 1px solid #313244;
	}
	.secondary:hover {
		background: #313244;
	}
	.danger {
		background: rgba(243, 139, 168, 0.18);
		color: #f38ba8;
		border: 1px solid rgba(243, 139, 168, 0.35);
	}
	.danger:hover {
		background: rgba(243, 139, 168, 0.28);
	}
</style>
