<script lang="ts">
	import type { Snippet } from 'svelte';
	import AppAccountNav from './AppAccountNav.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="account-shell">
	<aside class="account-sidebar">
		<div class="sidebar-top">
			<a class="back-link" href="/dashboard">← Back to chat</a>
			<p class="sidebar-brand">Account</p>
		</div>
		<AppAccountNav />
	</aside>
	<main class="account-main">
		{@render children()}
	</main>
</div>

<style>
	.account-shell {
		display: flex;
		flex: 1;
		min-height: 0;
		width: 100%;
		overflow: hidden;
		background: #181825;
	}
	.account-sidebar {
		width: 220px;
		min-width: 220px;
		padding: 1.25rem 1rem;
		background: #1e1e2e;
		border-right: 1px solid #313244;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		overflow-y: auto;
	}
	.sidebar-top {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.back-link {
		font-size: 0.8rem;
		color: #89b4fa;
		text-decoration: none;
	}
	.back-link:hover {
		text-decoration: underline;
	}
	.sidebar-brand {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #6c7086;
	}
	.account-main {
		flex: 1;
		min-width: 0;
		overflow-y: auto;
		padding: 2rem;
	}
</style>
