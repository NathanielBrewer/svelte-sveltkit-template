<script lang="ts">
	import type { createNotifications } from './notifications.ts';
	let { store }: { store: ReturnType<typeof createNotifications> } = $props();
</script>

<div data-template-component="notifications" aria-live="polite" aria-label="Notifications">
	{#each $store as notice (notice.id)}<div
			class="content-panel my-2"
			role={notice.tone === 'error' ? 'alert' : 'status'}
		>
			<p>{notice.message}</p>
			<button
				type="button"
				class="btn variant-soft-surface"
				aria-label={`Dismiss ${notice.message}`}
				onclick={() => store.dismiss(notice.id)}>Dismiss</button
			>
		</div>{/each}
</div>
