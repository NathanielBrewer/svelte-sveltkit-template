import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({ adapter: adapter(), preprocess: [vitePreprocess()] }),
		svelteTesting(),
		{
			name: 'skeleton-css-minifier',
			apply: 'build',
			config() {
				// Apply after Kit's defaults to support Skeleton 2's CSS selectors.
				return { build: { cssMinify: 'esbuild' } };
			}
		}
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			include: ['src/**/*.{svelte,ts}', 'scripts/accessibility/source-controls.mjs'],
			exclude: ['src/app.d.ts', 'src/lib/index.ts', 'src/routes/+layout.svelte'],
			thresholds: {
				statements: 80,
				branches: 70,
				functions: 80,
				lines: 80
			}
		}
	}
});
