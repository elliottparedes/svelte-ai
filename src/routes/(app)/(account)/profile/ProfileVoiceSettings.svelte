<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { TtsVoiceOption } from '$lib/shared/ttsVoice';
	import {
		fetchTtsVoices,
		playTtsVoicePreview,
		saveTtsVoicePreference
	} from '$lib/client/profileVoiceApi';

	let {
		ttsEnabled,
		defaultVoiceId,
		defaultVoiceName = null,
		initialVoiceId = null
	} = $props<{
		ttsEnabled: boolean;
		defaultVoiceId: string;
		defaultVoiceName?: string | null;
		initialVoiceId: string | null;
	}>();

	let voices = $state<TtsVoiceOption[]>([]);
	let selectedId = $state('');
	let loading = $state(false);
	let saving = $state(false);
	let previewing = $state(false);
	let error = $state('');
	let saved = $state(false);

	const effectiveId = $derived(selectedId || defaultVoiceId);
	const resolvedDefaultName = $derived(
		defaultVoiceName ?? voices.find((v) => v.id === defaultVoiceId)?.name ?? 'Server default'
	);
	const defaultOptionLabel = $derived(`Default (${resolvedDefaultName})`);
	const selectedDisplay = $derived(
		selectedId
			? (voices.find((v) => v.id === selectedId)?.name ?? 'Saved voice')
			: resolvedDefaultName
	);

	$effect(() => {
		selectedId = initialVoiceId ?? '';
	});

	$effect(() => {
		if (!ttsEnabled) return;
		void loadVoices();
	});

	async function loadVoices() {
		loading = true;
		error = '';
		try {
			voices = await fetchTtsVoices();
		} catch {
			error = 'Failed to load ElevenLabs voices.';
		} finally {
			loading = false;
		}
	}

	async function saveVoice() {
		saving = true;
		error = '';
		saved = false;
		try {
			await saveTtsVoicePreference(selectedId || null);
			await invalidateAll();
			saved = true;
		} catch {
			error = 'Could not save voice preference.';
		} finally {
			saving = false;
		}
	}

	async function previewVoice() {
		if (!effectiveId) return;
		previewing = true;
		error = '';
		try {
			await playTtsVoicePreview(effectiveId);
		} catch {
			error = 'Preview playback failed.';
		} finally {
			previewing = false;
		}
	}
</script>

{#if ttsEnabled}
	<section class="voice-card" aria-labelledby="voice-heading">
		<h2 id="voice-heading" class="section-title">Assistant voice</h2>
		<p class="hint">
			Used when voice mode is on in chat. Preview plays each voice’s premade sample (not billed
			like live TTS in chat).
		</p>
		{#if loading}
			<p class="muted">Loading voices…</p>
		{:else}
			<label class="field">
				<span class="label">Voice</span>
				<select bind:value={selectedId} disabled={saving}>
					<option value="">{defaultOptionLabel}</option>
					{#each voices as v (v.id)}
						<option value={v.id}>{v.name} · {v.category}</option>
					{/each}
				</select>
			</label>
			<p class="picked">Selected: <strong>{selectedDisplay}</strong></p>
			<div class="actions">
				<button type="button" class="btn secondary" disabled={previewing} onclick={() => void previewVoice()}>
					{previewing ? 'Playing…' : 'Preview'}
				</button>
				<button type="button" class="btn primary" disabled={saving} onclick={() => void saveVoice()}>
					{saving ? 'Saving…' : 'Save'}
				</button>
			</div>
			{#if saved}<p class="ok">Voice saved.</p>{/if}
		{/if}
		{#if error}<p class="err">{error}</p>{/if}
	</section>
{/if}

<style src="./profileVoiceCard.css"></style>
