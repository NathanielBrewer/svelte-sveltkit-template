/** @type { import("eslint").Linter.Config } */
module.exports = {
	root: true,
	globals: {
		__TEMPLATE_BRAND__: 'readonly',
		__TEMPLATE_DEFAULT_THEME__: 'readonly',
		__TEMPLATE_THEME_OPTIONS__: 'readonly',
		__SENTRY_DSN__: 'readonly'
	},
	ignorePatterns: ['build', '.svelte-kit', 'coverage', 'package', 'artifacts'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:svelte/recommended',
		'prettier'
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 'latest',
		extraFileExtensions: ['.svelte']
	},
	env: {
		browser: true,
		es2022: true,
		node: true
	},
	overrides: [
		{
			files: ['**/*.svelte'],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser'
			}
		},
		{
			files: ['**/*.test.ts', '**/*.spec.ts'],
			env: {
				node: true
			}
		}
	]
};
