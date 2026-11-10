import { writable } from 'svelte/store';
export type Notice = { id: number; message: string; tone: 'info' | 'error' };
// Create per component/layout tree. Never export a global SSR notification store.
export function createNotifications() {
	const store = writable<Notice[]>([]);
	let id = 0;
	return {
		subscribe: store.subscribe,
		add(message: string, tone: Notice['tone'] = 'info') {
			const next = ++id;
			store.update((items) => [...items.slice(-4), { id: next, message, tone }]);
			return next;
		},
		dismiss(id: number) {
			store.update((items) => items.filter((item) => item.id !== id));
		},
		clear() {
			store.set([]);
		}
	};
}
