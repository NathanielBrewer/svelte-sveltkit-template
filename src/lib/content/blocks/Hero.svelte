<script lang="ts">
	import type { PageBlock } from '../types.ts';
	let { block }: { block: PageBlock } = $props();
</script>

{#if block.type === 'hero'}
	<section id={block.id} class="content-panel space-y-5">
		{#if block.eyebrow}<p class="text-sm font-semibold uppercase tracking-wide">
				{block.eyebrow}
			</p>{/if}
		<h1 class="h1">{block.title}</h1>
		<p class="max-w-3xl leading-7">{block.summary}</p>
		{#if block.actions?.length}<ul class="flex flex-wrap gap-3">
				{#each block.actions as action (action.href)}<li>
						<a class="btn variant-filled-primary" href={action.href}>{action.label}</a>
					</li>{/each}
			</ul>{/if}
	</section>
{/if}
