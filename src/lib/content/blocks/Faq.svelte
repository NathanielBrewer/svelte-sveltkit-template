<script lang="ts">
	import type { PageBlock } from '../types.ts';
	let { block }: { block: PageBlock } = $props();
</script>

{#if block.type === 'faq'}
	<section id={block.id} class="space-y-4">
		<h2 class="h2">{block.title}</h2>
		{#each block.items as item (item.question)}<details class="content-panel">
				<summary class="cursor-pointer font-semibold">{item.question}</summary>
				<p class="mt-4 leading-7">{item.answer}</p>
			</details>{/each}
	</section>
{/if}
