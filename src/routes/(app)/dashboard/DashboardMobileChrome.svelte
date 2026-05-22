<script lang="ts">
	let {
		sidebarOpen,
		showMenuButton,
		onOpenSidebar,
		onCloseSidebar
	} = $props<{
		sidebarOpen: boolean;
		showMenuButton: boolean;
		onOpenSidebar: () => void;
		onCloseSidebar: () => void;
	}>();
</script>

{#if sidebarOpen}
	<button
		type="button"
		class="sidebar-backdrop"
		aria-label="Close menu"
		onclick={onCloseSidebar}
	></button>
{/if}

{#if showMenuButton}
	<button
		type="button"
		class="chat-main-menu-btn"
		aria-label="Open menu"
		title="Open menu"
		onclick={onOpenSidebar}
	>
		☰
	</button>
{/if}
