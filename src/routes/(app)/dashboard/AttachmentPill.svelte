<script lang="ts">
	let { name, type, dataUrl, onRemove } = $props<{
		name: string;
		type: 'image' | 'text' | 'file';
		dataUrl?: string;
		onRemove: () => void;
	}>();
</script>

{#if type === 'image' && dataUrl}
	<div class="thumb">
		<img src={dataUrl} alt={name} />
		<button type="button" class="thumb-remove" onclick={onRemove} title="Remove">
			<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		</button>
	</div>
{:else}
	{@const ext = name.split('.').pop()?.toUpperCase().slice(0, 4) ?? 'FILE'}
	<div class="file-card">
		<div class="file-badge">{ext}</div>
		<div class="file-info">
			<span class="file-name">{name}</span>
		</div>
		<button type="button" class="file-remove" onclick={onRemove} title="Remove">
			<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		</button>
	</div>
{/if}

<style>
	.thumb {
		position: relative;
		width: 72px;
		height: 72px;
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid #313244;
		flex-shrink: 0;
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.thumb-remove {
		position: absolute;
		top: 2px;
		right: 2px;
		background: rgba(30, 30, 46, 0.8);
		border: none;
		border-radius: 4px;
		color: #cdd6f4;
		cursor: pointer;
		padding: 0.15rem;
		line-height: 1;
		display: inline-flex;
		align-items: center;
		opacity: 0;
		transition: opacity 0.15s;
	}
	.thumb:hover .thumb-remove {
		opacity: 1;
	}
	.thumb-remove:hover {
		background: rgba(243, 139, 168, 0.9);
	}

	.file-card {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: #252537;
		border: 1px solid #313244;
		border-radius: 8px;
		padding: 0.4rem 0.6rem;
		color: #cdd6f4;
		font-size: 0.8rem;
		max-width: 220px;
		transition: border-color 0.15s;
	}
	.file-card:hover {
		border-color: #45475a;
	}
	.file-badge {
		background: #45475a;
		color: #a6adc8;
		font-size: 0.65rem;
		font-weight: 600;
		padding: 0.2rem 0.35rem;
		border-radius: 4px;
		letter-spacing: 0.03em;
		flex-shrink: 0;
	}
	.file-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.file-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: #cdd6f4;
	}
	.file-remove {
		background: none;
		border: none;
		color: #6c7086;
		cursor: pointer;
		padding: 0.15rem;
		line-height: 1;
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		border-radius: 4px;
		transition: color 0.15s, background 0.15s;
	}
	.file-remove:hover {
		color: #f38ba8;
		background: #313244;
	}
</style>
