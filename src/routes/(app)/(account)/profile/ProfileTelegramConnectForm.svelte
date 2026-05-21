<script lang="ts">
	import type { ChatModelLite } from '$lib/client/profileTelegramBotsApi';

	let {
		name = $bindable(''),
		token = $bindable(''),
		defaultModelId = $bindable('qwen/qwen3.5-flash-02-23'),
		dailyMessageLimit = $bindable(500),
		models,
		loading,
		saving,
		onConnect
	} = $props<{
		name?: string;
		token?: string;
		defaultModelId?: string;
		dailyMessageLimit?: number;
		models: ChatModelLite[];
		loading: boolean;
		saving: boolean;
		onConnect: () => void | Promise<void>;
	}>();
</script>

<div class="tg-panel">
	<h3 class="tg-subhead">Connect a bot</h3>
	<div class="tg-form">
		<label class="tg-field tg-field--wide">
			<span class="tg-label">Bot name</span>
			<input class="tg-control" placeholder="Support Bot" bind:value={name} />
		</label>
		<label class="tg-field tg-field--wide">
			<span class="tg-label">BotFather token</span>
			<input
				class="tg-control"
				placeholder="Paste token once — stored encrypted"
				bind:value={token}
				type="password"
				autocomplete="off"
			/>
		</label>
		<label class="tg-field">
			<span class="tg-label">AI model</span>
			<select class="tg-control" bind:value={defaultModelId} disabled={loading}>
				{#if models.length === 0}
					<option value="qwen/qwen3.5-flash-02-23">Qwen 3.5 Flash</option>
				{:else}
					{#each models as model (model.id)}
						<option value={model.id}>{model.name}</option>
					{/each}
				{/if}
			</select>
		</label>
		<label class="tg-field">
			<span class="tg-label">Daily message limit</span>
			<input class="tg-control" type="number" min="10" step="10" bind:value={dailyMessageLimit} />
		</label>
		<div class="tg-form__actions">
			<button
				type="button"
				class="tg-btn tg-btn--primary"
				onclick={() => void onConnect()}
				disabled={saving || loading}
			>
				{saving ? 'Connecting…' : 'Connect bot'}
			</button>
		</div>
	</div>
</div>
