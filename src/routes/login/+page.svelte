<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import AuthCard from './AuthCard.svelte';
	import { parseAuthError } from '$lib/client/authApi';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function login() {
		loading = true;
		error = '';
		const res = await fetch('/api/v1/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		});
		if (!res.ok) {
			error = await parseAuthError(res);
			loading = false;
			return;
		}
		await invalidateAll();
		await goto('/dashboard');
	}
</script>

<AuthCard
	title="Sign In"
	subtitle="Welcome back"
	{error}
	{loading}
	submitLabel="Login"
	onSubmit={login}
>
	{#snippet children()}
		<div class="field">
			<label class="label" for="email">Email</label>
			<input id="email" class="input" type="email" autocomplete="email" bind:value={email} required />
		</div>

		<div class="field">
			<label class="label" for="password">Password</label>
			<input
				id="password"
				class="input"
				type="password"
				autocomplete="current-password"
				bind:value={password}
				required
			/>
		</div>
	{/snippet}

	{#snippet footer()}
		<p>Don&apos;t have an account? <a href="/signup">Sign up</a></p>
	{/snippet}
</AuthCard>
