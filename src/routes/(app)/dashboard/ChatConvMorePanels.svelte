<script lang="ts">
	let {
		conv,
		otherProjects,
		showAddSection,
		projectPickerOpen = $bindable(),
		onRename,
		onDelete,
		onMoveToProject
	} = $props<{
		conv: { id: string; title: string; projectId?: string | null };
		otherProjects: readonly { id: string; name: string }[];
		showAddSection: boolean;
		projectPickerOpen: boolean;
		onRename: (c: { id: string; title: string; projectId?: string | null }, e: MouseEvent) => void;
		onDelete: (id: string, e: MouseEvent) => void;
		onMoveToProject: (convId: string, projectId: string | null) => Promise<void>;
	}>();
</script>

<div class="card">
	<button type="button" class="row" onclick={(e) => onRename(conv, e)}>Rename</button>
	{#if showAddSection}
		<div class="sec">Add to project</div>
		<button
			type="button"
			class="row pick"
			class:pick-on={projectPickerOpen}
			onclick={(e) => {
				e.stopPropagation();
				projectPickerOpen = !projectPickerOpen;
			}}
		>
			<span>Choose project</span><span class="arr" aria-hidden="true">›</span>
		</button>
		{#if projectPickerOpen && otherProjects.length > 0}
			<div class="sec nest">Move into</div>
			<div class="nest-list">
				{#each otherProjects as proj}
					<button
						type="button"
						class="row nest-row"
						onclick={async (e) => {
							e.stopPropagation();
							projectPickerOpen = false;
							await onMoveToProject(conv.id, proj.id);
						}}
					>{proj.name}</button>
				{/each}
			</div>
		{/if}
	{/if}
	{#if conv.projectId}
		<button
			type="button"
			class="row"
			onclick={async (e) => {
				e.stopPropagation();
				await onMoveToProject(conv.id, null);
			}}
		>Remove from project</button>
	{/if}
	<div class="rule"></div>
	<button type="button" class="row bad" onclick={(e) => onDelete(conv.id, e)}>Delete</button>
</div>

<style>
	.card {
		min-width: 10rem;
		max-width: 13rem;
		padding: 0.35rem 0;
		border: 1px solid #313244;
		border-radius: 8px;
		background: #1e1e2e;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
		display: flex;
		flex-direction: column;
	}
	.nest-list {
		display: flex;
		flex-direction: column;
		max-height: 11rem;
		overflow-y: auto;
		padding-bottom: 0.2rem;
		scrollbar-width: thin;
		scrollbar-color: #45475a transparent;
	}
	.sec {
		padding: 0.35rem 0.65rem 0.15rem;
		font: 600 0.62rem/1.2 inherit;
		color: #6c7086;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.sec.nest {
		padding-top: 0.25rem;
		border-top: 1px solid #313244;
		margin-top: 0.15rem;
	}
	.row {
		display: flex;
		align-items: center;
		width: 100%;
		flex-shrink: 0;
		padding: 0.38rem 0.65rem;
		border: none;
		background: none;
		color: #cdd6f4;
		font-size: 0.78rem;
		text-align: left;
		cursor: pointer;
		transition: background 0.15s;
	}
	.row:hover {
		background: #313244;
	}
	.row.bad {
		color: #f38ba8;
	}
	.pick {
		justify-content: space-between;
		gap: 0.35rem;
		font-size: 0.76rem;
		color: #a6adc8;
	}
	.pick-on .arr {
		transform: rotate(90deg);
	}
	.arr {
		font-size: 0.85rem;
		line-height: 1;
		opacity: 0.75;
		transition: transform 0.15s;
	}
	.nest-row {
		padding-left: 0.85rem;
		font-size: 0.76rem;
		color: #a6adc8;
	}
	.rule {
		height: 1px;
		margin: 0.2rem 0;
		background: #313244;
	}
</style>
