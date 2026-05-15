<script lang="ts">
	import SidebarProjectRow from './SidebarProjectRow.svelte';
	import SidebarNewProjectForm from './SidebarNewProjectForm.svelte';
	import type { Project } from '$lib/types/dashboard';

	let {
		projects,
		activeProjectId,
		onSelectProject
	} = $props<{
		projects: Project[];
		activeProjectId: string | null;
		onSelectProject: (id: string) => void;
	}>();

	let showNewProject = $state(false);
</script>

<div class="section-header">
	<div class="section-label">Projects</div>
	<button class="section-add" onclick={() => (showNewProject = true)} title="New project">✚</button>
</div>
{#if showNewProject}
	<SidebarNewProjectForm onDismiss={() => (showNewProject = false)} />
{/if}
<div class="conv-list">
	{#each projects as proj}
		<SidebarProjectRow {proj} {activeProjectId} {onSelectProject} />
	{/each}
	{#if projects.length === 0}
		<p class="empty">No projects yet.</p>
	{/if}
</div>

<style>
	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}
	.section-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6c7086;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0 0.25rem;
	}
	.section-add {
		background: none;
		border: none;
		color: #6c7086;
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0.15rem 0.35rem;
		border-radius: 4px;
		transition:
			color 0.15s,
			background 0.15s;
	}
	.section-add:hover {
		color: #cdd6f4;
		background: #313244;
	}
	.conv-list {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		margin-bottom: 1rem;
	}
	.empty {
		color: #6c7086;
		font-size: 0.85rem;
		padding: 0.5rem;
	}
</style>
