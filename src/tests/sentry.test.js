import { describe, expect, it, vi } from 'vitest';
const sdk = vi.hoisted(() => ({ init: vi.fn(), captureException: vi.fn(() => 'event-id') }));
vi.mock('@sentry/sveltekit', () => sdk);
import { initialize, capture } from '#lib/observability/sentry.ts';
describe('optional Sentry adapter', () => {
	it('initializes once, strips request data and suppresses log collection', () => {
		initialize();
		initialize();
		expect(sdk.init).toHaveBeenCalledTimes(1);
		const options = sdk.init.mock.calls[0][0];
		expect(options.dataCollection.userInfo).toBe(false);
		expect(options.beforeSendLog({})).toBeNull();
		const event = options.beforeSend({
			user: { id: 'person' },
			breadcrumbs: [{ message: 'secret' }],
			request: {
				url: 'https://example.test/?token=x',
				headers: { cookie: 'secret' },
				data: 'private'
			},
			extra: { token: 'secret', count: 1 }
		});
		expect(event).toEqual({ request: { url: 'https://example.test/' }, extra: { count: 1 } });
		expect(capture(new Error('Example'), { path: '/' })).toBe('event-id');
	});
});
