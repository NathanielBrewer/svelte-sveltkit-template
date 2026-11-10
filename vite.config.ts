import adapter from '@sveltejs/adapter-netlify';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import config from './template.config.mjs';
import { themeOptions, templateBlocks } from './scripts/template-options.mjs';

export default defineConfig(({ mode }) => {
	const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
	return {
		define: {
			__TEMPLATE_THEME_OPTIONS__: JSON.stringify(themeOptions),
			__TEMPLATE_DEFAULT_THEME__: JSON.stringify(config.defaultTheme),
			__TEMPLATE_BRAND__: JSON.stringify(config.brand),
			__SENTRY_DSN__: JSON.stringify(env.PUBLIC_SENTRY_DSN || '')
		},
		resolve: {
			alias: {
				'#telemetry': fileURLToPath(
					new URL(
						env.PUBLIC_SENTRY_DSN
							? './src/lib/observability/sentry.ts'
							: './src/lib/observability/disabled.ts',
						import.meta.url
					)
				)
			}
		},
		plugins: [
			templateBlocks(),
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
	};
});
