import * as Sentry from '@sentry/sveltekit';
import { scrub } from './privacy.ts';
let initialized = false;
export function initialize(): void {
	if (initialized) return;
	initialized = true;
	Sentry.init({
		dsn: __SENTRY_DSN__,
		dataCollection: {
			userInfo: false,
			cookies: false,
			httpHeaders: false,
			httpBodies: [],
			urlQueryParams: false
		},
		tracesSampleRate: 0,
		replaysSessionSampleRate: 0,
		replaysOnErrorSampleRate: 0,
		beforeSendLog: () => null,
		beforeSend(event) {
			delete event.user;
			delete event.breadcrumbs;
			if (event.request) event.request = { url: event.request.url?.split(/[?#]/)[0] };
			return scrub(event) as typeof event;
		}
	});
}
export function capture(error: Error, context: Record<string, unknown>): string | undefined {
	initialize();
	return Sentry.captureException(error, { extra: context });
}
