import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import SiteNavigation from './SiteNavigation.svelte';

const items = [
	{
		label: 'Portfolios',
		href: '/portfolios',
		children: [
			{ label: 'All portfolios', href: '/portfolios' },
			{ label: 'Example', href: '/portfolio/example' }
		]
	},
	{ label: 'About', href: '/about' },
	{ label: 'Contact', href: '/contact' }
];

function setup(pathname = '/') {
	return render(SiteNavigation, { items, pathname });
}

describe('SiteNavigation', () => {
	it('renders a home link and marks only the current page', () => {
		setup('/about/');
		expect(screen.getByRole('link', { name: 'Starter template home' }).getAttribute('href')).toBe(
			'/'
		);
		expect(screen.getByRole('link', { name: 'About' }).getAttribute('aria-current')).toBe('page');
		expect(screen.getByRole('link', { name: 'Contact' }).hasAttribute('aria-current')).toBe(false);
	});

	it('opens and toggles dropdowns and highlights a portfolio detail route', async () => {
		setup('/portfolio/example');
		const trigger = screen.getByRole('button', { name: 'Portfolios' });
		expect(trigger.closest('li')?.classList.contains('active')).toBe(true);
		await fireEvent.click(trigger);
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		expect(screen.getByRole('link', { name: 'Example' }).getAttribute('aria-current')).toBe('page');
		await fireEvent.click(trigger);
		expect(screen.queryByRole('link', { name: 'Example' })).toBeNull();
	});

	it('closes the dropdown then the mobile menu with Escape and restores focus', async () => {
		setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
		const trigger = screen.getByRole('button', { name: 'Portfolios' });
		await fireEvent.click(trigger);
		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(document.activeElement).toBe(trigger);
		expect(screen.queryByRole('link', { name: 'Example' })).toBeNull();
		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open menu' }));
	});

	it('closes menus on navigation, including query changes and browser history updates', async () => {
		const { rerender } = setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Portfolios' }));
		await rerender({ pathname: '/contact', navigationKey: '/contact?from=home' });
		expect(screen.getByRole('button', { name: 'Open menu' }).getAttribute('aria-expanded')).toBe(
			'false'
		);
		expect(screen.getByRole('link', { name: 'Contact' }).getAttribute('aria-current')).toBe('page');
		expect(screen.queryByRole('link', { name: 'Example' })).toBeNull();
	});

	it('closes menus on outside clicks and link selection', async () => {
		setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
		await fireEvent.pointerDown(document.body);
		expect(screen.getByRole('button', { name: 'Open menu' }).getAttribute('aria-expanded')).toBe(
			'false'
		);
		await fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
		const about = screen.getByRole('link', { name: 'About' });
		// The component test checks dismissal; Chromium audits handle real route navigation.
		about.addEventListener('click', (event) => event.preventDefault(), { once: true });
		await fireEvent.click(about);
		expect(screen.getByRole('button', { name: 'Open menu' }).getAttribute('aria-expanded')).toBe(
			'false'
		);
	});
});
