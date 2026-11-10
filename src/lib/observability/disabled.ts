export function initialize(): void {
	/* Console logging remains available without a Sentry build. */
}
export function capture(_error: Error, _context: Record<string, unknown>): string | undefined {
	void _error;
	void _context;
	return undefined;
}
