<script lang="ts">
	let { projectId, onBack } = $props<{
		projectId: string;
		onBack: (projectId: string) => void;
	}>();
</script>

<button type="button" class="back" onclick={() => onBack(projectId)} title="Back to project">←</button>

<style>
	.back {
		position: absolute;
		top: 0.65rem;
		left: 0.65rem;
		z-index: 5;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 1px solid #45475a;
		border-radius: 8px;
		background: #1e1e2e;
		color: #cdd6f4;
		font-size: 1.1rem;
		line-height: 1;
		cursor: pointer;
	}
	.back:hover {
		background: #313244;
	}
</style>
