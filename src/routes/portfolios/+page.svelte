<script lang="ts">
	import ContentPage from '#lib/components/ContentPage.svelte';
	import { portfolios } from '#lib/site.ts';
</script>

<ContentPage
	title="Portfolios"
	description="Browse the example collection, then replace it with your own content."
/>
<ul class="mx-auto w-full max-w-6xl space-y-4 px-6 pb-16">
	{#each portfolios as portfolio (portfolio.slug)}
		<li><a class="anchor" href={`/portfolio/${portfolio.slug}`}>{portfolio.title}</a></li>
	{/each}
</ul>
