<script lang="ts">
	import { page } from '$app/stores';
	import AppPageHeader from '$lib/components/app/AppPageHeader.svelte';
	import ProfileDetails from './ProfileDetails.svelte';
import ProfileChatDangerZone from './ProfileChatDangerZone.svelte';
	import ProfileTelegramBots from './ProfileTelegramBots.svelte';
	import type { PublicUser } from '$lib/types/app';

	const user = $derived($page.data.user as PublicUser | null);
</script>

{#if user}
	<AppPageHeader title="Profile" subtitle="Your account details" />
	<div class="profile-sections">
		<ProfileDetails {user} />
		<ProfileTelegramBots />
		<ProfileChatDangerZone />
	</div>
{:else}
	<p class="error">Unable to load profile.</p>
{/if}

<style>
	.profile-sections {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}
	.error {
		color: #f38ba8;
		font-size: 0.9rem;
	}
</style>
