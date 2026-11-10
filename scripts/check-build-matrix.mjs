// Build choices are overridden through environment inputs; tracked config is never rewritten.
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
const report = { minimal: false, sentry: false, restored: false, errors: [] };
async function contents(root) {
	let text = '';
	for (const entry of await readdir(root, { withFileTypes: true })) {
		const path = join(root, entry.name);
		if (entry.isDirectory()) text += await contents(path);
		else if (/\.(js|css)$/.test(path)) text += await readFile(path, 'utf8');
	}
	return text;
}
function build(env = {}) {
	const run = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], {
		stdio: 'inherit',
		env: { ...process.env, ...env }
	});
	if (run.status !== 0) throw Error('Build matrix failed');
}
try {
	build({
		PUBLIC_SENTRY_DSN: '',
		TEMPLATE_THEMES: 'template-theme',
		TEMPLATE_PAGES: 'team-support'
	});
	const minimal = await contents('.svelte-kit/output');
	for (const marker of [
		'stats-command-iris',
		'stats-mustard-shift',
		'stats-plum-vector',
		'stats-flat-plum',
		'Common questions',
		'Website support',
		'__SENTRY__',
		'@sentry/'
	]) {
		if (minimal.includes(marker)) throw Error(`Excluded build content remains: ${marker}`);
	}
	report.minimal = true;
	console.log('Minimal build: unused palettes, page content, FAQ block, and Sentry absent');
	build({ PUBLIC_SENTRY_DSN: 'http://public@127.0.0.1:1/1' });
	if (!/@sentry\/|__SENTRY__/.test(await contents('.svelte-kit/output')))
		throw Error('Sentry-enabled build did not include the SDK');
	report.sentry = true;
	console.log('Sentry-enabled build: SDK present');
} catch (error) {
	report.errors.push(String(error));
} finally {
	try {
		build();
		report.restored = true;
	} catch (error) {
		report.errors.push(String(error));
	}
	await mkdir('artifacts/build', { recursive: true });
	await writeFile('artifacts/build/matrix.json', JSON.stringify(report, null, 2) + '\n');
}
if (report.errors.length) throw Error(report.errors.join('\n'));
