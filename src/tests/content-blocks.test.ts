import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import examples from 'virtual:template-content';
import PageShell from '#lib/content/PageShell.svelte';
import Explore from '../routes/explore/+page.svelte';
import Detail from '../routes/explore/[slug]/+page.svelte';
import { load } from '../routes/explore/[slug]/+page.ts';

describe('configurable content pages', () => {
	it.each(examples)('renders $title with its configured sections', (page) => {
		render(PageShell, { page });
		expect(screen.getByRole('heading', { level: 1, name: page.title })).toBeTruthy();
		for (const block of page.blocks)
			expect(
				screen
					.getByRole('navigation', { name: 'On this page' })
					.querySelector(`a[href="#${block.id}"]`)
			).toBeTruthy();
	});
	it('provides listing links and detail data from the same registry', async () => {
		render(Explore);
		expect(screen.getByRole('link', { name: 'Website support' }).getAttribute('href')).toBe(
			'/explore/website-support'
		);
		const data = await load({ params: { slug: 'website-support' } } as Parameters<typeof load>[0]);
		render(Detail, { data });
		expect(screen.getByRole('heading', { name: 'Support plans' })).toBeTruthy();
		expect(() => load({ params: { slug: 'unknown' } } as Parameters<typeof load>[0])).toThrow();
	});
});
