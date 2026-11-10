# Logging and error reporting

`src/lib/observability/logger.ts` provides structured JSON console logging and error reporting for browser and server code. SvelteKit error hooks report unexpected errors and return a generic visitor-facing message. Expected framework/application errors such as 404s keep their public message and are not logged as unexpected failures.

```ts
import { log, reportError } from '#lib/observability/logger.ts';

log('info', 'Import completed', { count: 12 });
try {
	// Perform application work.
} catch (error) {
	const errorId = reportError(error, { operation: 'import', path: '/imports' });
	// Show an appropriate message or propagate the failure; do not silently claim success.
}
```

## Enable Sentry

Copy `.env.example` to a local environment file and supply your own project's `PUBLIC_SENTRY_DSN`. The DSN is a public ingestion address, not a secret auth token. Rebuild after changing it. With no DSN, Vite resolves `#telemetry` to the no-op adapter: JSON console logs still work and the Sentry SDK is absent from production chunks. With a DSN, browser and server builds use `@sentry/sveltekit`.

The integration focuses on exceptions. It disables tracing/replay sampling, drops Sentry log events, excludes user information, cookies, headers, request bodies and query parameters, and removes breadcrumbs. This follows the explicit privacy controls in NB Plants, adapted to Sentry 11's `dataCollection` API. Structured console logs are not automatically forwarded wholesale to Sentry. Use `reportError` for operational failures; do not send normal form contents or customer records as context.

The shared scrubber removes common credential/personal field names recursively, redacts common token/email patterns, strips URL queries/fragments, limits depth, and bounds strings/arrays. This is defense in depth, not a guarantee that arbitrary free-form messages contain no sensitive data. Prefer operation names, counts, route templates and IDs that contain no personal data. Do not log passwords, request bodies, payment details or access tokens.

Tests mock the SDK to verify options, scrubbing, disabled operation and hooks. The build matrix verifies both SDK inclusion and exclusion using a loopback DSN. Live event delivery requires a real project and has not been proven by these local checks. In your own test environment, report a controlled error, record the event ID, and confirm the event and its sanitized payload in Sentry before treating monitoring as operational. Source-map upload, release association, alert rules, retention and hosting log collection are deployment-specific setup; no Sentry auth token, replay, billing configuration or remote project changes are included here.
