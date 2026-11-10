// Adapted from agent-orchestration/apps/web/scripts/check-accessibility.mjs.
import pa11y from 'pa11y';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import config from '../accessibility.config.mjs';
import { sourceControlSamples } from './accessibility/source-controls.mjs';
import { renderedContrastFailures } from './accessibility/rendered-contrast.mjs';

process.env.TEMPLATE_ACCESSIBILITY = 'true';
const root = fileURLToPath(new URL('../', import.meta.url));
const artifactRoot = resolve(root, 'artifacts/accessibility');
const fixturePath = '/__accessibility-fixture';
const report = {
	startedAt: new Date().toISOString(),
	audits: [],
	contrastFailures: [],
	skippedControls: [],
	runtimeErrors: []
};
let server;
let browser;

async function settle(page) {
	await page.evaluate(async () => {
		await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
		await Promise.all(
			document
				.getAnimations()
				.filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
				.map((animation) => animation.finished.catch(() => {}))
		);
	});
}

async function audit(page, url, label) {
	const themes = label.includes('px') ? config.themes : [null];
	for (const theme of themes) {
		if (theme) {
			await page.mouse.move(0, 0);
			await page.$eval('body', (body, theme) => (body.dataset.theme = theme), theme);
		}
		await settle(page);
		const auditLabel = theme ? `${label} ${theme}` : label;
		const result = await pa11y(url, {
			browser,
			page,
			viewport: page.viewport(),
			ignoreUrl: true,
			standard: 'WCAG2AA',
			includeWarnings: true,
			includeNotices: true,
			timeout: 30_000
		});
		const errors = result.issues.filter((issue) => issue.type === 'error');
		const entry = { label: auditLabel, url, issues: result.issues };
		report.audits.push(entry);
		for (const issue of errors)
			console.error(`${auditLabel}: ${issue.code}: ${issue.message}\n  ${issue.selector}`);
		if (errors.length) {
			entry.screenshot = `${report.audits.length}-failure.png`;
			await page.screenshot({
				path: resolve(artifactRoot, entry.screenshot),
				fullPage: true
			});
		}
	}
}

async function visit(page, url) {
	const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 });
	if (!response?.ok())
		throw new Error(`Accessibility page failed to load: ${url} (${response?.status()})`);
	await page.evaluate(() => document.fonts.ready);
}

