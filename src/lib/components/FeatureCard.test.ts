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
});
