// Build choices: excluded themes/blocks never enter the generated browser modules.
const config = {
	brand: 'Starter template',
	defaultTheme: 'template-theme',
	themes: [
		'template-theme',
		'stats-command-iris',
		'stats-mustard-shift',
		'stats-plum-vector',
		'stats-flat-plum'
	],
	pages: ['website-support', 'team-support']
};

if (process.env.TEMPLATE_THEMES) {
	config.themes = process.env.TEMPLATE_THEMES.split(',')
		.map((id) => id.trim())
		.filter(Boolean);
	config.defaultTheme = config.themes[0];
}
if (process.env.TEMPLATE_PAGES !== undefined)
	config.pages = process.env.TEMPLATE_PAGES.split(',')
		.map((slug) => slug.trim())
		.filter(Boolean);
export default config;
