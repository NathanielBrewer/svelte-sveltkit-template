import { json, type RequestHandler } from '@sveltejs/kit';
import * as env from '$app/env/private';
import { parseContact } from '#lib/contact/schema.ts';
import { contactEndpoint, sendContact } from '#lib/server/contact/netlify.ts';
import { reportError } from '#lib/observability/logger.ts';

const reply = (message: string, status = 200) =>
	json({ message }, { status, headers: { 'Cache-Control': 'no-store' } });

export const POST: RequestHandler = async ({ request, url }) => {
	// Do not let another site use this JSON endpoint to submit on a visitor's behalf.
	if (request.headers.get('origin') && request.headers.get('origin') !== url.origin)
		return reply('Invalid request origin.', 403);
	if (!request.headers.get('content-type')?.startsWith('application/json'))
		return reply('JSON is required.', 415);
	// Bound streamed requests too, rather than trusting Content-Length.
	const reader = request.body?.getReader();
	if (!reader) return reply('A message is required.', 400);
	const chunks: Uint8Array[] = [];
	let size = 0;
	try {
		for (;;) {
			const { value, done } = await reader.read();
			if (done) break;
			size += value.byteLength;
			if (size > 32_768) {
				await reader.cancel();
				return reply('Message is too large.', 413);
			}
			chunks.push(value);
		}
	} catch {
		return reply('Could not read the message.', 400);
	}
	const bytes = new Uint8Array(size);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	let input: unknown;
	try {
		input = JSON.parse(new TextDecoder().decode(bytes));
	} catch {
		return reply('Invalid message.', 400);
	}
	const payload = parseContact(input);
	if (!payload) return reply('Check the required fields and their lengths.', 400);
	if (payload.website) return reply('Message received.');
	const endpoint = contactEndpoint(env);
	if (!endpoint) return reply('Messaging is currently unavailable. Please try again later.', 503);
	try {
		await sendContact(payload, endpoint);
		return reply('Message received. Thank you for getting in touch.');
	} catch {
		// Upstream errors may contain submitted data. Report only a fixed diagnostic.
		reportError(new Error('Contact delivery failed'), {
			operation: 'contact.send',
			provider: 'netlify'
		});
		return reply('The message could not be sent. Please try again later.', 502);
	}
};
