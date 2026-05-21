<script lang="ts">
	import type { TelegramSetupInfo } from '$lib/client/profileTelegramBotsApi';

	let { setup } = $props<{ setup: TelegramSetupInfo }>();
</script>

<section class="tg-section" aria-labelledby="botfather-heading">
	<h3 id="botfather-heading" class="tg-section__title">BotFather setup</h3>
	<p class="tg-links">
		<a href={setup.docs.tutorial} target="_blank" rel="noreferrer">Tutorial</a>
		<span aria-hidden="true"> · </span>
		<a href={setup.docs.api} target="_blank" rel="noreferrer">Bot API</a>
		<span aria-hidden="true"> · </span>
		<a href={setup.docs.webhooks} target="_blank" rel="noreferrer">Webhooks</a>
	</p>
	<ol class="tg-steps">
		{#each setup.botFatherSteps as step (step)}<li>{step}</li>{/each}
	</ol>
</section>
