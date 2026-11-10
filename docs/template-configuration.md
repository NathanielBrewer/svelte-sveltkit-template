# Configure the template

Use `template.config.mjs` to choose the brand, default preset, available presets, and example pages. The five presets are adapted from `savages/used-sales-platform`: Template, Command Iris, Mustard Shift, Plum Vector, and Flat Plum. They share typed components and differ in palette, fonts, radii, and panel treatment. The current configurations are light palettes; the source dashboard's dark-mode overrides are not enabled in this template.

The style selector persists a validated preset ID in `localStorage` under `template.theme.v1`. Unknown or removed IDs fall back to the configured default. Storage failures leave current-page selection working. The server renders the configured default; a returning visitor's saved preference is applied after mounting, so a brief initial color change remains possible. No fonts are downloaded automatically; configured font stacks use available local/system fonts.

## Choose what ships

```js
export default {
	brand: 'Your project',
	defaultTheme: 'template-theme',
	themes: ['template-theme', 'stats-command-iris'],
	pages: ['team-support']
};
```

Only listed presets are compiled by Tailwind. Only listed content definitions are emitted into the generated content module. The block registry is generated from those pages, so removing the only FAQ page also removes the FAQ component from the build. Directly imported optional primitives are bundled when you use them; storing source under `src/lib` does not itself put it in a production chunk. Import components directly rather than adding an eager component registry.

`TEMPLATE_THEMES` and `TEMPLATE_PAGES` may override the comma-separated selections for a build. If themes are overridden, the first becomes the default. An empty `TEMPLATE_PAGES` selection omits all example definitions. These are build inputs; changing them requires rebuilding. Validate customized content with matching tests and audit routes.

The starter routes themselves remain application entry points. Removing a content definition makes its slug return 404; it does not remove the generic `/explore/[slug]` route shell. Shared Skeleton base CSS is still present. The bundle checks prove selected exclusions, not that every unused framework CSS declaration has been eliminated.

Run `npm run check:build` after building for a JSON size report and guards against accidentally bundling unused primitives or disabled Sentry. The default client JS/CSS budget is 500,000 uncompressed bytes. If you start using a previously optional primitive, update that guard's explicit unused-component list with the feature and its tests. `npm run test:build-matrix` builds a minimal configuration, checks exclusions, verifies an SDK-enabled build using a loopback test DSN, then restores the normal output. Do not run concurrent builds or browser audits in the same checkout.

## Content blocks and navigation

`content/pages.json` contains neutral `PageDefinition` records. Its services are example content inspired by the marketing/services source, not a service-specific API. Each page supplies a slug, SEO title/description, and ordered blocks:

- `hero`: title, summary, optional eyebrow and links.
- `plans`: named items with descriptions, prices, and feature lists; also useful for memberships or product tiers.
- `faq`: questions rendered as native `details` disclosures.

`PageShell` renders the chosen blocks and derives an “On this page” navigation list from their IDs. Keep IDs unique and stable for anchor links. `/explore` and the main Explore dropdown derive their links from the same selected definitions. Unknown slugs return 404. A different data adapter can return the same serializable shape without changing the blocks. Strings render as text; no untrusted HTML renderer is included.

The original `/about`, `/contact`, and portfolio examples remain in `src/lib/site.ts`. The contact route uses the shared form and optional Netlify Forms backend. Follow [Contact and Netlify hosting](contact-and-netlify.md) to configure and verify delivery before publishing.

## Optional primitives

Import only what your feature uses:

- `src/lib/components/primitives/Modal.svelte`: native dialog, accessible title, Escape/backdrop close, focus restoration and scroll cleanup. It assumes one active dialog and does not implement nested modal coordination.
- `StatusBadge.svelte`: a textual label and configurable tone, rather than domain-specific job states.
- `notifications.ts` and `NotificationList.svelte`: create an isolated store per layout/component tree, render status/error announcements, and dismiss explicitly. No global SSR store or automatic timeout is used. Create the store in a component script so separate requests cannot share messages.

Component and behavior tests live beside the feature or under `src/tests`. Production browser tests cover routing, disclosure, anchors, history, preset persistence and 404s. Accessibility checks cover all selected presets and configured routes. Optional components also need browser scenarios when first integrated into a real page.
