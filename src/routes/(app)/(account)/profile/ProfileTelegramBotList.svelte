<script lang="ts">
	import type { TelegramBotView } from '$lib/client/profileTelegramBotsApi';

	let {
		bots,
		saving,
		onToggle,
		onSync,
		onRemove
	} = $props<{
		bots: TelegramBotView[];
		saving: boolean;
		onToggle: (bot: TelegramBotView) => Promise<void>;
		onSync: (bot: TelegramBotView) => Promise<void>;
		onRemove: (bot: TelegramBotView) => Promise<void>;
	}>();
</script>

<section class="tg-section" aria-labelledby="connected-bots-heading">
	<h3 id="connected-bots-heading" class="tg-section__title">Connected bots</h3>
	{#if bots.length === 0}
		<p class="tg-empty">No bots connected yet.</p>
	{:else}
		{#each bots as bot (bot.id)}
			<article class="tg-bot">
				<div class="tg-bot__name">
					{bot.name}
					{#if bot.botUsername}<span class="tg-bot__user">@{bot.botUsername}</span>{/if}
				</div>
				<p class="tg-bot__meta">Token {bot.tokenHint} · {bot.status}</p>
				{#if !bot.webhookBaseConfigured}
					<p class="tg-bot__warn">Webhook URL not set on server — messages will not arrive.</p>
				{:else if bot.expectedWebhookUrl}
					<p class="tg-bot__meta tg-bot__meta--mono">{bot.expectedWebhookUrl}</p>
				{/if}
				<div class="tg-bot__actions">
					<button
						type="button"
						class="tg-btn tg-btn--primary"
						onclick={() => void onSync(bot)}
						disabled={saving || !bot.webhookBaseConfigured}
					>
						Register webhook
					</button>
					<button
						type="button"
						class="tg-btn tg-btn--ghost"
						onclick={() => void onToggle(bot)}
						disabled={saving}
					>
						{bot.status === 'active' ? 'Pause' : 'Activate'}
					</button>
					<button
						type="button"
						class="tg-btn tg-btn--ghost"
						onclick={() => void onRemove(bot)}
						disabled={saving}
					>
						Delete
					</button>
				</div>
			</article>
		{/each}
	{/if}
</section>
