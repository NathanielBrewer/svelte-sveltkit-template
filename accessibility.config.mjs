import template from './template.config.mjs';
export default {
	viewports: [
		{ width: 1440, height: 900 },
		{ width: 390, height: 844 }
	],
	themes: template.themes,
	routes: [
		'/',
		'/about',
		'/contact',
		'/portfolios',
		'/portfolio/example',
		'/explore',
		...template.pages.map((slug) => `/explore/${slug}`)
	],
	// Audits run after these states are opened on the home route.
	navigation: { mobileToggle: '.menu-toggle', dropdown: '[data-dropdown]' }
};
