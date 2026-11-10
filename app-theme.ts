import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';
import palettes from './themes/presets.json';
import config from './template.config.mjs';

export const appThemes: CustomThemeConfig[] = config.themes.map((id: string) => {
	const preset = palettes[id as keyof typeof palettes];
	if (!preset) throw new Error(`Unknown theme: ${id}`);
	return preset;
});
export const appTheme = appThemes.find((theme) => theme.name === config.defaultTheme)!;
