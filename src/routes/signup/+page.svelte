<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import AuthCard from '../login/AuthCard.svelte';
	import { parseAuthError } from '$lib/client/authApi';

	let email = $state('');
	let name = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let loading = $state(false);

	async function signup() {
		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}
		loading = true;
		error = '';
		const body: { email: string; password: string; name?: string } = { email, password };
		if (name.trim()) body.name = name.trim();

		const res = await fetch('/api/v1/auth/signup', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
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
	title="Create Account"
	subtitle="Sign up to get started"
	{error}
	{loading}
	submitLabel="Sign up"
	onSubmit={signup}
>
	{#snippet children()}
		<div class="field">
			<label class="label" for="email">Email</label>
			<input id="email" class="input" type="email" autocomplete="email" bind:value={email} required />
		</div>

		<div class="field">
			<label class="label" for="name">Name <span class="has-text-grey">(optional)</span></label>
			<input id="name" class="input" type="text" autocomplete="name" bind:value={name} />
		</div>

		<div class="field">
			<label class="label" for="password">Password</label>
			<input
				id="password"
				class="input"
				type="password"
				autocomplete="new-password"
				bind:value={password}
				required
				minlength="6"
			/>
		</div>

		<div class="field">
			<label class="label" for="confirm-password">Confirm password</label>
			<input
				id="confirm-password"
				class="input"
				type="password"
				autocomplete="new-password"
				bind:value={confirmPassword}
				required
				minlength="6"
			/>
		</div>
	{/snippet}

	{#snippet footer()}
		<p>Already have an account? <a href="/login">Sign in</a></p>
	{/snippet}
</AuthCard>
