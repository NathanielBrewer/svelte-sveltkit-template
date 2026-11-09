import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'svelte/compiler';

// Compile the template structure rather than matching comments or script strings as HTML.
export function sourceControlSamples(sourceRoot) {
	const samples = [];
	const skipped = [];
	function visitDirectory(directory) {
		for (const entry of readdirSync(directory, { withFileTypes: true })) {
			const path = join(directory, entry.name);
			if (entry.isDirectory()) visitDirectory(path);
			else if (entry.name.endsWith('.svelte')) {
				const source = readFileSync(path, 'utf8');
				function visit(node) {
					if (!node || typeof node !== 'object') return;
					if (node.type === 'RegularElement' && ['button', 'a'].includes(node.name)) {
						const label = `${relative(sourceRoot, path)}:${source.slice(0, node.start).split('\n').length}`;
						const attribute = node.attributes.find(
							(attr) => attr.type === 'Attribute' && attr.name === 'class'
						);
						if (
							node.attributes.some((attr) => attr.type === 'SpreadAttribute') ||
							(attribute &&
								(!Array.isArray(attribute.value) ||
									attribute.value.some((part) => part.type !== 'Text')))
						) {
							skipped.push(label);
						} else {
							samples.push({
								tagName: node.name,
								className: attribute
									? attribute.value
											.map((part) => part.data)
											.join('')
											.replace(/\s+/g, ' ')
											.trim()
									: '',
								label
							});
						}
					}
					for (const [key, value] of Object.entries(node)) {
						if (['loc', 'metadata'].includes(key)) continue;
						if (Array.isArray(value)) value.forEach(visit);
						else if (value && typeof value === 'object') visit(value);
					}
				}
				visit(parse(source, { modern: true }));
			}
		}
	}
	visitDirectory(sourceRoot);
	return {
		samples: samples.filter(
			(sample, index, all) =>
				all.findIndex(
					(candidate) =>
						candidate.tagName === sample.tagName && candidate.className === sample.className
				) === index
		),
		skipped
	};
}
