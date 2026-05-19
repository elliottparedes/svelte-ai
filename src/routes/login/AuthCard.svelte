<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		subtitle,
		error = '',
		loading = false,
		submitLabel,
		onSubmit,
		footer,
		children
	}: {
		title: string;
		subtitle: string;
		error?: string;
		loading?: boolean;
		submitLabel: string;
		onSubmit: () => void;
		footer: Snippet;
		children: Snippet;
	} = $props();
</script>

<div class="auth-page">
	<div class="auth-card">
		<header class="auth-header">
			<p class="auth-brand">Inkstream</p>
			<h1 class="auth-title">{title}</h1>
			<p class="auth-subtitle">{subtitle}</p>
		</header>

		{#if error}
			<p class="auth-error" role="alert">{error}</p>
		{/if}

		<form
			class="auth-form"
			onsubmit={(e) => {
				e.preventDefault();
				onSubmit();
			}}
		>
			{@render children()}

			<button type="submit" class="auth-submit" disabled={loading}>
				{loading ? 'Please wait…' : submitLabel}
			</button>
		</form>

		<footer class="auth-footer">
			{@render footer()}
		</footer>
	</div>
</div>

<style>
	.auth-page {
		flex: 1;
		width: 100%;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		box-sizing: border-box;
		background: #181825;
		overflow-y: auto;
	}

	.auth-card {
		width: 100%;
		max-width: 22rem;
		padding: 2rem 1.75rem;
		border-radius: 12px;
		background: #1e1e2e;
		border: 1px solid #313244;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
	}

	.auth-header {
		margin-bottom: 1.5rem;
	}

	.auth-brand {
		margin: 0 0 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #89b4fa;
	}

	.auth-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #cdd6f4;
		line-height: 1.25;
	}

	.auth-subtitle {
		margin: 0.35rem 0 0;
		font-size: 0.9rem;
		color: #a6adc8;
	}

	.auth-error {
		margin: 0 0 1rem;
		padding: 0.65rem 0.75rem;
		border-radius: 8px;
		font-size: 0.875rem;
		background: rgba(243, 139, 168, 0.12);
		border: 1px solid rgba(243, 139, 168, 0.35);
		color: #f38ba8;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.auth-form :global(.field) {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin: 0;
	}

	.auth-form :global(.label) {
		font-size: 0.8rem;
		font-weight: 500;
		color: #bac2de;
	}

	.auth-form :global(.label .has-text-grey) {
		font-weight: 400;
		color: #6c7086;
	}

	.auth-form :global(.input) {
		width: 100%;
		box-sizing: border-box;
		padding: 0.55rem 0.75rem;
		border-radius: 8px;
		font-size: 0.95rem;
		background: #252537;
		border: 1px solid #313244;
		color: #cdd6f4;
	}

	.auth-form :global(.input:focus) {
		outline: none;
		border-color: #89b4fa;
		box-shadow: 0 0 0 2px rgba(137, 180, 250, 0.2);
	}

	.auth-submit {
		margin-top: 0.25rem;
		width: 100%;
		padding: 0.65rem 1rem;
		border: none;
		border-radius: 8px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		background: #89b4fa;
		color: #1e1e2e;
		transition: background 0.15s ease;
	}

	.auth-submit:hover:not(:disabled) {
		background: #b4befe;
	}

	.auth-submit:disabled {
		opacity: 0.65;
		cursor: not-allowed;
	}

	.auth-footer {
		margin-top: 1.25rem;
		padding-top: 1.25rem;
		border-top: 1px solid #313244;
		font-size: 0.875rem;
		color: #a6adc8;
		text-align: center;
	}

	.auth-footer :global(a) {
		color: #89b4fa;
		text-decoration: none;
		font-weight: 500;
	}

	.auth-footer :global(a:hover) {
		text-decoration: underline;
	}
</style>
