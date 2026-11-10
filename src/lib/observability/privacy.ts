const privateKey = /password|token|secret|authorization|cookie|email|phone|body|payload|user/i;
export function scrubText(value: string): string {
	return value
		.replace(/\b(?:Bearer\s+\S+|sk-[\w-]+|gh[pousr]_[\w]+)\b/gi, '[redacted]')
		.replace(/((?:password|token|secret|api[_-]?key)\s*[:=]\s*)[^\s,;&]+/gi, '$1[redacted]')
		.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email]')
		.replace(/https?:\/\/[^\s]+/g, (url) => url.split(/[?#]/)[0]);
}
export function scrub(value: unknown, depth = 0): unknown {
	if (depth > 5) return '[truncated]';
	if (typeof value === 'string') return scrubText(value).slice(0, 2000);
	if (value instanceof Error) return { name: value.name, message: scrubText(value.message) };
	if (Array.isArray(value)) return value.slice(0, 30).map((item) => scrub(item, depth + 1));
	if (value && typeof value === 'object')
		return Object.fromEntries(
			Object.entries(value)
				.filter(([key]) => !privateKey.test(key))
				.map(([key, item]) => [key, scrub(item, depth + 1)])
		);
	return value;
}
