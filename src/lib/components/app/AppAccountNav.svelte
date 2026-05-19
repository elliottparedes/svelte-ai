<script lang="ts">
	import { page } from '$app/stores';
	import { accountNavItems } from '$lib/config/accountNav';

	const pathname = $derived($page.url.pathname);
</script>

<nav class="account-nav" aria-label="Account">
	<ul class="nav-list">
		{#each accountNavItems as item (item.href)}
			<li>
				<a class="nav-link" class:active={pathname === item.href} href={item.href}>
					{item.label}
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.account-nav {
		flex-shrink: 0;
	}
	.nav-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.nav-link {
		display: block;
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		color: #a6adc8;
		text-decoration: none;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.nav-link:hover {
		background: #252537;
		color: #cdd6f4;
	}
	.nav-link.active {
		background: #252537;
		color: #89b4fa;
	}
</style>
