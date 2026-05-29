<script lang="ts">
	import type { DashboardUser } from '$lib/types/dashboard';
	import type { ChatQuotaView } from '$lib/types/app';

	let { user, chatQuota = null, onLogout } = $props<{
		user: DashboardUser;
		chatQuota?: ChatQuotaView | null;
		onLogout: () => void;
	}>();

	const tierLabel = $derived(() => {
		const t = user.subscriptionTier ?? chatQuota?.tier ?? 'free';
		if (t === 'pro') return 'Pro';
		if (t === 'standard') return 'Standard';
		return 'Free';
	});
</script>

<div class="user-footer">
	<div class="user-meta">
		<a class="user-name" href="/profile" title="View profile">{user.name ?? user.email}</a>
		<span class="tier-pill" class:pro={tierLabel() === 'Pro'}>{tierLabel()}</span>
	</div>
	<button class="logout-btn" onclick={onLogout}>Logout</button>
</div>

<style>
	.user-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.75rem 0.5rem 0;
		flex-shrink: 0;
		border-top: 1px solid #313244;
		font-size: 0.8rem;
	}
	.user-meta {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
		flex: 1;
	}
	.tier-pill {
		align-self: flex-start;
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #a6adc8;
		background: #313244;
		padding: 0.1rem 0.35rem;
		border-radius: 4px;
	}
	.tier-pill.pro {
		color: #1e1e2e;
		background: #a6e3a1;
	}
	.user-name {
		color: #a6adc8;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-decoration: none;
		flex: 1;
		min-width: 0;
	}
	.user-name:hover {
		color: #89b4fa;
	}
	.logout-btn {
		background: none;
		border: 1px solid #45475a;
		border-radius: 6px;
		color: #a6adc8;
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s;
		flex-shrink: 0;
	}
	.logout-btn:hover {
		color: #f38ba8;
		border-color: #f38ba8;
	}
</style>
