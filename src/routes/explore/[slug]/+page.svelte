<script lang="ts">
	import PageShell from '#lib/content/PageShell.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<PageShell page={data.page} />
