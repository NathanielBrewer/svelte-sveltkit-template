import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import {
	sanitizeTheme,
	readTheme,
	applyTheme,
	themeOptions,
	storageKey,
	defaultTheme
} from './preferences.ts';
import ThemeSwitcher from '#lib/components/ThemeSwitcher.svelte';
afterEach(() => {
	localStorage.clear();
	document.body.dataset.theme = defaultTheme;
	vi.restoreAllMocks();
});
describe('theme preferences', () => {
	it('accepts only configured presets and falls back for corrupt/removed values', () => {
		for (const option of themeOptions) expect(sanitizeTheme(option.id)).toBe(option.id);
		expect(sanitizeTheme('bad')).toBe(defaultTheme);
		expect(
			readTheme({
				getItem: () => {
					throw Error('storage disabled');
				}
			})
		).toBe(defaultTheme);
	});
	it('switches and persists a selected configuration', async () => {
		render(ThemeSwitcher);
		const next = themeOptions[1].id;
		await fireEvent.change(screen.getByRole('combobox', { name: 'Style preset' }), {
			target: { value: next }
		});
		expect(document.body.dataset.theme).toBe(next);
		expect(localStorage.getItem(storageKey)).toBe(next);
		expect(readTheme(localStorage)).toBe(next);
	});
	it('still changes the current page when storage writes fail', () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw Error('unavailable');
		});
		applyTheme(themeOptions[1].id);
		expect(document.body.dataset.theme).toBe(themeOptions[1].id);
	});
});
