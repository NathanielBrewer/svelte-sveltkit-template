import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import Page from '../routes/+page.svelte';

describe('route /', () => {
	it('renders the starter content', () => {
		render(Page);

		expect(
			screen.getByRole('heading', {
				name: 'SvelteKit template with Skeleton, TypeScript, linting, and unit tests.'
			})
		).toBeTruthy();
		expect(screen.getByRole('heading', { name: 'TypeScript-ready' })).toBeTruthy();
		expect(screen.getByRole('heading', { name: 'Suggested next steps' })).toBeTruthy();
	});
});
