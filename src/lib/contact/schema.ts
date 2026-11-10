export const contactFormName = 'contact';
export const contactLimits = {
	name: 120,
	email: 240,
	subject: 180,
	message: 6000,
	context: 500,
	website: 200
};
export type ContactPayload = Record<keyof typeof contactLimits, string>;

export function parseContact(value: unknown): ContactPayload | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
	const source = value as Record<string, unknown>;
	const result = {} as ContactPayload;
	for (const [field, limit] of Object.entries(contactLimits)) {
		const input = source[field] ?? '';
		if (typeof input !== 'string' || input.length > limit) return null;
		result[field as keyof ContactPayload] = input.trim();
	}
	if (
		!result.name ||
		!result.subject ||
		!result.message ||
		!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)
	)
		return null;
	return result;
}
