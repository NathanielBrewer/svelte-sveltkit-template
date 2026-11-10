import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrub, scrubText } from './privacy.ts';
import { reportError, log } from './logger.ts';
import { initialize, capture } from './disabled.ts';
afterEach(() => vi.restoreAllMocks());
describe('structured logging privacy', () => {
	it('removes credentials and personal fields recursively', () => {
		expect(
			scrub({
				token: 'secret',
				nested: { password: 'x', path: 'https://example.test/contact?token=x#secret' },
				email: 'a@example.com'
			})
		).toEqual({ nested: { path: 'https://example.test/contact' } });
		expect(scrubText('Bearer abc123 token=abc contact a@example.com')).not.toMatch(
			/abc123|token=abc|a@example/
		);
		const circular: Record<string, unknown> = {};
		circular.self = circular;
		expect(JSON.stringify(scrub(circular))).toContain('truncated');
		expect(scrub(new Error('secret=hello'))).toEqual({
			name: 'Error',
			message: 'secret=[redacted]'
		});
		expect(scrub(['https://a.test/?token=x', 3])).toEqual(['https://a.test/', 3]);
	});
	it('writes sanitized JSON and keeps reporting operational without a DSN', () => {
		const output = vi.spyOn(console, 'error').mockImplementation(() => {});
		const info = vi.spyOn(console, 'info').mockImplementation(() => {});
		expect(
			reportError(new Error('password=secret'), { authorization: 'abc', path: '/about' })
		).toBeUndefined();
		expect(JSON.parse(output.mock.calls[0][0])).toMatchObject({
			level: 'error',
			message: 'password=[redacted]',
			context: { path: '/about' }
		});
		expect(JSON.parse(output.mock.calls[0][0]).context.stack).toContain('password=[redacted]');
		log('info', 'Loaded', { count: 1 });
		expect(info).toHaveBeenCalled();
		initialize();
		expect(capture(new Error('test'), {})).toBeUndefined();
	});
});
