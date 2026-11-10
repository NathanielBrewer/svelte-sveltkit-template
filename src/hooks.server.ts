import type { HandleServerError, Handle } from '@sveltejs/kit/hooks';
import { initialize } from '#telemetry';
import { reportError } from '#lib/observability/logger.ts';
initialize();
export const handleError: HandleServerError = ({ kind, error, event }) => {
	if (kind !== 'unknown') return error;
	const errorId = reportError(error, { path: event.url.pathname, runtime: 'server' });
	return { message: 'An unexpected error occurred.', errorId };
};

export const handle: Handle = ({ event, resolve }) =>
	resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%template.theme%', __TEMPLATE_DEFAULT_THEME__)
	});
