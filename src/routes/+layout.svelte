<script lang="ts">
	import '../app.postcss';
	import { page } from '$app/state';
	import SiteNavigation from '#lib/components/SiteNavigation.svelte';
	import { navigation } from '#lib/site.ts';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<a class="skip-link" href="#main-content">Skip to content</a>
<SiteNavigation items={navigation} pathname={page.url.pathname} navigationKey={page.url.href} />
<main id="main-content" tabindex="-1">
	{@render children()}
</main>

<style>
	.skip-link {
		position: fixed;
		top: 0.5rem;
		left: 0.5rem;
		z-index: 100;
		transform: translateY(-200%);
		padding: 0.75rem;
		background: white;
	}
	.skip-link:focus {
		transform: translateY(0);
	}
</style>
