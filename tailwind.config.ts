import type { Config } from 'tailwindcss';
import { skeleton } from '@skeletonlabs/tw-plugin';
import { appTheme } from './app-theme';

export default {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./scripts/accessibility/fixture.html',
		'./node_modules/@skeletonlabs/skeleton/**/*.{html,js,svelte,ts}'
	],
	theme: {},
	plugins: [
		skeleton({
			themes: {
				custom: [appTheme]
			}
		})
	]
} satisfies Config;
