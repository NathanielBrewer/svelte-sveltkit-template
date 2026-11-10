import config from '../template.config.mjs';
import allPages from '../content/pages.json' with { type: 'json' };
import palettes from '../themes/presets.json' with { type: 'json' };

export const themeOptions = config.themes.map((id) => {
	if (!Object.hasOwn(palettes, id)) throw new Error(`Unknown theme: ${id}`);
	return {
		id,
		label:
			id === 'template-theme'
				? 'Template'
				: id
						.replace('stats-', '')
						.split('-')
						.map((word) => word[0].toUpperCase() + word.slice(1))
						.join(' ')
	};
});
if (!config.themes.includes(config.defaultTheme))
	throw new Error('Default theme must be included in themes');
if (new Set(config.themes).size !== config.themes.length) throw new Error('Duplicate theme IDs');
const blockFiles = { hero: 'Hero', plans: 'PlanList', faq: 'Faq' };
const pages = config.pages.map((slug) => {
	const page = allPages.find((entry) => entry.slug === slug);
	if (!page) throw new Error(`Unknown page: ${slug}`);
	return page;
});
const usedBlocks = [...new Set(pages.flatMap((page) => page.blocks.map((block) => block.type)))];
for (const type of usedBlocks)
	if (!Object.hasOwn(blockFiles, type)) throw new Error(`Unknown block: ${type}`);
export function templateBlocks() {
	return {
		name: 'template-blocks',
		resolveId(id) {
			if (['virtual:template-blocks', 'virtual:template-content'].includes(id)) return '\0' + id;
		},
		load(id) {
			if (id === '\0virtual:template-content') return `export default ${JSON.stringify(pages)};`;
			if (id !== '\0virtual:template-blocks') return;
			return (
				usedBlocks
					.map(
						(type) =>
							`import ${blockFiles[type]} from '/src/lib/content/blocks/${blockFiles[type]}.svelte';`
					)
					.join('\n') +
				`\nexport default {${usedBlocks.map((type) => `${JSON.stringify(type)}: ${blockFiles[type]}`).join(',')}};`
			);
		}
	};
}
