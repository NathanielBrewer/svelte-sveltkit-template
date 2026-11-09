import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { isHttpError } from '@sveltejs/kit';
import { load as loadPage } from '../routes/[pageSlug]/+page.ts';
import { load as loadPortfolio } from '../routes/portfolio/[portfolioSlug]/+page.ts';
import Page from '../routes/[pageSlug]/+page.svelte';
import Portfolio from '../routes/portfolio/[portfolioSlug]/+page.svelte';
import Portfolios from '../routes/portfolios/+page.svelte';
import Contact from '../routes/contact/+page.svelte';

const pageEvent = (pageSlug: string) =>
	({ params: { pageSlug } }) as Parameters<typeof loadPage>[0];
const portfolioEvent = (portfolioSlug: string) =>
	({ params: { portfolioSlug } }) as Parameters<typeof loadPortfolio>[0];

describe('example routes', () => {
	it('loads and renders configured pages', async () => {
		const data = await loadPage(pageEvent('about'));
		render(Page, { data });
		expect(screen.getByRole('heading', { name: 'About' })).toBeTruthy();
	});

	it('loads and renders portfolio details', async () => {
		const data = await loadPortfolio(portfolioEvent('example'));
		render(Portfolio, { data });
		expect(screen.getByRole('heading', { name: 'Example portfolio' })).toBeTruthy();
	});

	it('returns 404 for missing pages and portfolios', () => {
		for (const missing of [
			() => loadPage(pageEvent('missing')),
			() => loadPortfolio(portfolioEvent('missing'))
		]) {
			expect(() => missing()).toThrow();
			try {
				missing();
			} catch (error) {
				expect(isHttpError(error, 404)).toBe(true);
			}
		}
	});

	it('lists working portfolio links', () => {
		render(Portfolios);
		expect(screen.getByRole('link', { name: 'Example portfolio' }).getAttribute('href')).toBe(
			'/portfolio/example'
		);
	});

	it('renders the static contact route', () => {
		render(Contact);
		expect(screen.getByRole('heading', { name: 'Contact' })).toBeTruthy();
	});
});
