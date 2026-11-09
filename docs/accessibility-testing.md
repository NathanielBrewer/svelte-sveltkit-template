# Accessibility testing

This pipeline is adapted from `agent-orchestration`:

- `apps/web/scripts/check-accessibility.mjs`: Pa11y WCAG2AA checks in Chromium, source-derived button/link samples, and rendered contrast checks in default and hover states.
- `apps/web/static/accessibility-fixture.html`: a fixture that loads the application's real stylesheet.
- The root `test` script and `.github/workflows/pipeline.yml`: accessibility gates alongside unit tests, checks, and builds.

The template keeps those checks and adds scans of real routes, desktop/mobile navigation states, a known-failure self-test, JSON diagnostics, and failure screenshots. Orchestrator-specific colors, job forms, database services, and deployment steps are excluded.

## Run locally

Use Node 22.17+ on Linux, or Node 24 as used by CI:

```bash
npm ci
npm run test:accessibility
```

Chromium is bundled by `@sparticuz/chromium`; there is no separate browser-install command on supported Linux systems. `.puppeteerrc.cjs` prevents Pa11y's transitive Puppeteer dependency from downloading an additional browser. The runner starts a Vite development server on an available localhost port, launches Chromium, runs its checks, and closes both. A separate `npm run dev` is unnecessary.

On macOS/Windows, or when using a locally installed Chrome/Chromium, set `A11Y_BROWSER_EXECUTABLE` to the full browser executable path. For example, in a POSIX shell:

```bash
A11Y_BROWSER_EXECUTABLE=/path/to/chromium npm run test:accessibility
```

The browser override is supported by the runner; this change was validated with bundled Chromium on Linux. Corporate browser policies or missing Linux shared libraries can prevent launch; those errors fail the run and appear in the report.

Commands:

| Command                      | Checks                                                                  |
| ---------------------------- | ----------------------------------------------------------------------- |
| `npm run test:unit`          | Vitest unit/component tests, including source-sampling regression tests |
| `npm run test:coverage`      | Unit/component tests with coverage thresholds                           |
| `npm run test:accessibility` | Real Chromium accessibility checks                                      |
| `npm test`                   | Unit/component tests, then accessibility                                |
| `npm run validate`           | Typecheck, formatting/lint, unit coverage, then accessibility           |
| `npm run build`              | Production build; separate from the development-server browser audit    |

## What is checked

1. A known low-contrast text sample must be detected by both Pa11y and the rendered-color checker. It is removed before the actual audits. Failure to detect it fails the run.
2. The theme fixture loads `src/app.postcss` with `data-theme="template-theme"`. It exercises a labeled input and primary/soft action variants. Its HTML is included in Tailwind's content list so those classes are compiled.
3. The source sampler parses Svelte components using the Svelte compiler. It collects static classes from buttons/links, deduplicates equivalent tag/class combinations, and adds representative controls to the fixture. Default and hover text contrast must reach **4.5:1**. The checker composites translucent foreground/background colors through the DOM ancestors against a white canvas, then calculates relative luminance.
4. Pa11y scans the fixture in its default state and with each sampled control hovered.
5. Pa11y scans every configured route at every configured viewport. On `/`, it also scans an open dropdown on desktop and an open mobile menu and dropdown on mobile.
6. Missing fixtures, stylesheets, routes, expected navigation controls, empty source sampling, browser errors, or audit failures produce a nonzero exit status.

Pa11y errors and rendered contrast failures block validation. Pa11y warnings and notices are retained in the JSON report for manual review. No rule exclusions or ignored error baselines are configured.

The fixture is served by middleware only during this command. It is outside `static/`, so it is not a public route in the production build.

## Add routes and UI states

Edit [`accessibility.config.mjs`](../accessibility.config.mjs) when adding/removing routes or changing navigation controls. The initial routes are `/`, `/about`, `/contact`, `/portfolios`, and `/portfolio/example`, at 1440 × 900 and 390 × 844. Use concrete paths for dynamic routes and create stable local data for them. A missing configured route fails rather than being treated as a skipped check.

The `navigation` selectors identify the mobile toggle and dropdown trigger on the home route. If your navigation interaction changes, update the scenario code in [`scripts/check-accessibility.mjs`](../scripts/check-accessibility.mjs). Add explicit scenarios for new dialogs, validation errors, expanded sections, and other important UI states; listing a route does not exercise every interaction on it.

Add new globally styled control variants to [`scripts/accessibility/fixture.html`](../scripts/accessibility/fixture.html). Static button/link classes are sampled automatically. Dynamic class expressions and attribute spreads are listed under `skippedControls`; provide an explicit fixture example and/or a rendered route scenario for them.

## Diagnose failures

The console identifies the audit state, WCAG rule, message, and CSS selector. Rendered contrast failures include a source file/line or fixture label, measured ratio, default/hover state, and computed foreground/background colors.

Open `artifacts/accessibility/report.json` for the full issue list and self-test outcome. Pa11y failures include numbered screenshots; rendered contrast failures create `contrast-failure.png`. Each run replaces the previous report/screenshots. Artifacts are generated and ignored by Git, Prettier, and ESLint. Review warnings/notices even when the command succeeds; counts include repeated findings across states and viewports, rather than unique defects.

Fix the component, accessible name/label, or shared theme style, then rerun the audit. Do not lower the threshold or hide a real failure just to pass. The initial adoption found a 3.68:1 primary button and soft secondary/success/warning controls below 4.5:1. Shared overrides in `src/app.postcss` now give the primary action a darker blue and the soft variants darker text, preserving their reusable class names.

## CI

[`.github/workflows/validate.yml`](../.github/workflows/validate.yml) runs on pull requests, pushes to `main`, and manual dispatch. It installs the lockfile on Ubuntu/Node 24, runs `npm run validate`, then builds. Accessibility reports/screenshots are uploaded with `if: always()` and retained for 14 days. An audit failure fails the job; the workflow does not deploy the app.

## Limits and manual review

This is automated WCAG2AA smoke testing, not a claim of complete WCAG conformance. It audits the configured development routes and states; it does not prove production hosting behavior or cover authentication, backend integrations, unlisted routes, or all possible data.

Generated source samples reproduce global utility classes, not Svelte's component-scoped CSS or class directives. Real route scans cover the rendered navigation and other scoped components. The custom contrast calculation does not model image/gradient backgrounds, pseudo-elements, filters, whole-element opacity, or overlapping/backdrop layers. Review those combinations in the actual UI; its 4.5:1 threshold is deliberately conservative for all sampled text sizes.

Continue keyboard and screen-reader reviews: tab order, visible focus, skip links, meaningful link text, dropdown Escape/focus restoration, reading order, zoom/reflow, and touch usability. Default/hover fixture checks do not replace testing focus, disabled, selected, error, and dark-theme states. The template currently uses a light theme; add explicit fixtures/scenarios before introducing dark mode.
