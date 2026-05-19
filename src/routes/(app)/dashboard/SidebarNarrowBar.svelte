<script lang="ts">
	let { onNewChat, onExpand } = $props<{
		onNewChat: () => void;
		onExpand: () => void;
	}>();
</script>

<div class="narrow-bar">
	<button class="menu-btn" onclick={onExpand} title="Open menu">☰</button>
	<button class="menu-btn" onclick={() => onNewChat()} title="New chat">✚</button>
</div>

<style>
	.menu-btn {
		background: none;
		border: none;
		color: #a6adc8;
		cursor: pointer;
		font-size: 1.1rem;
		padding: 0.25rem;
		border-radius: 6px;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.menu-btn:hover {
		background: #313244;
		color: #cdd6f4;
	}
	.narrow-bar {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem 0;
		gap: 0.5rem;
		height: 100%;
	}
</style>
