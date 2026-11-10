import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: 0,
	reporter: [['list'], ['html', { outputFolder: 'artifacts/browser/report', open: 'never' }]],
	outputDir: 'artifacts/browser/results',
	use: {
		baseURL: 'http://127.0.0.1:4188',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
			? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
			: {}
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }
	],
	webServer: {
		command: 'npm run preview -- --host 127.0.0.1 --port 4188 --strictPort',
		url: 'http://127.0.0.1:4188',
		reuseExistingServer: false,
		timeout: 60_000
	}
});
