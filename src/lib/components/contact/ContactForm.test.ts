import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, expect, it, vi } from 'vitest';
import ContactForm from './ContactForm.svelte';
afterEach(() => {
	vi.unstubAllGlobals();
	history.replaceState({}, '', '/');
});
async function fill() {
	await fireEvent.input(screen.getByLabelText('Name'), { target: { value: 'Example' } });
	await fireEvent.input(screen.getByLabelText('Email'), {
		target: { value: 'person@example.test' }
	});
	await fireEvent.input(screen.getByLabelText('Message'), { target: { value: 'Hello' } });
}
it('prefills a suggested subject, prevents duplicate sends and resets after success', async () => {
	history.replaceState({}, '', '/contact?contactSubject=Project%20enquiry');
	let resolve!: (response: Response) => void;
	const send = vi.fn().mockReturnValue(
		new Promise<Response>((done) => {
			resolve = done;
		})
	);
	vi.stubGlobal('fetch', send);
	const { container } = render(ContactForm, {
		props: { subjectSuggestions: ['Project enquiry'], context: 'Example context' }
	});
	expect((screen.getByLabelText('Subject') as HTMLSelectElement).value).toBe('Project enquiry');
	await fill();
	const form = container.querySelector('form')!;
	await fireEvent.submit(form);
	await fireEvent.submit(form);
	expect(send).toHaveBeenCalledTimes(1);
	expect(screen.getByRole('button').hasAttribute('disabled')).toBe(true);
	expect(JSON.parse(send.mock.calls[0][1].body).context).toBe('Example context');
	resolve(new Response(JSON.stringify({ message: 'Accepted' })));
	await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Message received'));
	expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('');
	expect((screen.getByLabelText('Subject') as HTMLSelectElement).value).toBe('Project enquiry');
});
it.each([
	() => Promise.reject(new Error('offline')),
	() => Promise.resolve(new Response('{}', { status: 502 })),
	() => Promise.resolve(new Response('<html>Fallback</html>')),
	() => Promise.resolve(new Response('{}'))
])('retains input for retry after failed or malformed responses %#', async (response) => {
	vi.stubGlobal('fetch', vi.fn(response));
	const { container } = render(ContactForm);
	await fill();
	await fireEvent.submit(container.querySelector('form')!);
	await waitFor(() =>
		expect(screen.getByRole('status').textContent).toContain('could not be sent')
	);
	expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Example');
	expect(screen.getByRole('button').hasAttribute('disabled')).toBe(false);
});
it('supports custom subjects and ignores oversized URL subjects', () => {
	history.replaceState({}, '', '/contact?contactSubject=Custom');
	const { unmount } = render(ContactForm, { subjectSuggestions: ['General question'] });
	expect((screen.getByLabelText('Subject') as HTMLSelectElement).value).toBe('Custom');
	unmount();
	history.replaceState({}, '', '/contact?contactSubject=' + 'x'.repeat(181));
	render(ContactForm);
	expect((screen.getByLabelText('Subject') as HTMLInputElement).value).toBe('General question');
});
