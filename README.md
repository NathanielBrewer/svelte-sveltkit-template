# SvelteKit application template v2.0

A SvelteKit 3 / Svelte 5 starter with Skeleton theme presets, reusable content blocks,
responsive navigation, structured logging, optional Sentry, and validation in Chromium.
Source components and configuration are reviewed in [Source review](docs/source-review.md).

See the [v2.0.0 release notes](docs/releases/v2.0.0.md) for changes and migration
requirements, and [Releasing](docs/releasing.md) for versioning and GitHub metadata.

## Start

Use Node.js 22.17+ or Node 24 as used by CI:

```bash
npm ci
npm run dev
```

Edit `template.config.mjs` for the brand, default/available palettes, and selected
example pages. The header's Style preset selector switches palettes and remembers
valid preferences. See [Template configuration](docs/template-configuration.md) for
content blocks, optional primitives, and controls over what enters the build.

## Validation

| Command                      | Purpose                                                               |
| ---------------------------- | --------------------------------------------------------------------- |
| `npm run check`              | Svelte and TypeScript diagnostics                                     |
| `npm run lint`               | Formatting and ESLint                                                 |
| `npm run test:unit`          | Unit/component and automation-policy tests                            |
| `npm run test:coverage`      | Unit tests with enforced coverage thresholds                          |
| `npm run test:accessibility` | Pa11y plus rendered contrast across configured palettes/routes/states |
| `npm test`                   | Unit tests followed by accessibility                                  |
| `npm run validate`           | Check, lint, coverage, and accessibility                              |
| `npm run build`              | Production build                                                      |
| `npm run test:e2e`           | Playwright against an already built production preview                |
| `npm run check:build`        | Bundle exclusions and uncompressed client-size budget                 |
| `npm run validate:release`   | Validate, build, production browser tests, and bundle check           |
| `npm run test:build-matrix`  | Minimal, Sentry-enabled, and restored default builds                  |

Chromium for accessibility is bundled. Playwright can use it too:

```bash
export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="$(node --input-type=module -e 'import chromium from "@sparticuz/chromium"; console.log(await chromium.executablePath())')"
npm run validate:release
```

Alternatively install Playwright Chromium with `npx playwright install chromium`.
See [Accessibility testing](docs/accessibility-testing.md) for platform support,
artifacts, route/state coverage and manual review. Run build/audit commands serially
within a checkout.

## Structure

- `themes/presets.json` and `app-theme.ts` provide selected Skeleton palettes.
- `content/pages.json` supplies the generalized example definitions.
- `src/lib/content` contains the shared page shell and hero/plan/FAQ blocks.
- `src/lib/components/SiteNavigation.svelte` supplies the sticky header, dropdowns,
  mobile disclosure and active-route matching adapted from Mike Erb's site.
- `src/lib/components/primitives` contains optional modal, status and notification UI.
- `src/lib/observability` contains sanitized logging and optional Sentry adapters.
- `scripts/template-options.mjs` emits only selected content and used block imports.

`/` is the starter page; `/about`, `/contact`, `/portfolios`, and
`/portfolio/[portfolioSlug]` retain simple examples configured in `src/lib/site.ts`.
`/explore` lists selected definitions, and `/explore/[slug]` renders their blocks and
section navigation. Unknown page/portfolio/content slugs return 404. The contact form
uses a private Netlify Forms delivery adapter. Follow [Contact and Netlify hosting](docs/contact-and-netlify.md)
to enable detection, runtime configuration and notifications; delivery is disabled until configured.

SvelteKit configuration lives in `vite.config.ts`; shared source imports use `#lib/*`.
The scoped `minimatch` override keeps the TypeScript ESLint parser on a patched release;
remove it when the upstream range includes minimatch 11.0.1 or later. Esbuild handles
CSS minification because Skeleton 2 selectors conflict with Lightning CSS defaults.

## Logging and CI

[Logging and error reporting](docs/observability.md) explains structured logs,
redaction, the optional `PUBLIC_SENTRY_DSN` build input, and live-delivery verification.
No DSN means the Sentry SDK is excluded from production chunks. Error collection is
separate from analytics, replay and performance tracing, which are not enabled here.

[Operate and repair CI](docs/ci-agent-runbook.md) explains connector permissions,
commit/run matching, failure evidence, diagnosis and repairs, and Dependabot gates.
The workflow validates and builds; it does not deploy or run an autonomous repair
agent. Dependabot auto-merge requires a reviewed dry run and explicit repository
opt-in. No remote repository settings have been changed by adding these files.

Commit `package-lock.json` with dependency updates. Run `npm audit` after updates.
The current full audit has five low-severity entries stemming from one unpatched
`deepmerge` advisory ([GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)),
including the SDK's inherited SvelteKit peer chain. These findings remain visible.
