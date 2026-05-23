<script lang="ts">
	let {
		onAppend,
		disabled = false,
		placement = 'toolbar'
	} = $props<{
		onAppend: (text: string) => void;
		disabled?: boolean;
		placement?: 'toolbar' | 'inline';
	}>();

	let active = $state(false);
	let interim = $state('');
	let supported = $state(false);

	type SR = {
		continuous: boolean; interimResults: boolean; lang: string;
		onresult: ((e: SREvent) => void) | null;
		onerror: ((e: { error: string }) => void) | null;
		onend: (() => void) | null;
		start(): void; stop(): void; abort(): void;
	};
	type SREvent = { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> };

	let rec: SR | null = null;

	function buildRec(): SR | null {
		const w = window as Window & { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
		const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
		if (!Ctor) return null;
		const r = new Ctor();
		r.continuous = true;
		r.interimResults = true;
		r.lang = 'en-US';
		r.onresult = (e) => {
			let fin = '';
			let inter = '';
			for (let i = e.resultIndex; i < e.results.length; i++) {
				const result = e.results[i]!;
				if (result.isFinal) fin += result[0].transcript;
				else inter += result[0].transcript;
			}
			if (fin) { onAppend(fin); interim = ''; }
			else interim = inter;
		};
		r.onerror = (e) => {
			if (e.error === 'aborted' || e.error === 'no-speech') return;
			active = false; interim = '';
		};
		r.onend = () => { active = false; interim = ''; };
		return r;
	}

	function toggle() {
		if (!rec) { rec = buildRec(); if (!rec) return; }
		if (active) { rec.stop(); active = false; interim = ''; }
		else { rec.start(); active = true; interim = ''; }
	}

	$effect(() => {
		const w = window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
		supported = !!(w.SpeechRecognition ?? w.webkitSpeechRecognition);
	});
</script>

{#if supported}
	<div class="mic-wrap" class:inline={placement === 'inline'} title={interim || (active ? 'Listening…' : 'Dictate into chat')}>
		<button
			type="button"
			class="mic-btn"
			class:active
			{disabled}
			onclick={toggle}
			aria-label={active ? 'Stop dictation' : 'Start dictation'}
		>
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<rect x="9" y="2" width="6" height="12" rx="3"/>
				<path d="M5 10a7 7 0 0 0 14 0"/>
				<line x1="12" y1="19" x2="12" y2="22"/>
				<line x1="9" y1="22" x2="15" y2="22"/>
			</svg>
		</button>
		{#if interim}
			<span class="interim">{interim}</span>
		{/if}
	</div>
{/if}

<style>
	.mic-wrap {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		max-width: 14rem;
		overflow: hidden;
	}
	.mic-btn {
		background: none;
		border: none;
		color: #585b70;
		cursor: pointer;
		padding: 0.25rem 0.3rem;
		border-radius: 4px;
		line-height: 1;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		transition: color 0.15s;
	}
	.mic-btn:hover:not(:disabled) { color: #a6adc8; }
	.mic-btn.active {
		color: #f38ba8;
		animation: pulse 1.1s ease-in-out infinite;
	}
	.mic-btn:disabled { opacity: 0.3; cursor: not-allowed; }
	.mic-wrap.inline .mic-btn {
		padding: 0.35rem;
		min-width: 2.25rem;
		min-height: 2.25rem;
		justify-content: center;
	}
	.mic-wrap.inline .interim {
		display: none;
	}
	.interim {
		font-size: 0.78rem;
		color: #a6adc8;
		font-style: italic;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	@keyframes pulse {
		0%, 100% { filter: drop-shadow(0 0 0 rgba(243,139,168,0)); }
		50% { filter: drop-shadow(0 0 6px rgba(243,139,168,0.7)); }
	}
</style>
