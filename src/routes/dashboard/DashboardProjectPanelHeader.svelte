<script lang="ts">
	let {
		projectName,
		onNewChatInProject
	} = $props<{ projectName: string; onNewChatInProject: () => void }>();
</script>

<div class="project-header">
	<h2>{projectName}</h2>
	<button class="new-chat-btn" onclick={onNewChatInProject}>✚ New chat in project</button>
</div>

<style>
	.project-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		max-width: 900px;
	}
	.project-header h2 {
		color: #cdd6f4;
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
	}
	.new-chat-btn {
		background: #45475a;
		color: #cdd6f4;
		border: none;
		border-radius: 8px;
		padding: 0.5rem 1rem;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background 0.2s;
	}
	.new-chat-btn:hover {
		background: #585b70;
	}
</style>
