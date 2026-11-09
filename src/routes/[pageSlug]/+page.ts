import { error } from '@sveltejs/kit';
import { pages } from '#lib/site.ts';
import type { PageLoad } from './$types';

export const load = (({ params }) => {
	const content = pages.find((page) => page.slug === params.pageSlug);
	if (!content) error(404, 'Page not found');
	return { content };
}) satisfies PageLoad;
