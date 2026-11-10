import examples from 'virtual:template-content';
import type { NavigationItem } from '#lib/navigation/navigation.ts';

export const pages = [
	{
		slug: 'about',
		title: 'About',
		description: 'Replace this example with information about your project.'
	}
];

export const portfolios = [
	{
		slug: 'example',
		title: 'Example portfolio',
		description: 'Replace this example with a project, collection, or portfolio.'
	}
];

export const navigation: NavigationItem[] = [
	{
		label: 'Explore',
		href: '/explore',
		children: [
			{ label: 'All examples', href: '/explore' },
			...examples.map((page) => ({ label: page.title, href: `/explore/${page.slug}` }))
		]
	},
	{
		label: 'Portfolios',
		href: '/portfolios',
		children: [
			{ label: 'All portfolios', href: '/portfolios' },
			...portfolios.map((item) => ({ label: item.title, href: `/portfolio/${item.slug}` }))
		]
	},
	...pages.map((page) => ({ label: page.title, href: `/${page.slug}` })),
	{ label: 'Contact', href: '/contact' }
];
