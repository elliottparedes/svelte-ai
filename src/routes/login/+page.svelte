<script lang="ts">
	import { goto } from '$app/navigation';

	let email = $state('');
	let error = $state('');
	let loading = $state(false);

	async function login() {
		loading = true;
		error = '';
		const res = await fetch('/api/v1/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email })
		});
		if (!res.ok) {
			error = 'Login failed';
			loading = false;
			return;
		}
		goto('/dashboard');
	}
</script>

<section class="section">
	<div class="container" style="max-width: 400px;">
		<div class="box">
			<h1 class="title is-4">Sign In</h1>
			<p class="subtitle is-6">Dev login — enter your email</p>

			{#if error}
				<div class="notification is-danger is-light">{error}</div>
			{/if}

			<div class="field">
				<label class="label" for="email">Email</label>
				<div class="control">
					<input
						id="email"
						class="input"
						type="email"
						placeholder="test@example.com"
						bind:value={email}
						onkeydown={(e) => e.key === 'Enter' && login()}
					/>
				</div>
			</div>

			<div class="field">
				<div class="control">
					<button class="button is-primary is-fullwidth" onclick={login} disabled={loading}>
						{loading ? 'Loading...' : 'Login'}
					</button>
				</div>
			</div>

			<div class="has-text-grey is-size-7 mt-4">
				<p>Test user: <code>test@example.com</code></p>
			</div>
		</div>
	</div>
</section>
