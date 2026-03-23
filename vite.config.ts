import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		setupFiles: ['./vitest-setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			include: ['src/**/*.{svelte,ts}'],
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
