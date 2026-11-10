import type { HandleClientError } from '@sveltejs/kit/hooks';
import { initialize } from '#telemetry';
import { reportError } from '#lib/observability/logger.ts';
initialize();
export const handleError: HandleClientError = ({ kind, error, event }) => {
	if (kind !== 'unknown') return error;
	const errorId = reportError(error, { path: event.url.pathname, runtime: 'browser' });
	return { message: 'An unexpected error occurred.', errorId };
};
