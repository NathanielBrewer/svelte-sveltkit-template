# Reusable source review

The source checkouts were read to identify reusable contracts rather than bringing entire sites into the template. No source checkout was changed.

| Source under `~/dev`             | Adopted patterns                                                                                                     | Kept separate                                                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `website`                        | Review of responsive navigation, semantic controls and analytics consent boundaries                                  | Its fixed analytics ID, consent copy, assets, contact provider and offline cache policy need a specific product. Analytics is not enabled here. |
| `mike-erb-website`               | Existing sticky/dropdown/mobile navigation and active route behavior remain generalized                              | Crown/logo, Contentful clients, preview credentials and branded galleries                                                                       |
| `savages/used-sales-platform`    | Five presets, validated stored preferences, request-isolated notification state, coordinated Dependabot groups       | Shopify, authentication, sales metrics, business permissions and the Skeleton 5 migration                                                       |
| `agent-orchestration`            | Existing Pa11y pipeline plus native modal focus/scroll cleanup, textual statuses, evidence-led repair instructions   | Worker queues, MariaDB, publisher credentials and automatic agent execution                                                                     |
| `website--maketing-and-services` | Hero/plan/FAQ page definitions, shared page shell, content-derived links; generalized under `content` and `/explore` | Service-only names, personal contact subjects, SES/Netlify mail configuration, unrelated routes and assets                                      |
| `web-kit`                        | Canonical package ownership, direct component imports, separate package/browser proof and bundle hygiene             | Its private gallery remains owned by `@nathanielbrewer/gallery-svelte`; the miner and masonry dependency are not installed here.                |
| `nbplants/live-site-nbplants`    | Strict tested-head Dependabot merge gates, redaction/collection limits and failure artifacts                         | WordPress contracts, Next.js instrumentation, Vercel preview/deployment/cache jobs                                                              |

The requested marketing/services checkout exists locally with `maketing` in its name. The extraction uses that worktree, whose services include website and small-team support examples.

The gallery in `web-kit` is already the reusable CMS-independent owner. If a project needs a gallery, consume a reviewed version of that package (or a versioned package artifact supplied by its maintainer), map data to its `GalleryImage` contract, and add its browser tests. Do not introduce an absolute home-directory dependency or another divergent gallery copy just to make it available in a starter.

## Validation boundaries

Local checks cover the adapted source, selected builds and Chromium behavior. They do not validate source projects, private package distribution, live Sentry delivery, GitHub repository settings, deployed services, or production hosting. CI does not deploy. Auto-merge defaults to disabled and its API interactions are covered with mocks; enable it only after a real dry run and a successful workflow run on the target repository.
