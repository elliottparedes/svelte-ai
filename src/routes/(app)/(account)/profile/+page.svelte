<script lang="ts">
	import { page } from '$app/stores';
	import AppPageHeader from '$lib/components/app/AppPageHeader.svelte';
	import ProfileDetails from './ProfileDetails.svelte';
	import ProfileAltModelSettings from './ProfileAltModelSettings.svelte';
	import type { PublicUser } from '$lib/types/app';

	const user = $derived($page.data.user as PublicUser | null);
	const enabledAltModelIds = $derived(($page.data.enabledAltModelIds as string[]) ?? []);
</script>

{#if user}
	<AppPageHeader title="Profile" subtitle="Your account details" />
	<ProfileDetails {user} />
	<ProfileAltModelSettings initialEnabledIds={enabledAltModelIds} />
{:else}
	<p class="error">Unable to load profile.</p>
{/if}

<style>
	.error {
		color: #f38ba8;
		font-size: 0.9rem;
	}
</style>
