import { contactFormName, type ContactPayload } from '#lib/contact/schema.ts';

export function contactEndpoint(env: Record<string, string | undefined>): URL | null {
	if (env.CONTACT_PROVIDER !== 'netlify') return null;
	const site = env.NETLIFY_FORMS_ENDPOINT || env.URL || env.DEPLOY_URL;
	if (!site) return null;
	try {
		const url = new URL(site);
		if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
			return null;
		return new URL('/contact-form.html', url);
	} catch {
		return null;
	}
}

export async function sendContact(
	payload: ContactPayload,
	endpoint: URL,
	send: typeof fetch = fetch
): Promise<void> {
	const response = await send(endpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ 'form-name': contactFormName, ...payload }).toString(),
		redirect: 'manual',
		signal: AbortSignal.timeout(10_000)
	});
	// Netlify may respond with its success-page redirect. Never follow it or expose its body.
	if (!response.ok && response.status !== 302 && response.status !== 303)
		throw new Error('Contact delivery failed');
}
