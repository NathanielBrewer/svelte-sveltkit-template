import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadEnv } from 'vite';
import config from '../template.config.mjs';
import palettes from '../themes/presets.json' with { type: 'json' };
async function files(root) {
	const result = [];
	for (const entry of await readdir(root, { withFileTypes: true })) {
		const path = join(root, entry.name);
		if (entry.isDirectory()) result.push(...(await files(path)));
		else result.push(path);
	}
	return result;
}
const output = await files('.svelte-kit/output');
const chunks = output.filter((path) => /\.(js|css)$/.test(path));
let bytes = 0;
let clientBytes = 0;
let source = '';
for (const path of chunks) {
	const body = await readFile(path, 'utf8');
	source += body;
	bytes += Buffer.byteLength(body);
	if (path.includes('/client/')) clientBytes += Buffer.byteLength(body);
}
const failures = [];
for (const id of Object.keys(palettes))
	if (!config.themes.includes(id) && source.includes(`[data-theme=${id}]`))
		failures.push(`Excluded theme is bundled: ${id}`);
for (const name of ['modal', 'status-badge', 'notifications'])
	if (source.includes(`data-template-component="${name}"`))
		failures.push(`Unused primitive is bundled: ${name}`);
const sentryEnabled = Boolean(
	process.env.PUBLIC_SENTRY_DSN ?? loadEnv('production', process.cwd(), 'PUBLIC_').PUBLIC_SENTRY_DSN
);
if (!sentryEnabled && /@sentry\/|__SENTRY__/.test(source))
	failures.push('Disabled Sentry SDK is bundled');
if (clientBytes > 500_000)
	failures.push(`Client JS/CSS budget exceeded: ${clientBytes} bytes (500000 allowed)`);
await mkdir('artifacts/build', { recursive: true });
await writeFile(
	'artifacts/build/report.json',
	JSON.stringify({ bytes, clientBytes, failures }, null, 2) + '\n'
);
if (failures.length) throw new Error(failures.join('\n'));
console.log(
	`Build contents: ${clientBytes} client bytes; optional component and SDK checks passed`
);
