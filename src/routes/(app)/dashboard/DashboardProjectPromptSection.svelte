<script lang="ts">
	import type { Project } from '$lib/types/dashboard';

	let {
		activeProject,
		editingProjectPrompt = $bindable(false),
		projectPromptValue = $bindable(''),
		onSavePrompt,
		onCancelEditPrompt,
		onStartEditPrompt
	} = $props<{
		activeProject: Project | undefined;
		editingProjectPrompt?: boolean;
		projectPromptValue?: string;
		onSavePrompt: () => void;
		onCancelEditPrompt: () => void;
		onStartEditPrompt: () => void;
	}>();
</script>

<div class="project-prompt">
	{#if editingProjectPrompt}
		<div class="prompt-edit">
			<textarea
				placeholder="Enter system prompt for this project..."
				bind:value={projectPromptValue}
				rows={3}
			></textarea>
			<div class="prompt-actions">
				<button class="btn-primary" onclick={onSavePrompt}>Save</button>
				<button class="btn-ghost" onclick={onCancelEditPrompt}>Cancel</button>
			</div>
		</div>
	{:else}
		<div class="prompt-display">
			{#if activeProject?.systemPrompt}
				<div class="prompt-text-scroll thin-scroll">
					<div class="prompt-text">{activeProject.systemPrompt}</div>
				</div>
			{:else}
				<div class="prompt-empty">No system prompt set.</div>
			{/if}
			<button class="btn-ghost" onclick={onStartEditPrompt}>Edit prompt</button>
		</div>
	{/if}
</div>

<style>
	@import './thinScroll.css';

	.project-prompt {
		margin-inline: auto;
		max-width: 900px;
		width: 100%;
		margin-bottom: 2rem;
	}
	.prompt-display {
		background: #1e1e2e;
		border: 1px solid #313244;
		border-radius: 10px;
		padding: 0.75rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}
	.prompt-text-scroll {
		flex: 1;
		min-width: 0;
		max-height: 6.5rem;
	}
	.prompt-text {
		color: #a6adc8;
		font-size: 0.85rem;
		line-height: 1.5;
		white-space: pre-wrap;
	}
	.prompt-empty {
		color: #6c7086;
		font-size: 0.85rem;
		font-style: italic;
		flex: 1;
	}
	.prompt-edit {
		background: #1e1e2e;
		border: 1px solid #313244;
		border-radius: 10px;
		padding: 0.75rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.prompt-edit textarea {
		width: 100%;
		background: #181825;
		border: 1px solid #45475a;
		border-radius: 6px;
		color: #cdd6f4;
		font-size: 0.85rem;
		padding: 0.5rem;
		font-family: inherit;
		resize: vertical;
		outline: none;
	}
	.prompt-edit textarea:focus {
		border-color: #89b4fa;
	}
	.prompt-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}
	.btn-primary {
		background: #45475a;
		border: none;
		border-radius: 6px;
		color: #cdd6f4;
		font-size: 0.8rem;
		padding: 0.35rem 0.75rem;
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
		font-size: 0.8rem;
		padding: 0.35rem 0.75rem;
		cursor: pointer;
		transition: color 0.15s;
		flex-shrink: 0;
	}
	.btn-ghost:hover {
		color: #cdd6f4;
	}
</style>
