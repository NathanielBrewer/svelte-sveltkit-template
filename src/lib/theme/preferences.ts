export type ThemeOption = { id: string; label: string };
export const themeOptions: ThemeOption[] = __TEMPLATE_THEME_OPTIONS__;
export const defaultTheme: string = __TEMPLATE_DEFAULT_THEME__;
export const storageKey = 'template.theme.v1';

export function sanitizeTheme(value: unknown): string {
	return themeOptions.some((option) => option.id === value) ? (value as string) : defaultTheme;
}

export function readTheme(storage: Pick<Storage, 'getItem'>): string {
	try {
		return sanitizeTheme(storage.getItem(storageKey));
	} catch {
		return defaultTheme;
	}
}

export function applyTheme(value: string): void {
	const theme = sanitizeTheme(value);
	document.body.dataset.theme = theme;
	try {
		localStorage.setItem(storageKey, theme);
	} catch {
		/* Current-page selection still works. */
	}
}
