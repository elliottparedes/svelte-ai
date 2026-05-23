<script lang="ts">
	import ChatConvMorePanels from './ChatConvMorePanels.svelte';
	import type { Conversation, Project } from '$lib/types/dashboard';

	let {
		conv,
		projects,
		isOpen,
		onToggle,
		onRename,
		onDelete,
		onMoveToProject
	} = $props<{
		conv: Conversation;
		projects: readonly Project[];
		isOpen: boolean;
		onToggle: (e: MouseEvent) => void;
		onRename: (conv: Conversation, e: MouseEvent) => void;
		onDelete: (id: string, e: MouseEvent) => void;
		onMoveToProject: (convId: string, projectId: string | null) => Promise<void>;
	}>();

	let projectPickerOpen = $state(false);
	let btnEl = $state<HTMLButtonElement | null>(null);
	let flyEl = $state<HTMLDivElement | null>(null);
	let flyTop = $state(0);
	let flyLeft = $state(0);

	$effect(() => {
		if (!isOpen) projectPickerOpen = false;
	});

	function syncFlyPosition() {
		const el = btnEl;
		if (!el || !isOpen) return;

		const r = el.getBoundingClientRect();
		const margin = 10;
		const menuW = flyEl?.offsetWidth ?? 168;
		const menuH = flyEl?.offsetHeight ?? 280;
		const maxLeft = window.innerWidth - menuW - margin;
		const maxTop = window.innerHeight - menuH - margin;

		let left = window.matchMedia('(max-width: 768px)').matches ? r.right - menuW : r.left;
		left = Math.max(margin, Math.min(left, maxLeft));

		let top = r.bottom + 4;
		if (top + menuH > window.innerHeight - margin) {
			top = r.top - menuH - 4;
		}
		top = Math.max(margin, Math.min(top, maxTop));

		flyTop = Math.round(top);
		flyLeft = Math.round(left);
	}

	$effect(() => {
		if (!isOpen || !flyEl) return;

		syncFlyPosition();

		const ro = new ResizeObserver(() => syncFlyPosition());
		ro.observe(flyEl);

		window.addEventListener('resize', syncFlyPosition);
		window.addEventListener('scroll', syncFlyPosition, true);
		return () => {
			ro.disconnect();
			window.removeEventListener('resize', syncFlyPosition);
			window.removeEventListener('scroll', syncFlyPosition, true);
		};
	});

	const otherProjects = $derived(projects.filter((p: Project) => p.id !== conv.projectId));
	const showAddSection = $derived(otherProjects.length > 0);
</script>

<div class="root" data-chat-menu-open={isOpen ? '' : undefined}>
	<button type="button" class="more" bind:this={btnEl} title="More options" onclick={onToggle}>
		<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
		</svg>
	</button>
	{#if isOpen}
		<div class="fly" bind:this={flyEl} style="top:{flyTop}px;left:{flyLeft}px;">
			<ChatConvMorePanels
				{conv}
				{otherProjects}
				{showAddSection}
				bind:projectPickerOpen
				{onRename}
				{onDelete}
				{onMoveToProject}
			/>
		</div>
	{/if}
</div>

<style>
	.root {
		position: relative;
		flex-shrink: 0;
	}
	.fly {
		position: fixed;
		z-index: 10000;
		margin: 0;
		max-width: calc(100vw - 1.25rem);
	}
	.more {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.3rem;
		border: none;
		border-radius: 4px;
		background: none;
		color: #6c7086;
		cursor: pointer;
		line-height: 1;
		opacity: 0;
		flex-shrink: 0;
		transition: color 0.15s, background 0.15s, opacity 0.15s;
	}
	.root[data-chat-menu-open] .more,
	:global(.conv-item:hover) .more {
		opacity: 1;
	}
	.more:hover {
		color: #cdd6f4;
		background: #45475a;
	}

	@media (max-width: 768px) {
		.fly {
			max-width: 10.5rem;
		}

		.more {
			opacity: 1;
			min-width: 2.25rem;
			min-height: 2.25rem;
			padding: 0.4rem;
			color: #a6adc8;
			-webkit-tap-highlight-color: transparent;
		}
	}
</style>
