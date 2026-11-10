// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare module '*.postcss';

declare namespace App {
	// interface Locals {}
	// interface PageData {}
	// interface Error {}
	// interface Platform {}
}

declare const __TEMPLATE_THEME_OPTIONS__: { id: string; label: string }[];
declare const __TEMPLATE_DEFAULT_THEME__: string;
declare const __TEMPLATE_BRAND__: string;
declare const __SENTRY_DSN__: string;
declare module 'virtual:template-blocks' {
	import type { Component } from 'svelte';
	const loaders: Record<string, Component<{ block: import('#lib/content/types.ts').PageBlock }>>;
	export default loaders;
}

declare module 'virtual:template-content' {
	const pages: import('#lib/content/types.ts').PageDefinition[];
	export default pages;
}
