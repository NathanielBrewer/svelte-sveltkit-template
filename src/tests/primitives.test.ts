import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import StatusBadge from '#lib/components/primitives/StatusBadge.svelte';
import Modal from '#lib/components/primitives/Modal.svelte';
import NotificationList from '#lib/components/primitives/NotificationList.svelte';
import { createNotifications } from '#lib/components/primitives/notifications.ts';

describe('optional primitives', () => {
	it('shows a textual status as well as its tone', () => {
		render(StatusBadge, { label: 'Completed', tone: 'success' });
		expect(screen.getByText('Completed').getAttribute('data-tone')).toBe('success');
	});
	it('keeps notification state isolated and allows dismissal', async () => {
		const store = createNotifications();
		const other = createNotifications();
		store.add('Saved');
		store.add('Could not save', 'error');
		render(NotificationList, { store });
		expect(screen.getByRole('alert').textContent).toContain('Could not save');
		await fireEvent.click(screen.getByRole('button', { name: 'Dismiss Saved' }));
		expect(get(store)).toHaveLength(1);
		expect(get(other)).toHaveLength(0);
		store.clear();
		expect(get(store)).toHaveLength(0);
	});
	it('uses a native modal, restores scroll and returns focus', async () => {
		const show = vi.fn(function (this: HTMLDialogElement) {
			this.open = true;
		});
		const close = vi.fn(function (this: HTMLDialogElement) {
			this.open = false;
			this.dispatchEvent(new Event('close'));
		});
		Object.defineProperties(HTMLDialogElement.prototype, {
			showModal: { value: show, configurable: true },
			close: { value: close, configurable: true }
		});
		const { unmount } = render(Modal, { title: 'Example dialog', triggerLabel: 'Open dialog' });
		const trigger = screen.getByRole('button', { name: 'Open dialog' });
		await fireEvent.click(trigger);
		expect(show).toHaveBeenCalled();
		expect(document.body.style.overflow).toBe('hidden');
		await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
		expect(document.activeElement).toBe(trigger);
		expect(document.body.style.overflow).toBe('');
		unmount();
		Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
		Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
	});
});
