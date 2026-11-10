<script lang="ts">
	import type { PageBlock } from '../types.ts';
	let { block }: { block: PageBlock } = $props();
</script>

{#if block.type === 'plans'}
	<section id={block.id} class="space-y-5">
		<h2 class="h2">{block.title}</h2>
		{#if block.description}<p>{block.description}</p>{/if}
		<div class="grid gap-4 md:grid-cols-2">
			{#each block.items as item (item.id)}
				<article id={item.id} class="content-panel space-y-4">
					<h3 class="h3">{item.name}</h3>
					<p class="font-semibold">{item.price}</p>
					<p>{item.summary}</p>
					<ul class="list-disc space-y-2 pl-5">
						{#each item.features as feature}<li>{feature}</li>{/each}
					</ul>
				</article>
			{/each}
		</div>
	</section>
{/if}
