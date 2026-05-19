<script lang="ts">
	import type { DashboardUser } from '$lib/types/dashboard';

	let { user, onLogout } = $props<{ user: DashboardUser; onLogout: () => void }>();
</script>

<div class="user-footer">
	<span class="user-name">{user.name ?? user.email}</span>
	<button class="logout-btn" onclick={onLogout}>Logout</button>
</div>

<style>
	.user-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.75rem 0.5rem 0;
		margin-top: auto;
		border-top: 1px solid #313244;
		font-size: 0.8rem;
	}
	.user-name {
		color: #a6adc8;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
