# Prepare and publish a release

The package version is the release version; prefix it with `v` for the Git tag. This repository is a private npm application template (`private: true`), so a GitHub release does not publish an npm package. `package.json` also owns the repository description and topic list: use `description` for GitHub's About description and `keywords` for GitHub topics. Keep topics relevant, lowercase and hyphenated.

Version 2.0.0's release description is [v2.0.0](releases/v2.0.0.md). The notes distinguish local evidence from remote validation and deployment. Keep the evidence current rather than copying successful counts from an older revision.

## Verify the release revision

1. Review the version in `package.json` and both root version fields in `package-lock.json`, release notes, migration instructions and repository metadata.
2. Run `npm ci`, `npm run validate:release`, then `npm run test:build-matrix` serially in the checkout. Configure Chromium as described in the README. Run `npm audit` and `npm audit --omit=dev`; retain unresolved findings in the notes. Do not lower checks to publish.
3. When authorized, commit and push the reviewed release files. Match the exact commit SHA to its successful `Validate` run, using [the CI runbook](ci-agent-runbook.md). A missing or skipped check is not evidence of success.
4. Only after validation succeeds, create and push the annotated version tag on that exact commit. Never move an existing release tag to another commit. For v2.0.0, use `git tag -a v2.0.0 -m 'Release v2.0.0' VERIFIED_COMMIT_SHA` and `git push origin v2.0.0` after replacing the placeholder with the verified SHA.

## Apply GitHub description and topics

These commands change only the requested About description and topics. They require an authenticated GitHub CLI with repository administration permission; they do not enable auto-merge, change branch rules or deploy. Do not paste tokens into the repository or chat. Use `gh auth login` in your own terminal if CLI authentication is needed.

Run from the repository root after reviewing `package.json`:

```bash
node --input-type=module <<'JS'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
mkdirSync('artifacts/release', { recursive: true });
writeFileSync('artifacts/release/description.json', JSON.stringify({ description: pkg.description }));
writeFileSync('artifacts/release/topics.json', JSON.stringify({ names: pkg.keywords }));
JS

gh api --method PATCH repos/NathanielBrewer/svelte-sveltkit-template --input artifacts/release/description.json --jq .description
gh api --method PUT repos/NathanielBrewer/svelte-sveltkit-template/topics --input artifacts/release/topics.json --jq .names
```

The topics request replaces the list. Inspect current topics first and preserve any still-relevant topics before applying it. Verify the resulting About description and topics with `gh repo view NathanielBrewer/svelte-sveltkit-template --json description,repositoryTopics`.

## Create and publish the GitHub release

After the tag exists remotely and its exact commit's checks pass, create a draft to review:

```bash
gh release create v2.0.0 --repo NathanielBrewer/svelte-sveltkit-template --verify-tag --title 'v2.0.0 — Configurable SvelteKit starter' --notes-file docs/releases/v2.0.0.md --draft
```

Review the draft's target tag and rendered notes before publishing it. Publish only when authorized with `gh release edit v2.0.0 --repo NathanielBrewer/svelte-sveltkit-template --draft=false --latest`, then verify its URL, tag, commit and published state. Do not publish a release from an uncommitted working tree or let the CLI create an unverified tag implicitly.
