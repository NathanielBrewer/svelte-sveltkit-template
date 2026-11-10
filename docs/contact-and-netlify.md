# Contact and Netlify hosting

The contact page adapts `~/dev/website`'s form into a shared Svelte 5 component using the template's light palettes. It includes required name/email/subject/message fields, subject suggestions, a `contactSubject` URL prefill, a company-website honeypot, a pending state, success reset and failure retry without losing the message. Labels have instance-specific IDs and status updates use a live region. JavaScript is required, as in the source form.

Import `src/lib/components/contact/ContactForm.svelte` directly wherever needed. Its optional props are `heading`, `intro`, `defaultSubject`, `subjectSuggestions`, and `context`. Customize the neutral example subjects in `src/routes/contact/+page.svelte`. Avoid putting personal data in subject-prefill links; URLs can appear in hosting logs. The component posts JSON to `/api/contact`; another backend can implement that same response contract.

## Hosting setup

`vite.config.ts` explicitly uses `@sveltejs/adapter-netlify`. `netlify.toml` builds with `npm run build`, publishes `build`, and selects Node 24 to match CI. The adapter generates Node serverless functions and routing configuration under ignored `.netlify/v1`. Do not add a catch-all SPA redirect: the adapter owns server routing. The regular build also supports local Vite preview.

On the intended Netlify site:

1. Connect this repository and review its production branch and deploy-preview settings. The supplied GitHub workflow validates only; Netlify's Git integration handles deployment separately. No site has been created or deployed by adding this configuration.
2. Enable **form detection** in Netlify Forms and deploy. Verify the `contact` form appears. Netlify detects static HTML at deployment time; `static/contact-form.html` is its hidden blueprint. Keep its form name, fields and honeypot aligned with `src/lib/contact/schema.ts`; a regression test checks them. See [Netlify Forms setup](https://docs.netlify.com/manage/forms/setup/).
3. Set private environment variables available to **Functions**: `CONTACT_PROVIDER=netlify` and `NETLIFY_FORMS_ENDPOINT=https://YOUR-SITE.netlify.app`. The endpoint selects the site origin; submissions always target `/contact-form.html`. HTTPS is required. Without an explicit endpoint, `URL` then `DEPLOY_URL` are used if available at runtime. Do not assume build-only variables reach Functions. Redeploy after changes. SvelteKit's `src/env.ts` declares these optional runtime variables; none enter the browser bundle.
4. Configure the `contact` form's submission notifications and recipient in Netlify. No sender address, recipient field, API key or source site's branding is embedded. Netlify stores submissions; its notification setup controls email delivery.
5. In a controlled environment, send a recognizable test message. Confirm both the Netlify submission record and the notification in the intended inbox, then check spam classification and honeypot behavior. Browser success means submission acceptance, not guaranteed email delivery. Review Netlify's current plan limits and retention for your site.

Keep deployment-context variables separate. A preview must use its own detected form/site if you want isolated submissions; pointing a preview at the production origin sends into the production form. Leave `CONTACT_PROVIDER` unset in CI and normal local development. The endpoint returns HTTP 503 and the UI shows a retry message instead of claiming delivery. Use mocks for local submission tests. Netlify Forms does not run inside Vite dev/preview.

The source also has Postmark, Mailchimp, HubSpot and SES backends. This extraction includes the requested Netlify adapter only; it does not bundle or configure those mail providers. For a different hosting target, replace the build adapter and the server-side contact delivery adapter, preserving the form's API contract.

## Validation and operational evidence

The API validates types, required fields, lengths and email shape; bounds streamed JSON to 32 KiB; rejects foreign browser origins and non-JSON requests; silently discards honeypot submissions; and uses a ten-second upstream timeout. Netlify's spam filtering remains necessary: the honeypot and origin check are not rate limiting or authentication. No custom CAPTCHA or application rate limiter is included.

Failures return generic messages and call the shared `reportError` helper with a fixed diagnostic and operation/provider identifiers. Raw upstream exceptions, form contents, addresses and response bodies are never logged by this integration. Configure optional Sentry as described in [Observability](observability.md). Hosting/provider logs and submission storage have their own access and retention settings.

Unit tests cover validation, configuration, encoded delivery, privacy, failure paths and component behavior. Production browser tests cover required fields, prefill, retry and success on desktop/mobile with mocked delivery, plus an actual unconfigured API response. Accessibility runs include the form across all selected palettes. `npm run check:build`, already required by CI, checks the published blueprint and directly invokes the generated Netlify function for contact SSR and invalid-input rejection without sending a message. `npm run test:build-matrix` also builds the Netlify output for minimal and Sentry-enabled configurations.

These local checks do not prove Netlify's form detection, spam filtering, runtime environment, notification delivery, deployment permissions or live Sentry ingestion. Confirm those on the deployed site before relying on the contact channel.
