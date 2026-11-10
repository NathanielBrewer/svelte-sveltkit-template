// Adapted from nbplants/live-site-nbplants; deployment-provider gates replaced with production browser checks.
import { isDeepStrictEqual } from 'node:util';

const BOT = 'dependabot[bot]';
const CI = {
	file: 'validate.yml',
	event: 'pull_request',
	job: 'validate',
	steps: [
		'Install locked dependencies',
		'Check, lint, unit coverage, and accessibility',
		'Build',
		'Production browser tests',
		'Check build contents',
		'Check optional build matrix'
	]
};
const success = (item) => item?.status === 'completed' && item.conclusion === 'success';

class Blocked extends Error {}
function requireCondition(condition, message) {
	if (!condition) throw new Blocked(message);
}

// Unknown versions, prereleases and aliases are left for manual review.
function version(value) {
	const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(value);
	return match ? match.slice(1).map(Number) : null;
}

export function validateDependencyUpdate(before, after, oldLock, newLock) {
	const sections = ['dependencies', 'devDependencies'];
	const withoutDependencies = (manifest) =>
		Object.fromEntries(Object.entries(manifest).filter(([key]) => !sections.includes(key)));
	requireCondition(
		isDeepStrictEqual(withoutDependencies(before), withoutDependencies(after)),
		'package.json changes more than dependency versions'
	);
	requireCondition(
		[2, 3].includes(oldLock.lockfileVersion) &&
			oldLock.lockfileVersion === newLock.lockfileVersion &&
			oldLock.packages?.[''] &&
			newLock.packages?.[''],
		'unsupported or changed lockfile format'
	);
	let updates = 0;
	for (const section of sections) {
		const oldDependencies = before[section] || {};
		const newDependencies = after[section] || {};
		requireCondition(
			isDeepStrictEqual(Object.keys(oldDependencies).sort(), Object.keys(newDependencies).sort()),
			'dependencies added or removed'
		);
		requireCondition(
			isDeepStrictEqual(newDependencies, newLock.packages[''][section] || {}),
			'manifest and lockfile disagree'
		);
		for (const name of Object.keys(oldDependencies)) {
			const previous = oldLock.packages?.[`node_modules/${name}`]?.version;
			const next = newLock.packages?.[`node_modules/${name}`]?.version;
			if (previous === next && oldDependencies[name] === newDependencies[name]) continue;
			const from = version(previous);
			const to = version(next);
			requireCondition(
				from &&
					to &&
					/^[~^]?\d+\.\d+\.\d+$/.test(newDependencies[name]) &&
					from[0] === to[0] &&
					(to[1] > from[1] || (to[1] === from[1] && to[2] > from[2])),
				'major, prerelease, downgrade, or unclassified dependency change'
			);
			updates += 1;
		}
	}
	if (updates === 0) validateIndirectUpdate(before, after, oldLock, newLock);
}

// A deliberately narrow fallback for lockfile-only security updates like #262.
// Dependency graph or metadata changes still require manual review.
function validateIndirectUpdate(before, after, oldLock, newLock) {
	const omit = (value, keys) =>
		Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
	requireCondition(
		isDeepStrictEqual(before, after) &&
			newLock.lockfileVersion === 3 &&
			isDeepStrictEqual(omit(oldLock, ['packages']), omit(newLock, ['packages'])) &&
			isDeepStrictEqual(
				Object.keys(oldLock.packages).sort(),
				Object.keys(newLock.packages).sort()
			) &&
			isDeepStrictEqual(oldLock.packages[''], newLock.packages['']),
		'indirect update changes manifest, lockfile metadata, or package inventory'
	);
	let updates = 0;
	for (const [path, next] of Object.entries(newLock.packages)) {
		const previous = oldLock.packages[path];
		if (isDeepStrictEqual(previous, next)) continue;
		const from = version(previous.version);
		const to = version(next.version);
		requireCondition(
			from &&
				to &&
				from[0] === to[0] &&
				(to[1] > from[1] || (to[1] === from[1] && to[2] > from[2])),
			'indirect update is not a stable patch/minor upgrade'
		);
		requireCondition(
			isDeepStrictEqual(
				omit(previous, ['version', 'resolved', 'integrity']),
				omit(next, ['version', 'resolved', 'integrity'])
			),
			'indirect update changes package metadata or dependency graph'
		);
		const name = path.split('node_modules/').at(-1);
		requireCondition(
			path.startsWith('node_modules/') &&
				/^(@[^/]+\/)?[^/]+$/.test(name) &&
				[previous, next].every(
					(entry) =>
						entry.resolved ===
							`https://registry.npmjs.org/${name}/-/${name.split('/').at(-1)}-${entry.version}.tgz` &&
						typeof entry.integrity === 'string' &&
						/^sha512-[A-Za-z0-9+/]{86}==$/.test(entry.integrity)
				),
			'indirect update must use npm registry tarballs with SHA-512 integrity'
		);
		updates += 1;
	}
	requireCondition(updates > 0, 'no stable patch/minor update found; review manually');
}

