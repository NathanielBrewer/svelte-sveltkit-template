# Template agent instructions

Read `README.md`, `docs/template-configuration.md`, and the relevant feature guide before changes.
For GitHub Actions diagnosis and repair, follow `docs/ci-agent-runbook.md`.

- Reuse shared components, content definitions, theme tokens and logging helpers. Keep CMS/domain integrations behind adapters.
- Choose presets and example pages in `template.config.mjs`; preserve build-time pruning. Import optional components directly.
- Use `src/lib/observability/logger.ts` for application diagnostics. Do not log customer records, credentials or raw request bodies.
- Add focused regression tests for behavior. Run `npm run validate:release` for runtime/UI changes and `npm run test:build-matrix` when changing build configuration, optional imports, themes or Sentry. Run builds/audits serially in a checkout.
- Do not weaken tests, accessibility thresholds, coverage, or merge gates to make checks pass. Missing evidence is not a pass.
- Inspect the exact failing revision, run logs and artifacts before repairing CI. Fix causes, validate locally and verify the replacement commit's remote checks when publication is authorized.
- Leave edits uncommitted unless requested. GitHub access alone does not authorize pushes, merges, repository settings, messages or deployment.
- Summarize changes, test counts/coverage, local versus remote proof, and known limitations.
