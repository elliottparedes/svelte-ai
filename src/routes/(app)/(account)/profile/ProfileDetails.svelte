<script lang="ts">
	import type { PublicUser } from '$lib/types/app';

	let { user } = $props<{ user: PublicUser }>();

	const displayName = $derived(user.name?.trim() || null);
	const memberSince = $derived(
		new Date(user.createdAt).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);
</script>

<div class="profile-card">
	<dl class="detail-list">
		<div class="detail-row">
			<dt>Display name</dt>
			<dd>{displayName ?? 'No display name set'}</dd>
		</div>
		<div class="detail-row">
			<dt>Email</dt>
			<dd>{user.email}</dd>
		</div>
		<div class="detail-row">
			<dt>Member since</dt>
			<dd>{memberSince}</dd>
		</div>
	</dl>
</div>

<style>
	.profile-card {
		max-width: 32rem;
		padding: 1.5rem;
		border-radius: 12px;
		background: #1e1e2e;
		border: 1px solid #313244;
	}
	.detail-list {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.detail-row {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.detail-row dt {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 500;
		color: #bac2de;
	}
	.detail-row dd {
		margin: 0;
		padding: 0.55rem 0.75rem;
		border-radius: 8px;
		font-size: 0.95rem;
		background: #252537;
		border: 1px solid #313244;
		color: #cdd6f4;
	}
</style>
