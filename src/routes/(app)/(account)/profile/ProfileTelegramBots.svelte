<script lang="ts">
	import './profileTelegramBots.css';
	import {
		createTelegramBot,
		deleteTelegramBot,
		getTelegramSetupInfo,
		listTelegramBots,
		listTelegramModels,
		syncTelegramBotWebhook,
		updateTelegramBot,
		type ChatModelLite,
		type TelegramBotView,
		type TelegramSetupInfo
	} from '$lib/client/profileTelegramBotsApi';
	import ProfileTelegramBotList from './ProfileTelegramBotList.svelte';
	import ProfileTelegramConnectForm from './ProfileTelegramConnectForm.svelte';
	import ProfileTelegramSetup from './ProfileTelegramSetup.svelte';

	let bots = $state<TelegramBotView[]>([]);
	let setup = $state<TelegramSetupInfo | null>(null);
	let models = $state<ChatModelLite[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');
	let ok = $state('');
	let name = $state('');
	let token = $state('');
	let defaultModelId = $state('qwen/qwen3.5-flash-02-23');
	let dailyMessageLimit = $state(500);

	$effect(() => {
		void refresh();
	});

	async function refresh() {
		loading = true;
		error = '';
		try {
			const [b, s, m] = await Promise.all([
				listTelegramBots(),
				getTelegramSetupInfo(),
				listTelegramModels()
			]);
			bots = b;
			setup = s;
			models = m.slice(0, 40);
			if (!models.find((model) => model.id === defaultModelId) && models.length > 0) {
				defaultModelId = models[0].id;
			}
		} catch {
			error = 'Could not load Telegram settings.';
		} finally {
			loading = false;
		}
	}

	async function connectBot() {
		if (!name.trim() || !token.trim()) return;
		saving = true;
		error = '';
		ok = '';
		try {
			await createTelegramBot({
				name: name.trim(),
				token: token.trim(),
				defaultModelId: defaultModelId.trim() || null,
				dailyMessageLimit
			});
			name = '';
			token = '';
			ok = 'Telegram bot connected.';
			await refresh();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not connect Telegram bot.';
		} finally {
			saving = false;
		}
	}

	async function toggleStatus(bot: TelegramBotView) {
		saving = true;
		error = '';
		try {
			await updateTelegramBot(bot.id, { status: bot.status === 'active' ? 'paused' : 'active' });
			await refresh();
		} catch {
			error = 'Could not update bot status.';
		} finally {
			saving = false;
		}
	}

	async function syncWebhook(bot: TelegramBotView) {
		saving = true;
		error = '';
		ok = '';
		try {
			const status = await syncTelegramBotWebhook(bot.id);
			ok = status.registered
				? 'Webhook registered. Send a message to your bot on Telegram.'
				: 'Webhook call succeeded but URL mismatch — check TELEGRAM_WEBHOOK_BASE_URL.';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not register webhook.';
		} finally {
			saving = false;
		}
	}

	async function removeBot(bot: TelegramBotView) {
		if (!confirm(`Delete "${bot.name}"?`)) return;
		saving = true;
		error = '';
		try {
			await deleteTelegramBot(bot.id);
			await refresh();
		} catch {
			error = 'Could not delete bot.';
		} finally {
			saving = false;
		}
	}
</script>

<section class="tg-card" aria-labelledby="telegram-heading">
	<header class="tg-card__head">
		<h2 id="telegram-heading" class="tg-card__title">Telegram bots</h2>
		<p class="tg-card__subtitle">Connect a BotFather token so users can chat with your AI bot on Telegram.</p>
	</header>

	{#if setup && !setup.webhookBaseConfigured}
		<p class="tg-alert">
			Webhook is not configured on the server. Set <code>TELEGRAM_WEBHOOK_BASE_URL</code> in
			<code>.env</code> to a public HTTPS URL (use ngrok for local dev), restart the app, then
			click <strong>Register webhook</strong> on your bot.
		</p>
	{/if}

	<ProfileTelegramConnectForm
		bind:name
		bind:token
		bind:defaultModelId
		bind:dailyMessageLimit
		{models}
		{loading}
		{saving}
		onConnect={connectBot}
	/>

	{#if loading}<p class="tg-status tg-status--muted">Loading Telegram settings…</p>{/if}
	{#if ok}<p class="tg-status tg-status--ok">{ok}</p>{/if}
	{#if error}<p class="tg-status tg-status--err">{error}</p>{/if}

	<ProfileTelegramBotList
		bots={bots}
		{saving}
		onToggle={toggleStatus}
		onSync={syncWebhook}
		onRemove={removeBot}
	/>
	{#if setup}<ProfileTelegramSetup {setup} />{/if}
</section>
