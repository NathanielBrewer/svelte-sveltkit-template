import { describe, expect, it, vi } from 'vitest';
import {
	runDependabotMerge,
	validateDependencyUpdate
} from '../../scripts/dependabot-automerge.mjs';
const repo = { owner: 'example', repo: 'template' };
const full = 'example/template';
const done = { status: 'completed', conclusion: 'success' };
const steps = [
	'Install locked dependencies',
	'Check, lint, unit coverage, and accessibility',
	'Build',
	'Production browser tests',
	'Check build contents',
	'Check optional build matrix'
];
function manifest(version = '1.0.0') {
	return { name: 'example', devDependencies: { example: `^${version}` } };
}
function lock(version = '1.0.0') {
	return {
		lockfileVersion: 3,
		packages: {
			'': { devDependencies: { example: `^${version}` } },
			'node_modules/example': { version }
		}
	};
}
function fixture() {
	const state = {
		pr: {
			number: 1,
			state: 'open',
			draft: false,
			merged: false,
			mergeable: true,
			changed_files: 2,
			labels: [],
			user: { login: 'dependabot[bot]', type: 'Bot' },
			head: { sha: 'head', repo: { full_name: full } },
			base: { ref: 'main', repo: { full_name: full } }
		},
		main: 'base',
		reviews: [],
		files: ['package.json', 'package-lock.json'].map((filename) => ({
			filename,
			status: 'modified'
		})),
		comparison: { status: 'ahead', behind_by: 0, merge_base_commit: { sha: 'base' } },
		runs: [
			{
				id: 1,
				...done,
				head_sha: 'head',
				event: 'pull_request',
				head_repository: { full_name: full },
				path: '.github/workflows/validate.yml',
				pull_requests: [{ number: 1 }],
				created_at: '2026-11-09T10:00:00Z'
			}
		],
		jobs: [{ name: 'validate', ...done, steps: steps.map((name) => ({ name, ...done })) }],
		merges: 0,
		dispatches: 0
	};
	const github = {
		request: vi.fn(async (route, params) => {
			if (route.includes('/contents/')) {
				const value =
					params.path === 'package.json'
						? manifest(params.ref === 'base' ? '1.0.0' : '1.1.0')
						: lock(params.ref === 'base' ? '1.0.0' : '1.1.0');
				return {
					data: {
						type: 'file',
						encoding: 'base64',
						content: Buffer.from(JSON.stringify(value)).toString('base64')
					}
				};
			}
			if (route.startsWith('PUT')) {
				state.merges++;
				expect(params.sha).toBe('head');
				return { data: { merged: true } };
			}
			if (route.startsWith('POST')) {
				state.dispatches++;
				return { data: {} };
			}
			if (route.includes('/git/ref/')) return { data: { object: { sha: state.main } } };
			if (route.includes('/compare/')) return { data: state.comparison };
			if (route.includes('/pulls/')) return { data: state.pr };
			throw Error(`Unexpected request: ${route}`);
		}),
		paginate: vi.fn(async (route) => {
			if (route.endsWith('/files')) return state.files;
			if (route.endsWith('/reviews')) return state.reviews;
			if (route.endsWith('/jobs')) return state.jobs;
			if (route.endsWith('/runs')) return state.runs;
			if (route.endsWith('/pulls')) return [state.pr];
			throw Error(`Unexpected list: ${route}`);
		})
	};
	return {
		state,
		github,
		run: (options = {}) =>
			runDependabotMerge({ github, repo, enabled: true, dryRun: false, log: () => {}, ...options })
	};
}
describe('Dependabot merge gates', () => {
	it('merges the verified head SHA once and dispatches main validation', async () => {
		const f = fixture();
		await f.run();
		expect(f.state.merges).toBe(1);
		expect(f.state.dispatches).toBe(1);
	});
	it('does not write in dry run or when disabled', async () => {
		const f = fixture();
		await f.run({ dryRun: true });
		await f.run({ enabled: false });
		expect(f.state.merges).toBe(0);
	});
	it.each([
		['draft', (s) => (s.pr.draft = true)],
		['fork', (s) => (s.pr.head.repo.full_name = 'other/repo')],
		['conflict', (s) => (s.pr.mergeable = false)],
		['hold label', (s) => (s.pr.labels = [{ name: 'do-not-merge' }])],
		['behind main', (s) => (s.comparison.behind_by = 1)],
		['source changes', (s) => (s.files[0].filename = 'src/app.html')],
		['missing lockfile', (s) => (s.files = s.files.slice(0, 1))],
		['missing CI', (s) => (s.runs = [])],
		['failed CI', (s) => (s.runs[0].conclusion = 'failure')],
		['old SHA', (s) => (s.runs[0].head_sha = 'old')],
		['rerun pending', (s) => (s.runs[0].status = 'in_progress')],
		[
			'missing browser check',
			(s) =>
				(s.jobs[0].steps = s.jobs[0].steps.filter((x) => x.name !== 'Production browser tests'))
		],
		[
			'requested changes',
			(s) => (s.reviews = [{ id: 1, state: 'CHANGES_REQUESTED', user: { login: 'reviewer' } }])
		],
		['wrong workflow', (s) => (s.runs[0].path = '.github/workflows/other.yml')]
	])('blocks %s', async (_name, change) => {
		const f = fixture();
		change(f.state);
		const results = await f.run();
		expect(f.state.merges).toBe(0);
		expect(results[0].reason).not.toMatch(/^merged/);
	});
	it('does not allow an API error to authorize a merge', async () => {
		const f = fixture();
		f.github.request.mockRejectedValue(Error('API unavailable'));
		await expect(f.run()).rejects.toThrow('API unavailable');
		expect(f.state.merges).toBe(0);
	});
	it.each(['2.0.0', '1.0.0-beta.1', '0.9.0'])('rejects unsupported version %s', (version) =>
		expect(() =>
			validateDependencyUpdate(manifest(), manifest(version), lock(), lock(version))
		).toThrow()
	);
	it('rejects changes to scripts, even with a version update', () =>
		expect(() =>
			validateDependencyUpdate(
				manifest(),
				{ ...manifest('1.1.0'), scripts: { test: 'echo pass' } },
				lock(),
				lock('1.1.0')
			)
		).toThrow());
});
