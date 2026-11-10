<script lang="ts">
	import { onDestroy, type Snippet } from 'svelte';
	let {
		title,
		triggerLabel,
		children
	}: { title: string; triggerLabel: string; children?: Snippet } = $props();
	const id = $props.id();
	let dialog: HTMLDialogElement;
	let trigger: HTMLButtonElement;
	let previousOverflow: string | undefined;
	function open() {
		previousOverflow = document.body.style.overflow;
		dialog.showModal();
		document.body.style.overflow = 'hidden';
	}
	function restore() {
		if (previousOverflow !== undefined) {
			document.body.style.overflow = previousOverflow;
			previousOverflow = undefined;
			trigger?.focus();
		}
	}
	onDestroy(() => {
		if (typeof document !== 'undefined') restore();
	});
</script>

<button class="btn variant-filled-primary" type="button" bind:this={trigger} onclick={open}
	>{triggerLabel}</button
>
<dialog
	data-template-component="modal"
	bind:this={dialog}
	aria-labelledby={id}
	onclose={restore}
	onclick={(event) => {
		if (event.target === dialog) dialog.close();
	}}
	onkeydown={(event) => {
		if (event.key === 'Escape') dialog.close();
	}}
>
	<h2 {id} class="h2">{title}</h2>
	<div class="my-4">{@render children?.()}</div>
	<button class="btn variant-soft-surface" type="button" onclick={() => dialog.close()}
		>Close</button
	>
</dialog>

<style>
	dialog {
		width: min(36rem, 90vw);
		max-height: 85dvh;
		overflow: auto;
		padding: 2rem;
		color: rgb(var(--color-surface-900));
		background: rgb(var(--color-surface-50));
		border: 1px solid rgb(var(--color-surface-300));
		border-radius: var(--theme-rounded-container);
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 55%);
	}
</style>
