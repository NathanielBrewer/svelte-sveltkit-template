import type { Config } from 'tailwindcss';
import { skeleton } from '@skeletonlabs/tw-plugin';
import { appThemes } from './app-theme';

export default {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		...(process.env.TEMPLATE_ACCESSIBILITY ? ['./scripts/accessibility/fixture.html'] : []),
		'./node_modules/@skeletonlabs/skeleton/**/*.{html,js,svelte,ts}'
	],
	theme: {},
	plugins: [
		skeleton({
			themes: {
				custom: appThemes
			}
		})
	]
} satisfies Config;
