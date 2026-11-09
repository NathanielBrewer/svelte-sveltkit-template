import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import FeatureCard from './FeatureCard.svelte';

describe('FeatureCard', () => {
	it('renders the supplied content', () => {
		render(FeatureCard, {
			props: {
				title: 'TypeScript-ready',
				description: 'Strict typing is enabled out of the box.'
			}
		});

		expect(screen.getByText('Included')).toBeTruthy();
		expect(screen.getByRole('heading', { name: 'TypeScript-ready' })).toBeTruthy();
		expect(screen.getByText('Strict typing is enabled out of the box.')).toBeTruthy();
	});

	it('updates supplied content and supports a custom eyebrow', async () => {
		const { rerender } = render(FeatureCard, {
			props: { title: 'Original', description: 'Original description', eyebrow: 'Custom label' }
		});

		expect(screen.getByText('Custom label')).toBeTruthy();
		expect(screen.queryByText('Included')).toBeNull();

		await rerender({ title: 'Updated', description: 'Updated description' });

		expect(screen.getByRole('heading', { name: 'Updated' })).toBeTruthy();
		expect(screen.getByText('Updated description')).toBeTruthy();
		expect(screen.queryByRole('heading', { name: 'Original' })).toBeNull();
	});
});
