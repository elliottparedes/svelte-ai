<script lang="ts">
	import { onMount } from 'svelte';

	let { onDismiss } = $props<{ onDismiss: () => void }>();

	let newProjectName = $state('');
	let newProjectNameEl: HTMLInputElement | null = $state(null);

	onMount(() => queueMicrotask(() => newProjectNameEl?.focus()));

	async function createProject() {
		const name = newProjectName.trim();
		if (!name) return;
		const res = await fetch('/api/v1/projects', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		});
		if (res.ok) window.location.reload();
	}

	function cancel() {
		newProjectName = '';
		onDismiss();
	}
</script>

<div class="new-project-form">
	<input
		bind:this={newProjectNameEl}
		type="text"
		placeholder="Project name"
		bind:value={newProjectName}
		class="new-project-input"
		onkeydown={(e: KeyboardEvent) => {
			if (e.key === 'Enter') createProject();
			if (e.key === 'Escape') cancel();
		}}
	/>
	<div class="new-project-actions">
		<button class="btn-primary" onclick={createProject}>Create</button>
		<button class="btn-ghost" onclick={cancel}>Cancel</button>
	</div>
</div>

<style>
	.new-project-form {
		background: #1e1e2e;
		border: 1px solid #313244;
		border-radius: 10px;
		padding: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.new-project-input {
		width: 100%;
		background: #181825;
		border: 1px solid #313244;
		border-radius: 6px;
		color: #cdd6f4;
		padding: 0.4rem 0.5rem;
		font-size: 0.85rem;
		outline: none;
	}
	.new-project-input:focus {
		border-color: #89b4fa;
	}
	.new-project-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin-top: 0.35rem;
	}
	.btn-primary {
		background: #45475a;
		border: none;
		border-radius: 6px;
		color: #cdd6f4;
		font-size: 0.75rem;
		padding: 0.3rem 0.6rem;
		cursor: pointer;
		transition: background 0.15s;
	}
	.btn-primary:hover {
		background: #585b70;
	}
	.btn-ghost {
		background: none;
		border: none;
		border-radius: 6px;
		color: #6c7086;
		font-size: 0.75rem;
		padding: 0.3rem 0.6rem;
		cursor: pointer;
		transition: color 0.15s;
	}
	.btn-ghost:hover {
		color: #cdd6f4;
	}
</style>
