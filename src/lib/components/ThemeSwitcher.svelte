<script lang="ts">
	import { onMount } from 'svelte';
	import { themeOptions, defaultTheme, readTheme, applyTheme } from '#lib/theme/preferences.ts';
	let theme = $state(defaultTheme);
	onMount(() => {
		try {
			theme = readTheme(localStorage);
		} catch {
			theme = defaultTheme;
		}
		applyTheme(theme);
	});
</script>

{#if themeOptions.length > 1}
	<label class="theme-switcher"
		>Style preset
		<select aria-label="Style preset" bind:value={theme} onchange={() => applyTheme(theme)}>
			{#each themeOptions as option (option.id)}<option value={option.id}>{option.label}</option
				>{/each}
		</select>
	</label>
{/if}

<style>
	.theme-switcher {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}
	select {
		color: rgb(var(--color-surface-900));
		background: rgb(var(--color-surface-50));
		border: 1px solid rgb(var(--color-surface-500));
		border-radius: var(--theme-rounded-base);
		padding: 0.5rem;
		max-width: 100%;
	}
</style>
