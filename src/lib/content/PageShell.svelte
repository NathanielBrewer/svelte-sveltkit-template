<script lang="ts">
	import blocks from 'virtual:template-blocks';
	import type { PageDefinition } from './types.ts';
	let { page }: { page: PageDefinition } = $props();
</script>

<svelte:head
	><title>{page.title} | Starter template</title><meta
		name="description"
		content={page.description}
	/></svelte:head
>
<div class="mx-auto w-full max-w-6xl space-y-10 px-6 py-12">
	<nav aria-label="On this page">
		<ul class="flex flex-wrap gap-4">
			{#each page.blocks as block (block.id)}<li>
					<a class="anchor" href={`#${block.id}`}>{block.title}</a>
				</li>{/each}
		</ul>
	</nav>
	{#each page.blocks as block (block.id)}
		{@const Block = blocks[block.type]}
		<Block {block} />
	{/each}
</div>
