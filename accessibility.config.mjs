export default {
	viewports: [
		{ width: 1440, height: 900 },
		{ width: 390, height: 844 }
	],
	routes: ['/', '/about', '/contact', '/portfolios', '/portfolio/example'],
	// Audits run after these states are opened on the home route.
	navigation: { mobileToggle: '.menu-toggle', dropdown: '[data-dropdown]' }
};