function validatePR(pr, repository) {
	requireCondition(
		pr.state === 'open' &&
			!pr.draft &&
			!pr.merged &&
			pr.user?.login === BOT &&
			pr.user?.type === 'Bot' &&
			pr.head?.repo?.full_name === repository &&
			pr.base?.repo?.full_name === repository &&
			pr.base.ref === 'main',
		'not an open, same-repository Dependabot PR targeting main'
	);
	requireCondition(
		!pr.labels?.some((label) => label.name === 'do-not-merge'),
		'do-not-merge label is set'
	);
	requireCondition(pr.mergeable === true, 'mergeability is unknown or PR has conflicts');
}

function apiFor(github, repo) {
	return {
		get: async (route, params = {}) =>
			(await github.request(`GET ${route}`, { ...repo, ...params })).data,
		list: (route, params = {}) =>
			github.paginate(`GET ${route}`, { ...repo, per_page: 100, ...params }),
		write: async (method, route, params) =>
			(await github.request(`${method} ${route}`, { ...repo, ...params })).data
	};
}
const ROOT = '/repos/{owner}/{repo}';

async function readJson(api, ref, path) {
	const file = await api.get(`${ROOT}/contents/{path}`, { ref, path });
	requireCondition(
		file.type === 'file' && file.encoding === 'base64',
		`cannot read ${path} at the tested revision`
	);
	return JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
}

async function passingWorkflow(api, pr, config, repository) {
	const runs = await api.list(`${ROOT}/actions/workflows/{workflow_id}/runs`, {
		workflow_id: config.file,
		head_sha: pr.head.sha,
		event: config.event
	});
	requireCondition(
		runs.every((run) => run.status === 'completed'),
		`${config.file}: a run or rerun is still pending`
	);
	// A rerun retains its ID. Its new start time must take precedence over a
	// successful run with a higher ID that happened before the rerun.
	const run = [...runs].sort(
		(a, b) =>
			Date.parse(b.run_started_at || b.created_at) - Date.parse(a.run_started_at || a.created_at) ||
			b.id - a.id
	)[0];
	requireCondition(
		success(run) &&
			run.head_sha === pr.head.sha &&
			run.event === config.event &&
			run.head_repository?.full_name === repository &&
			run.path?.split('@')[0] === `.github/workflows/${config.file}`,
		`${config.file}: latest run for this commit is missing or unsuccessful`
	);
	if (config === CI) {
		requireCondition(
			run.pull_requests?.some((entry) => entry.number === pr.number),
			'CI run is not associated with this PR'
		);
	}
	const jobs = await api.list(`${ROOT}/actions/runs/{run_id}/jobs`, {
		run_id: run.id,
		filter: 'latest'
	});
	const matches = jobs.filter((job) => job.name === config.job);
	requireCondition(
		matches.length === 1 &&
			success(matches[0]) &&
			config.steps.every((name) =>
				matches[0].steps?.some((step) => step.name === name && success(step))
			),
		`${config.job}: required job or test step did not succeed`
	);
	return run;
}

