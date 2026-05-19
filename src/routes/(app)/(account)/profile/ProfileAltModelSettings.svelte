<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { OPTIONAL_DASHBOARD_MODELS, normalizeAltModelIds } from '$lib/shared/optionalDashboardModels';
	import { saveAltModelPreferences } from '$lib/client/profileAltModelsApi';
	import ProfileModelToggleRow from './ProfileModelToggleRow.svelte';

	let { initialEnabledIds } = $props<{ initialEnabledIds: string[] }>();

	let enabled = $state<string[]>([]);
	let saving = $state(false);
	let error = $state('');
	let saved = $state(false);

	const mustHave = $derived(OPTIONAL_DASHBOARD_MODELS.filter((m) => m.tier === 'must'));
	const niceToHave = $derived(OPTIONAL_DASHBOARD_MODELS.filter((m) => m.tier === 'nice'));

	$effect(() => {
		enabled = [...initialEnabledIds];
	});

	function toggle(id: string, on: boolean) {
		const set = new Set(enabled);
		if (on) set.add(id);
		else set.delete(id);
		enabled = normalizeAltModelIds([...set]);
		void persist();
	}

	async function persist() {
		saving = true;
		error = '';
		saved = false;
		try {
			await saveAltModelPreferences(enabled);
			await invalidateAll();
			saved = true;
		} catch {
			error = 'Could not save model preferences.';
		} finally {
			saving = false;
		}
	}
</script>

<section class="voice-card" aria-labelledby="models-heading">
	<h2 id="models-heading" class="section-title">Extra chat models</h2>
	<p class="hint">
		Core models (Qwen, DeepSeek, Kimi, etc.) are always available. Toggle extras to show them in
		the dashboard model picker.
	</p>

	<h3 class="group-label">Must-have</h3>
	<div class="rows">
		{#each mustHave as m (m.id)}
			<ProfileModelToggleRow
				title={m.title}
				description={m.description}
				tier="must"
				checked={enabled.includes(m.id)}
				disabled={saving}
				onChange={(on) => toggle(m.id, on)}
			/>
		{/each}
	</div>

	<h3 class="group-label">Nice-to-have</h3>
	<div class="rows">
		{#each niceToHave as m (m.id)}
			<ProfileModelToggleRow
				title={m.title}
				description={m.description}
				tier="nice"
				checked={enabled.includes(m.id)}
				disabled={saving}
				onChange={(on) => toggle(m.id, on)}
			/>
		{/each}
	</div>

	{#if saving}<p class="muted">Saving…</p>{/if}
	{#if saved && !saving}<p class="ok">Saved.</p>{/if}
	{#if error}<p class="err">{error}</p>{/if}
</section>

<style src="./profileVoiceCard.css"></style>
