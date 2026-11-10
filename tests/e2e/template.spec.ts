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

test('contact validates, preserves a failed message, and resets after acceptance', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/contact?contactSubject=Custom%20question');
	await expect(page.getByLabel('Subject', { exact: true })).toHaveValue('Custom question');
	await page.getByRole('button', { name: 'Send message' }).click();
	await expect(page.getByLabel('Name', { exact: true })).toBeFocused();
	await page.getByLabel('Name', { exact: true }).fill('Example');
	await page.getByLabel('Email', { exact: true }).fill('person@example.test');
	await page.getByLabel('Message', { exact: true }).fill('A sample question');
	let attempt = 0;
	await page.route('**/api/contact', async (route) => {
		const body = route.request().postDataJSON();
		expect(body.subject).toBe('Custom question');
		expect(body.website).toBe('');
		await route.fulfill({ status: attempt++ ? 200 : 502, json: { message: 'Example response' } });
	});
	await page.getByRole('button', { name: 'Send message' }).click();
	await expect(page.getByRole('status')).toContainText('could not be sent');
	await expect(page.getByLabel('Message', { exact: true })).toHaveValue('A sample question');
	await page.getByRole('button', { name: 'Send message' }).click();
	await expect(page.getByRole('status')).toContainText('Message received');
	await expect(page.getByLabel('Message', { exact: true })).toHaveValue('');
	await expect(page.getByLabel('Subject', { exact: true })).toHaveValue('Custom question');
	expect(errors).toEqual([]);
});

test('unconfigured contact delivery fails explicitly in the production server', async ({
	request
}) => {
	const result = await request.post('/api/contact', {
		data: { name: 'Example', email: 'person@example.test', subject: 'Question', message: 'Hello' }
	});
	expect(result.status()).toBe(503);
	expect((await result.json()).message).toContain('unavailable');
});
