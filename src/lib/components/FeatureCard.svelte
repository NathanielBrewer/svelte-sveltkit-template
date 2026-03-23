<script lang="ts">
	export let eyebrow = 'Included';
	export let title: string;
	export let description: string;
</script>

<article class="card variant-soft-surface h-full gap-4 p-6 shadow-sm">
	<p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">
		{eyebrow}
	</p>

	<div class="space-y-2">
		<h2 class="h4">{title}</h2>
		<p class="text-sm leading-6 text-surface-700">{description}</p>
	</div>
</article>
