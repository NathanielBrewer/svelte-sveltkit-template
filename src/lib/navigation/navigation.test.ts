import { describe, expect, it } from 'vitest';
import { isActiveItem, isCurrentPath, normalizePath } from './navigation.ts';

describe('navigation route matching', () => {
	it('normalizes trailing slashes without confusing home with every route', () => {
		expect(normalizePath('///')).toBe('/');
		expect(isCurrentPath('/about', '/about/')).toBe(true);
		expect(isActiveItem({ label: 'Home', href: '/' }, '/about')).toBe(false);
	});

	it('matches nested routes on segment boundaries', () => {
		const item = { label: 'About', href: '/about' };
		expect(isActiveItem(item, '/about/team')).toBe(true);
		expect(isActiveItem(item, '/about-us')).toBe(false);
	});

	it('matches dropdown children that live under a different route prefix', () => {
		const item = {
			label: 'Portfolios',
			href: '/portfolios',
			children: [{ label: 'Example', href: '/portfolio/example' }]
		};
		expect(isActiveItem(item, '/portfolios')).toBe(true);
		expect(isActiveItem(item, '/portfolio/example')).toBe(true);
		expect(isActiveItem(item, '/contact')).toBe(false);
	});
});
