<script lang="ts">
	import type { Project } from '$lib/types/dashboard';

	let { proj, activeProjectId, onSelectProject } = $props<{
		proj: Project;
		activeProjectId: string | null;
		onSelectProject: (id: string) => void;
	}>();

	let menuOpen = $state(false);
	let menuWrap: HTMLDivElement | null = $state(null);

	$effect(() => {
		if (!menuOpen) return;
		function onClick(e: MouseEvent) {
			if (menuWrap && !menuWrap.contains(e.target as Node)) menuOpen = false;
		}
		document.addEventListener('click', onClick);
		return () => document.removeEventListener('click', onClick);
	});

	async function deleteProject(e: Event) {
		e.stopPropagation();
		menuOpen = false;
		const res = await fetch(`/api/v1/projects/${proj.id}`, { method: 'DELETE' });
		if (res.ok) window.location.reload();
	}
</script>

<div class="conv-item" class:active={proj.id === activeProjectId}>
	<button class="conv-btn" onclick={() => onSelectProject(proj.id)}>
		<span class="conv-title">{proj.name}</span>
	</button>
	<div class="menu-wrap" bind:this={menuWrap}>
		<button
			type="button"
			class="more-btn"
			title="More options"
			onclick={(e: MouseEvent) => {
				e.stopPropagation();
				menuOpen = !menuOpen;
			}}
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
				<circle cx="12" cy="5" r="2" />
				<circle cx="12" cy="12" r="2" />
				<circle cx="12" cy="19" r="2" />
			</svg>
		</button>
		{#if menuOpen}
			<div class="dropdown">
				<button type="button" class="dropdown-item danger" onclick={deleteProject}>Delete</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.conv-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-radius: 8px;
		transition: background 0.15s;
	}
	.conv-item:hover,
	.conv-item.active {
		background: #313244;
	}
	.conv-btn {
		flex: 1;
		background: none;
		border: none;
		color: #a6adc8;
		cursor: pointer;
		font-size: 0.85rem;
		padding: 0.4rem 0.5rem;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.conv-btn:hover {
		color: #cdd6f4;
	}
	.conv-title {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.menu-wrap {
		position: relative;
		flex-shrink: 0;
	}
	.more-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		color: #6c7086;
		cursor: pointer;
		padding: 0.3rem;
		border-radius: 4px;
		transition:
			color 0.15s,
			background 0.15s,
			opacity 0.15s;
		opacity: 0;
	}
	.conv-item:hover .more-btn,
	.menu-wrap:has(.dropdown) .more-btn {
		opacity: 1;
	}
	.more-btn:hover {
		color: #cdd6f4;
		background: #45475a;
	}
	.dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		background: #1e1e2e;
		border: 1px solid #313244;
		border-radius: 8px;
		padding: 0.35rem 0;
		min-width: 160px;
		z-index: 10;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}
	.dropdown-item {
		display: block;
		width: 100%;
		background: none;
		border: none;
		color: #cdd6f4;
		cursor: pointer;
		font-size: 0.8rem;
		padding: 0.4rem 0.75rem;
		text-align: left;
		transition: background 0.15s;
	}
	.dropdown-item:hover {
		background: #313244;
	}
	.dropdown-item.danger {
		color: #f38ba8;
	}

	@media (max-width: 768px) {
		.more-btn {
			opacity: 1;
			min-width: 2.25rem;
			min-height: 2.25rem;
			padding: 0.4rem;
			color: #a6adc8;
			-webkit-tap-highlight-color: transparent;
		}
	}
</style>
