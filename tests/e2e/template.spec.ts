import { test, expect } from '@playwright/test';
import config from '../../template.config.mjs';

test('navigation, example content, theme persistence, and browser history', async ({
	page,
	isMobile
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	const nav = page.getByRole('navigation', { name: 'Primary' });
	async function openMenu() {
		if (isMobile) await nav.getByRole('button', { name: 'Open menu' }).click();
	}
	await openMenu();
	await nav.getByRole('button', { name: 'Explore' }).click();
	await nav.getByRole('link', { name: 'Website support', exact: true }).click();
	await expect(page).toHaveURL(/\/explore\/website-support$/);
	await expect(page.getByRole('heading', { name: 'Support plans' })).toBeVisible();
	await page
		.getByText('Can these blocks describe something other than services?', { exact: true })
		.click();
	await expect(
		page.getByText('Yes. Use the same page definitions', { exact: false })
	).toBeVisible();
	await page
		.getByRole('navigation', { name: 'On this page' })
		.getByRole('link', { name: 'Support plans' })
		.click();
	await expect(page).toHaveURL(/#plans$/);
	await openMenu();
	await nav.getByRole('link', { name: 'Contact', exact: true }).click();
	await expect(page).toHaveURL(/\/contact$/);
	await page.goBack();
	await expect(page.getByRole('heading', { name: 'Website support', level: 1 })).toBeVisible();
	const picker = page.getByLabel('Style preset', { exact: true });
	for (const id of config.themes) {
		await picker.selectOption(id);
		await expect(page.locator('body')).toHaveAttribute('data-theme', id);
	}
	await page.reload();
	await expect(page.locator('body')).toHaveAttribute('data-theme', config.themes.at(-1)!);
	await expect
		.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
		.toBe(true);
	expect(errors).toEqual([]);
});

test('direct routes and missing content return correct HTTP responses', async ({
	page,
	request
}) => {
	await page.goto('/explore/team-support');
	await expect(page.getByRole('heading', { name: 'Small team support', level: 1 })).toBeVisible();
	for (const path of ['/missing', '/portfolio/missing', '/explore/missing'])
		expect((await request.get(path)).status()).toBe(404);
});
