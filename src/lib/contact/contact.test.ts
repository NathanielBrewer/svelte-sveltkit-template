import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { contactLimits, contactFormName, parseContact } from './schema.ts';
import { contactEndpoint, sendContact } from '#lib/server/contact/netlify.ts';
import { POST } from '../../routes/api/contact/+server.ts';
const env = vi.hoisted(() => ({ CONTACT_PROVIDER: '', NETLIFY_FORMS_ENDPOINT: '' }));
vi.mock('$app/env/private', () => env);
const payload = {
	name: 'Example Person',
	email: 'person@example.test',
	subject: 'Question',
	message: 'Hello',
	context: 'Contact page',
	website: ''
};
afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	env.CONTACT_PROVIDER = '';
	env.NETLIFY_FORMS_ENDPOINT = '';
});
const call = (body: unknown = payload, headers: Record<string, string> = {}) =>
	POST({
		request: new Request('https://example.test/api/contact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...headers },
			body: JSON.stringify(body)
		}),
		url: new URL('https://example.test/api/contact')
	} as Parameters<typeof POST>[0]);

describe('contact validation and Netlify contract', () => {
	it('normalizes input and keeps the deployment blueprint in sync', () => {
		expect(parseContact({ ...payload, name: ' Example ' })?.name).toBe('Example');
		const html = readFileSync('static/contact-form.html', 'utf8');
		const names = [...html.matchAll(/name="([^"]+)"/g)].map((m) => m[1]);
		for (const field of Object.keys(contactLimits)) expect(names).toContain(field);
		expect(html).toContain(`form name="${contactFormName}"`);
		expect(html).toContain('data-netlify="true"');
		expect(html).toContain('netlify-honeypot="website"');
	});
	it.each([
		null,
		[],
		'bad',
		{},
		{ ...payload, name: 12 },
		{ ...payload, email: 'wrong' },
		{ ...payload, message: ' ' },
		...Object.entries(contactLimits).map(([field, limit]) => ({
			...payload,
			[field]: 'x'.repeat(limit + 1)
		}))
	])('rejects malformed or oversized input %#', (input) => expect(parseContact(input)).toBeNull());
	it('allows omitted optional fields', () => {
		const { name, email, subject, message } = payload;
		expect(parseContact({ name, email, subject, message })?.context).toBe('');
	});
	it('requires explicit configuration and an HTTPS deployment origin', () => {
		for (const value of [
			'',
			'bad',
			'http://localhost',
			'https://user:pass@example.test',
			'https://example.test/?key=x',
			'https://example.test/#x'
		])
			expect(
				contactEndpoint({ CONTACT_PROVIDER: 'netlify', NETLIFY_FORMS_ENDPOINT: value })
			).toBeNull();
		expect(contactEndpoint({ URL: 'https://example.test' })).toBeNull();
		for (const key of ['URL', 'DEPLOY_URL', 'NETLIFY_FORMS_ENDPOINT'])
			expect(
				contactEndpoint({ CONTACT_PROVIDER: 'netlify', [key]: 'https://example.test' })?.href
			).toBe('https://example.test/contact-form.html');
	});
	it('encodes all fields, bounds delivery time, and handles accepted redirects', async () => {
		for (const status of [200, 302, 303]) {
			const send = vi.fn().mockResolvedValue(new Response(null, { status }));
			await sendContact(
				{ ...payload, message: 'A & B + C' },
				new URL('https://example.test/contact-form.html'),
				send
			);
			const options = send.mock.calls[0][1];
			expect(new URLSearchParams(options.body).get('message')).toBe('A & B + C');
			expect(new URLSearchParams(options.body).get('form-name')).toBe(contactFormName);
			expect(options.redirect).toBe('manual');
			expect(options.signal).toBeInstanceOf(AbortSignal);
		}
		await expect(
			sendContact(
				payload,
				new URL('https://example.test'),
				vi.fn().mockResolvedValue(new Response(null, { status: 500 }))
			)
		).rejects.toThrow('Contact delivery failed');
	});
});
describe('contact API', () => {
	it('rejects invalid input, foreign origins, non-JSON and invalid JSON', async () => {
		expect((await call(null)).status).toBe(400);
		expect((await call(payload, { Origin: 'https://other.test' })).status).toBe(403);
		expect((await call(payload, { 'Content-Type': 'text/plain' })).status).toBe(415);
		const request = new Request('https://example.test/api/contact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: '{'
		});
		expect(
			(await POST({ request, url: new URL(request.url) } as Parameters<typeof POST>[0])).status
		).toBe(400);
	});
	it('bounds raw request size and handles absent or broken streams', async () => {
		expect((await call({ ...payload, message: 'x'.repeat(33_000) })).status).toBe(413);
		for (const body of [
			null,
			{
				getReader: () => ({
					read: async () => {
						throw new Error('Broken stream');
					}
				})
			}
		]) {
			const request = { headers: new Headers({ 'Content-Type': 'application/json' }), body };
			expect(
				(
					await POST({ request, url: new URL('https://example.test') } as unknown as Parameters<
						typeof POST
					>[0])
				).status
			).toBe(400);
		}
	});
	it('does not send honeypot submissions or claim delivery without configuration', async () => {
		const send = vi.fn();
		vi.stubGlobal('fetch', send);
		expect((await call({ ...payload, website: 'bot' })).status).toBe(200);
		const result = await call();
		expect(result.status).toBe(503);
		expect(result.headers.get('cache-control')).toBe('no-store');
		expect(send).not.toHaveBeenCalled();
	});
	it('sends configured submissions and reports failures without private data', async () => {
		env.CONTACT_PROVIDER = 'netlify';
		env.NETLIFY_FORMS_ENDPOINT = 'https://example.test';
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null)));
		expect((await call(payload, { Origin: 'https://example.test' })).status).toBe(200);
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error(JSON.stringify(payload))));
		const output = vi.spyOn(console, 'error').mockImplementation(() => {});
		const result = await call();
		expect(result.status).toBe(502);
		expect(output).toHaveBeenCalled();
		expect(JSON.stringify(output.mock.calls)).not.toContain(payload.email);
		expect(await result.text()).not.toContain(payload.name);
	});
});
