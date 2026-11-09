import { error } from '@sveltejs/kit';
import { portfolios } from '#lib/site.ts';
import type { PageLoad } from './$types';

export const load = (({ params }) => {
	const content = portfolios.find((portfolio) => portfolio.slug === params.portfolioSlug);
	if (!content) error(404, 'Portfolio not found');
	return { content };
}) satisfies PageLoad;
