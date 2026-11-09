# Svelte Skeleton Template

Minimal SvelteKit starter built around:

- SvelteKit
- Skeleton with a single custom theme surface
- TypeScript
- ESLint + Prettier
- Vitest + Testing Library + coverage

The cloned site content, routes, assets, and old deployment/test setup have been removed so this repo behaves like a reusable template.

## Scripts

- `npm run dev` starts the local dev server
- `npm run build` creates the production build
- `npm run preview` previews the production build
- `npm run check` runs `svelte-check`
- `npm run lint` runs Prettier and ESLint
- `npm run test` runs unit tests once
- `npm run test:watch` runs unit tests in watch mode
- `npm run test:coverage` runs unit tests with V8 coverage
- `npm run validate` runs check, lint, and coverage together

## Structure

- `app-theme.ts` is the main Skeleton theme token file
- `tailwind.config.ts` wires Skeleton and Tailwind together
- `src/app.postcss` is the small global styling layer
- `src/routes/+page.svelte` is a starter landing page you can replace immediately
- `src/lib/components/FeatureCard.svelte` is a small typed example component with unit tests

## Start

Use Node.js 22.17+ and commit `package-lock.json` with dependency updates.

```bash
npm ci
npm run dev
npm run validate
```

After dependency updates, run `npm audit`, `npm run validate`, and `npm run build`.

SvelteKit 3 configuration lives in `vite.config.ts`, and shared source imports use `#lib/*`.
The scoped `minimatch` override keeps the TypeScript ESLint parser on a patched release;
remove it when the parser's dependency range includes minimatch 11.0.1 or later.
The build uses esbuild for CSS minification because Skeleton 2 includes selectors that
Vite 8's default Lightning CSS minifier rejects.

The full audit currently reports four low-severity entries from the Svelte Vite plugin's
`deepmerge` dependency ([GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)).
There is no patched upstream release; keep this finding visible until a fix is available.

## Routing and navigation

The sticky header, desktop dropdown, mobile menu, and active-route styling are adapted
from `mike-erb-website`. `src/lib/components/SiteNavigation.svelte` uses one shared link
list for both layouts, with Escape/focus restoration and outside-click dismissal.
It follows SvelteKit's current URL, including browser back/forward navigation.

Edit `src/lib/site.ts` to configure the brand-neutral example pages, portfolios, and
navigation order. The header brand and home URL are component props in `+layout.svelte`.
Dropdowns support one level of child links; include an overview link in the children
when the parent also has a landing page.

- `/` keeps the template landing page.
- `/portfolios` lists configured portfolios.
- `/portfolio/[portfolioSlug]` loads a configured portfolio.
- `/[pageSlug]` loads a configured page (initially `/about`).
- `/contact` is a static placeholder, ready for your own contact details or form.

Unknown page and portfolio slugs return 404. Navigation and route content share the
same configuration, so adding an entry also adds its link. This template uses local
example data; Contentful clients, credentials, preview endpoints, branding, galleries,
and contact submission services remain specific to the source project.
