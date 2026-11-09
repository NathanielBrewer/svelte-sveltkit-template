<script lang="ts">
	let { title, description }: { title: string; description: string } = $props();
</script>

<svelte:head>
	<title>{title} | Starter template</title>
	<meta name="description" content={description} />
</svelte:head>

<section class="mx-auto w-full max-w-6xl space-y-6 px-6 py-16">
	<h1 class="h1">{title}</h1>
	<p class="max-w-3xl leading-7 text-surface-700">{description}</p>
</section>
