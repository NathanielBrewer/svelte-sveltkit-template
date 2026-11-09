import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { sourceControlSamples } from '../../scripts/accessibility/source-controls.mjs';

const directories = [];
function fixture(files) {
	const root = mkdtempSync(join(tmpdir(), 'template-a11y-'));
	directories.push(root);
	for (const [name, source] of Object.entries(files)) {
		writeFileSync(join(root, name), source);
	}
	return root;
}

afterEach(() =>
	directories.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }))
);

describe('source control accessibility sampling', () => {
	it('extracts and deduplicates static controls, including nested components', () => {
		const root = fixture({
			'One.svelte':
				'<button class="btn   variant-filled-primary">Save</button>\n<button class="btn variant-filled-primary">Again</button>\n<a href="/">Home</a>'
		});
		mkdirSync(join(root, 'nested'));
		writeFileSync(
			join(root, 'nested/Two.svelte'),
			'<a class="btn variant-filled-primary" href="/">Link</a>'
		);
		const { samples, skipped } = sourceControlSamples(root);
		expect(samples).toHaveLength(3);
		expect(samples[0]).toEqual({
			tagName: 'button',
			className: 'btn variant-filled-primary',
			label: 'One.svelte:1'
		});
		expect(samples.some((item) => item.label.includes('Two.svelte'))).toBe(true);
		expect(skipped).toEqual([]);
	});

	it('ignores comments and reports dynamic or spread controls instead of claiming coverage', () => {
		const root = fixture({
			'Dynamic.svelte':
				'<script>let active = true; let props = {};</script>\n<!-- <button class="bad">Comment</button> -->\n<button class={active ? "one" : "two"}>Dynamic</button>\n<a {...props}>Spread</a>'
		});
		const result = sourceControlSamples(root);
		expect(result.samples).toEqual([]);
		expect(result.skipped).toEqual(['Dynamic.svelte:3', 'Dynamic.svelte:4']);
	});

	it('fails on invalid component syntax', () => {
		expect(() => sourceControlSamples(fixture({ 'Broken.svelte': '<button>' }))).toThrow();
	});
});