try {
	if (!config.routes.length || !config.viewports.length || !config.routes.includes('/')) {
		throw new Error(
			'Configure at least one viewport and route, including / for navigation scenarios'
		);
	}
	await rm(artifactRoot, { recursive: true, force: true });
	await mkdir(artifactRoot, { recursive: true });
	const fixture = await readFile(new URL('./accessibility/fixture.html', import.meta.url), 'utf8');
	server = await createServer({
		root,
		logLevel: 'error',
		plugins: [
			{
				name: 'accessibility-fixture',
				configureServer(vite) {
					vite.middlewares.use(fixturePath, (_request, response) => {
						response.setHeader('content-type', 'text/html; charset=utf-8');
						response.end(fixture);
					});
				}
			}
		],
		server: { host: '127.0.0.1', port: 0, open: false }
	});
	await server.listen();
	const origin = server.resolvedUrls?.local[0];
	if (!origin) throw new Error('Vite did not publish a local test URL');
	const stylesheet = await fetch(new URL('src/app.postcss', origin));
	if (!stylesheet.ok)
		throw new Error(`Accessibility stylesheet was not served: ${stylesheet.status}`);

	browser = await puppeteer.launch({
		executablePath: process.env.A11Y_BROWSER_EXECUTABLE || (await chromium.executablePath()),
		args: process.env.A11Y_BROWSER_EXECUTABLE
			? []
			: chromium.args.filter(
					(arg) => !['--disable-web-security', '--allow-running-insecure-content'].includes(arg)
				),
		headless: true
	});
	const { samples, skipped } = sourceControlSamples(resolve(root, 'src'));
	if (!samples.length)
		throw new Error('No source controls were discovered; accessibility sampling is empty');
	report.skippedControls = skipped;
	report.sourceControlCount = samples.length;
	if (skipped.length)
		console.warn(
			`Accessibility: ${skipped.length} dynamic/spread controls skipped by fixture extraction (see report)`
		);
	const page = await browser.newPage();
	await page.setCacheEnabled(false);
	page.on('pageerror', (error) => report.runtimeErrors.push(error.message));
	try {
		const fixtureUrl = new URL(fixturePath, origin).href;
		await visit(page, fixtureUrl);
		if (!(await page.content()).includes('Accessibility smoke test'))
			throw new Error('Accessibility fixture was not served');
		// Prove the engines detect a known failure before trusting a clean report.
		await page.evaluate(() => {
			const control = document.createElement('p');
			control.id = 'contrast-self-test';
			control.textContent = 'Intentionally low contrast';
			control.style.cssText = 'color: #aaa; background: #fff; font-size: 16px; font-weight: 400';
			document.querySelector('main').append(control);
		});
		const negativeContrast = await renderedContrastFailures(
			page,
			'#contrast-self-test',
			'self-test'
		);
		const negativeAudit = await pa11y(fixtureUrl, {
			browser,
			page,
			viewport: page.viewport(),
			ignoreUrl: true,
			standard: 'WCAG2AA',
			timeout: 30_000
		});
		if (
			negativeContrast.length !== 1 ||
			!negativeAudit.issues.some(
				(issue) =>
					issue.type === 'error' &&
					issue.code.includes('1_4_3') &&
					issue.selector === '#contrast-self-test'
			)
		) {
			throw new Error('Accessibility self-test failed: known low-contrast text was not detected');
		}
		await page.$eval('#contrast-self-test', (element) => element.remove());
		report.selfTest = 'passed';
		await page.evaluate((controls) => {
			const container = document.querySelector('#generated-controls');
			if (!container) throw new Error('Generated control container is missing');
			for (const [index, control] of controls.entries()) {
				const element = document.createElement(control.tagName);
				element.className = control.className;
				element.textContent = `Action ${index + 1}`;
				element.setAttribute('data-contrast-check', '');
				element.setAttribute('data-contrast-label', control.label);
				if (control.tagName === 'a') element.href = '#';
				else element.type = 'button';
				container.append(element);
			}
		}, samples);
		for (const theme of config.themes) {
			await page.mouse.move(0, 0);
			await page.$eval('body', (body, theme) => (body.dataset.theme = theme), theme);
			await settle(page);
			await audit(page, fixtureUrl, `${theme} fixture and source controls`);
			if ((await page.$eval('body', (body) => body.dataset.theme)) !== theme) {
				throw new Error('Fixture audit changed the selected theme');
			}
			report.contrastFailures.push(
				...(await renderedContrastFailures(page, '[data-contrast-check]', `${theme}:default`))
			);
			const controls = await page.$$('[data-contrast-check]');
			report.contrastChecks = (report.contrastChecks || 0) + controls.length * 2;
			for (const [index, control] of controls.entries()) {
				await page.mouse.move(0, 0);
				await control.hover();
				await settle(page);
				// Measure only the hovered control, including fixture and source-derived styles.
				await control.evaluate((element) => element.setAttribute('data-hover-check', ''));
				report.contrastFailures.push(
					...(await renderedContrastFailures(
						page,
						'[data-hover-check]',
						`${theme}:hover:${index + 1}`
					))
				);
				await audit(page, fixtureUrl, `${theme} hover ${index + 1}`);
				await control.evaluate((element) => element.removeAttribute('data-hover-check'));
			}
			if (report.contrastFailures.length) {
				await page.screenshot({
					path: resolve(artifactRoot, 'contrast-failure.png'),
					fullPage: true
				});
			}
		}

		for (const viewport of config.viewports) {
			await page.setViewport(viewport);
			for (const route of config.routes) {
				const url = new URL(route, origin).href;
				await visit(page, url);
				await audit(page, url, `${viewport.width}px ${route}`);
				if (route === '/contact') {
					let responseStatus = 503;
					const intercept = (request) => {
						if (new URL(request.url()).pathname === '/api/contact')
							void request.respond({
								status: responseStatus,
								contentType: 'application/json',
								body: JSON.stringify({ message: 'Test response' })
							});
						else void request.continue();
					};
					await page.setRequestInterception(true);
					page.on('request', intercept);
					try {
						await page.evaluate(() => {
							for (const [name, value] of Object.entries({
								name: 'Example',
								email: 'person@example.test',
								message: 'Example question'
							})) {
								const field = document.querySelector(`.contact-form [name="${name}"]`);
								field.value = value;
								field.dispatchEvent(new Event('input', { bubbles: true }));
							}
							document.querySelector('.contact-form form').requestSubmit();
						});
						await page.waitForSelector('.contact-form [data-state="error"]');
						await audit(page, url, `${viewport.width}px contact delivery error`);
						// Pa11y removes request listeners during cleanup; restore our delivery mock.
						page.off('request', intercept);
						page.on('request', intercept);
						responseStatus = 200;
						await page.click('.contact-form button[type="submit"]');
						await page.waitForSelector('.contact-form [data-state="success"]');
						await audit(page, url, `${viewport.width}px contact delivery success`);
					} finally {
						page.off('request', intercept);
						await page.setRequestInterception(false);
					}
				}
				if (route === '/') {
					const toggle = await page.$(config.navigation.mobileToggle);
					if (!toggle) throw new Error('Mobile navigation toggle is missing');
					const visible = await toggle.evaluate(
						(element) => getComputedStyle(element).display !== 'none'
					);
					if (visible) {
						await toggle.click();
						await page.waitForSelector(`${config.navigation.mobileToggle}[aria-expanded="true"]`);
						await audit(page, url, `${viewport.width}px mobile navigation open`);
					}
					await page.click(config.navigation.dropdown);
					await page.waitForSelector(`${config.navigation.dropdown}[aria-expanded="true"]`);
					await audit(page, url, `${viewport.width}px dropdown open`);
					await page.keyboard.press('Escape');
					if (visible) await page.keyboard.press('Escape');
				}
			}
		}
	} finally {
		await page.close();
	}
} catch (error) {
	report.runtimeErrors.push(error.stack ?? String(error));
	console.error(error);
} finally {
	const cleanup = await Promise.allSettled([browser?.close(), server?.close()]);
	for (const result of cleanup) {
		if (result.status === 'rejected') report.runtimeErrors.push(String(result.reason));
	}
	await mkdir(artifactRoot, { recursive: true });
	const errors = report.audits.flatMap((audit) =>
		audit.issues.filter((issue) => issue.type === 'error')
	);
	for (const failure of report.contrastFailures)
		console.error(
			`WCAG2AA.Contrast: ${failure.label} has ${failure.ratio.toFixed(2)}:1 in ${failure.state} (${failure.foreground} on ${failure.background})`
		);
	report.summary = {
		audits: report.audits.length,
		pa11yErrors: errors.length,
		contrastErrors: report.contrastFailures.length,
		runtimeErrors: report.runtimeErrors.length,
		warnings: report.audits.flatMap((audit) =>
			audit.issues.filter((issue) => issue.type === 'warning')
		).length,
		notices: report.audits.flatMap((audit) =>
			audit.issues.filter((issue) => issue.type === 'notice')
		).length,
		skippedControls: report.skippedControls.length
	};
	report.finishedAt = new Date().toISOString();
	await writeFile(resolve(artifactRoot, 'report.json'), JSON.stringify(report, null, 2) + '\n');
	console.log(
		`Accessibility: ${JSON.stringify(report.summary)}\nReport: artifacts/accessibility/report.json`
	);
	if (errors.length || report.contrastFailures.length || report.runtimeErrors.length)
		process.exitCode = 1;
}
