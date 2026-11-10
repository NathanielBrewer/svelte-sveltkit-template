import { error } from '@sveltejs/kit';
import examples from 'virtual:template-content';
import type { PageLoad } from './$types';
export const load = (({ params }) => {
	const page = examples.find((item) => item.slug === params.slug);
	if (!page) error(404, 'Page not found');
	return { page };
}) satisfies PageLoad;
