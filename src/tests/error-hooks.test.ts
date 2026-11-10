import { describe, expect, it, vi } from 'vitest';
import { handleError as client } from '../hooks.client.ts';
import { handleError as server } from '../hooks.server.ts';
describe('runtime error hooks', () => {
	it('logs unexpected errors without exposing internal messages to visitors', async () => {
		const output = vi.spyOn(console, 'error').mockImplementation(() => {});
		const event = { url: new URL('https://example.test/about?token=private') };
		const result = await client({
			kind: 'unknown',
			error: Error('Unexpected password=private'),
			event
		} as Parameters<typeof client>[0]);
		expect(result?.message).toBe('An unexpected error occurred.');
		await server({ kind: 'unknown', error: Error('Server failed'), event } as Parameters<
			typeof server
		>[0]);
		expect(output).toHaveBeenCalledTimes(2);
		expect(JSON.stringify(output.mock.calls)).not.toContain('private');
		output.mockRestore();
	});
	it('does not report expected 404s as unexpected failures', async () => {
		const output = vi.spyOn(console, 'error').mockImplementation(() => {});
		const caught = {
			kind: 'framework',
			error: { status: 404, message: 'Not found' },
			event: { url: new URL('https://example.test/missing') }
		};
		expect(await server(caught as Parameters<typeof server>[0])).toEqual(caught.error);
		expect(await client(caught as Parameters<typeof client>[0])).toEqual(caught.error);
		expect(output).not.toHaveBeenCalled();
		output.mockRestore();
	});
});
