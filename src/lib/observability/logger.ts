import { capture } from '#telemetry';
import { scrub, scrubText } from './privacy.ts';
export function log(
	level: 'info' | 'warn' | 'error',
	message: string,
	context: Record<string, unknown> = {}
): void {
	console[level](JSON.stringify({ level, message: scrubText(message), context: scrub(context) }));
}
export function reportError(
	error: unknown,
	context: Record<string, unknown> = {}
): string | undefined {
	const safeError = new Error(scrubText(error instanceof Error ? error.message : String(error)));
	if (error instanceof Error && error.stack) safeError.stack = scrubText(error.stack);
	log('error', safeError.message, { ...context, stack: safeError.stack });
	try {
		return capture(safeError, scrub(context) as Record<string, unknown>);
	} catch {
		log('warn', 'Error reporting unavailable');
		return undefined;
	}
}
