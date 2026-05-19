<script lang="ts">
	import { page } from '$app/stores';
	import AppPageHeader from '$lib/components/app/AppPageHeader.svelte';
	import ProfileDetails from './ProfileDetails.svelte';
	import ProfileVoiceSettings from './ProfileVoiceSettings.svelte';
	import type { PublicUser } from '$lib/types/app';

	const user = $derived($page.data.user as PublicUser | null);
	const ttsEnabled = $derived(Boolean($page.data.ttsEnabled));
	const defaultVoiceId = $derived(String($page.data.defaultVoiceId ?? ''));
	const defaultVoiceName = $derived(($page.data.defaultVoiceName as string | null) ?? null);
	const ttsVoiceId = $derived(($page.data.ttsVoiceId as string | null) ?? null);
</script>

{#if user}
	<AppPageHeader title="Profile" subtitle="Your account details" />
	<ProfileDetails {user} />
	<ProfileVoiceSettings
		{ttsEnabled}
		{defaultVoiceId}
		{defaultVoiceName}
		initialVoiceId={ttsVoiceId}
	/>
{:else}
	<p class="error">Unable to load profile.</p>
{/if}

<style>
	.error {
		color: #f38ba8;
		font-size: 0.9rem;
	}
</style>