async function evaluate(api, number, repository) {
	const pr = await api.get(`${ROOT}/pulls/{pull_number}`, {
		pull_number: number
	});
	validatePR(pr, repository);
	const main = await api.get(`${ROOT}/git/ref/heads/main`);
	const baseSha = main.object.sha;
	const comparison = await api.get(`${ROOT}/compare/{basehead}`, {
		basehead: `${baseSha}...${pr.head.sha}`
	});
	requireCondition(
		comparison.status === 'ahead' &&
			comparison.behind_by === 0 &&
			comparison.merge_base_commit?.sha === baseSha,
		'branch is behind main; rebase with Dependabot and rerun tests'
	);
	const files = await api.list(`${ROOT}/pulls/{pull_number}/files`, {
		pull_number: number
	});
	requireCondition(
		files.length > 0 &&
			files.length === pr.changed_files &&
			files.some((file) => file.filename === 'package-lock.json') &&
			files.every(
				(file) =>
					['package.json', 'package-lock.json'].includes(file.filename) &&
					file.status === 'modified'
			),
		'PR changes files other than the npm manifest and lockfile'
	);
	const [before, after, oldLock, newLock] = await Promise.all([
		readJson(api, baseSha, 'package.json'),
		readJson(api, pr.head.sha, 'package.json'),
		readJson(api, baseSha, 'package-lock.json'),
		readJson(api, pr.head.sha, 'package-lock.json')
	]);
	validateDependencyUpdate(before, after, oldLock, newLock);
	const reviews = await api.list(`${ROOT}/pulls/{pull_number}/reviews`, {
		pull_number: number
	});
	const reviewerStates = new Map();
	for (const review of [...reviews].sort((a, b) => a.id - b.id)) {
		if (['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(review.state))
			reviewerStates.set(review.user?.login, review.state);
	}
	requireCondition(
		![...reviewerStates.values()].includes('CHANGES_REQUESTED'),
		'a reviewer has requested changes'
	);
	await passingWorkflow(api, pr, CI, repository);
	return { pr, baseSha };
}

export async function runDependabotMerge({
	github,
	repo,
	enabled = false,
	dryRun = true,
	log = console.log
}) {
	const repository = `${repo.owner}/${repo.repo}`;
	if (!repo.owner || !repo.repo) throw new Error('Repository identity is required');
	if (!enabled && !dryRun) return [];
	const api = apiFor(github, repo);
	const pulls = await api.list(`${ROOT}/pulls`, {
		state: 'open',
		base: 'main',
		sort: 'created',
		direction: 'asc'
	});
	const results = [];
	const record = (number, reason) => {
		results.push({ number, reason });
		log(`PR #${number}: ${reason}`);
	};
	for (const candidate of pulls.filter((pr) => pr.user?.login === BOT)) {
		try {
			const { pr, baseSha } = await evaluate(api, candidate.number, repository);
			if (dryRun) {
				record(pr.number, 'eligible (dry run; no merge requested)');
				continue;
			}
			// Re-read live results to catch reruns or changes during the first read.
			// The merge API also atomically rejects a changed PR head SHA.
			const fresh = await evaluate(api, pr.number, repository);
			requireCondition(
				fresh.pr.head.sha === pr.head.sha && fresh.baseSha === baseSha,
				'PR or main changed during verification; try again'
			);
			const finalPR = await api.get(`${ROOT}/pulls/{pull_number}`, {
				pull_number: pr.number
			});
			validatePR(finalPR, repository);
			requireCondition(
				finalPR.head.sha === pr.head.sha,
				'PR changed during verification; try again'
			);
			const main = await api.get(`${ROOT}/git/ref/heads/main`);
			requireCondition(
				main.object.sha === baseSha,
				'main advanced during verification; rebase and retest'
			);
			const merged = await api.write('PUT', `${ROOT}/pulls/{pull_number}/merge`, {
				pull_number: pr.number,
				sha: pr.head.sha,
				merge_method: 'squash'
			});
			requireCondition(merged.merged === true, 'GitHub did not merge the PR');
			record(pr.number, 'merged after validation and production browser tests passed');
			// GITHUB_TOKEN merges do not trigger push workflows. Preserve main CI
			// explicitly after a merge by GITHUB_TOKEN.
			try {
				await api.write('POST', `${ROOT}/actions/workflows/{workflow_id}/dispatches`, {
					workflow_id: CI.file,
					ref: 'main'
				});
			} catch {
				throw new Error(
					`PR #${pr.number} merged, but post-merge CI could not be dispatched; run Frontend CI on main manually`
				);
			}
			break; // main advanced: no other PR may reuse checks against the old base.
		} catch (error) {
			if (!(error instanceof Blocked)) throw error; // API errors never authorize a merge.
			record(candidate.number, error.message);
		}
	}
	if (!results.length) log('No open Dependabot PRs to evaluate.');
	return results;
}
