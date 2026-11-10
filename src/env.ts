import { defineEnvVars } from '@sveltejs/kit/env';

const optional = { schema: (value: string | undefined) => value };
// Explicit private runtime declarations allow these to be supplied after building.
export const variables = defineEnvVars({
	CONTACT_PROVIDER: optional,
	NETLIFY_FORMS_ENDPOINT: optional,
	URL: optional,
	DEPLOY_URL: optional
});
