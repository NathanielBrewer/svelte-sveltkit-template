<script lang="ts">
	import FeatureCard from '#lib/components/FeatureCard.svelte';

	type Feature = {
		title: string;
		description: string;
	};

	const features: Feature[] = [
		{
			title: 'TypeScript-ready',
			description:
				'Strict TypeScript is enabled so new routes and components start from typed defaults.'
		},
		{
			title: 'Minimal dependencies',
			description: 'The clone-specific assets, routes, scripts, and extra packages are removed.'
		},
		{
			title: 'Theme-first styling',
			description: 'Skeleton stays in place with one custom theme file that is easy to rebrand.'
		},
		{
			title: 'Unit tests + coverage',
			description: 'Vitest and Testing Library are configured with V8 coverage thresholds.'
		}
	];

	const nextSteps = [
		'Replace this landing page with your first route or feature area.',
		'Adjust the palette and typography in app-theme.ts.',
		'Add component tests beside new files so coverage grows with the project.'
	];
</script>

<svelte:head>
	<title>SvelteKit Skeleton Template</title>
	<meta
		name="description"
		content="Minimal SvelteKit template with Skeleton, TypeScript, linting, and unit testing."
	/>
</svelte:head>

<div class="min-h-screen bg-surface-50 text-surface-900">
	<section class="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-16 lg:justify-center">
		<div class="space-y-6">
			<span class="badge variant-soft-primary">Starter template</span>

			<div class="space-y-4">
				<h1 class="h1 max-w-4xl">
					SvelteKit template with Skeleton, TypeScript, linting, and unit tests.
				</h1>

				<p class="max-w-3xl text-base leading-7 text-surface-700">
					The cloned website content has been replaced with a small baseline so you can build from
					clean defaults instead of inherited pages, data, and media.
				</p>
			</div>

			<div class="flex flex-wrap gap-3">
				<span class="badge variant-soft-surface">SvelteKit 3</span>
				<span class="badge variant-soft-surface">Skeleton theme tokens</span>
				<span class="badge variant-soft-surface">Vitest + coverage</span>
				<span class="badge variant-soft-surface">ESLint + Prettier</span>
			</div>
		</div>

		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			{#each features as feature}
				<FeatureCard {...feature} />
			{/each}
		</div>

		<section class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
			<article class="card variant-soft-primary gap-4 p-6 shadow-sm">
				<h2 class="h3">Suggested next steps</h2>

				<ul class="list-disc space-y-2 pl-5 text-sm leading-6">
					{#each nextSteps as step}
						<li>{step}</li>
					{/each}
				</ul>
			</article>

			<article class="card variant-soft-surface gap-4 p-6 shadow-sm">
				<h2 class="h4">Theme surface</h2>

				<p class="text-sm leading-6 text-surface-700">
					Update <code>app-theme.ts</code>, <code>tailwind.config.ts</code>, and
					<code>src/app.postcss</code> to reshape the template quickly.
				</p>

				<div class="flex flex-wrap gap-3">
					<a
						class="btn variant-filled-primary"
						href="https://kit.svelte.dev/docs/introduction"
						rel="noreferrer"
						target="_blank"
					>
						SvelteKit docs
					</a>
					<a
						class="btn variant-soft-secondary"
						href="https://www.skeleton.dev/"
						rel="noreferrer"
						target="_blank"
					>
						Skeleton docs
					</a>
				</div>
			</article>
		</section>
	</section>
</div>
