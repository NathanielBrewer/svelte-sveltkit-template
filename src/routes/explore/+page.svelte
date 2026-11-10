<script lang="ts">
	import examples from 'virtual:template-content';
	import ContentPage from '#lib/components/ContentPage.svelte';
</script>

<ContentPage title="Explore" description="Example pages composed from reusable content blocks." />
<ul class="mx-auto grid w-full max-w-6xl gap-4 px-6 pb-12 md:grid-cols-2">
	{#each examples as item (item.slug)}<li class="content-panel">
			<h2 class="h3"><a class="anchor" href={`/explore/${item.slug}`}>{item.title}</a></h2>
			<p class="mt-3">{item.description}</p>
		</li>{/each}
</ul>
