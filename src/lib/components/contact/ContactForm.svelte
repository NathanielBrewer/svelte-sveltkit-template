<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { contactLimits, type ContactPayload } from '#lib/contact/schema.ts';
	let {
		heading = 'Contact',
		intro = 'Send a question or tell us about your project.',
		defaultSubject = 'General question',
		subjectSuggestions = [],
		context = ''
	}: {
		heading?: string;
		intro?: string;
		defaultSubject?: string;
		subjectSuggestions?: string[];
		context?: string;
	} = $props();
	const id = $props.id();
	let initialSubject = $state(untrack(() => defaultSubject));
	const blank = (): ContactPayload => ({
		name: '',
		email: '',
		subject: initialSubject,
		message: '',
		context,
		website: ''
	});
	let payload = $state(blank());
	let status = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
	let statusMessage = $state('');
	onMount(() => {
		const subject = new URLSearchParams(location.search).get('contactSubject')?.trim();
		if (subject && subject.length <= contactLimits.subject)
			initialSubject = payload.subject = subject;
	});
	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (status === 'submitting') return;
		status = 'submitting';
		statusMessage = '';
		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...payload, context }),
				signal: AbortSignal.timeout(15_000)
			});
			// Do not render arbitrary upstream errors or accidentally treat an HTML fallback as delivery.
			const body = await response.json();
			if (!response.ok || typeof body.message !== 'string') throw new Error('Send failed');
			status = 'success';
			statusMessage = 'Message received. Thank you for getting in touch.';
			payload = blank();
		} catch {
			status = 'error';
			statusMessage = 'The message could not be sent. Please try again later.';
		}
	}
</script>

<section class="contact-form content-panel" aria-labelledby={`${id}-heading`}>
	<h1 id={`${id}-heading`} class="h1">{heading}</h1>
	<p>{intro}</p>
	<noscript><p>JavaScript is required to send this form.</p></noscript>
	<form onsubmit={submit} aria-busy={status === 'submitting'}>
		<label for={`${id}-name`}>Name</label>
		<input
			id={`${id}-name`}
			name="name"
			type="text"
			autocomplete="name"
			required
			maxlength={contactLimits.name}
			bind:value={payload.name}
		/>
		<label for={`${id}-email`}>Email</label>
		<input
			id={`${id}-email`}
			name="email"
			type="email"
			autocomplete="email"
			required
			maxlength={contactLimits.email}
			bind:value={payload.email}
		/>
		<label for={`${id}-subject`}>Subject</label>
		{#if subjectSuggestions.length}
			<select id={`${id}-subject`} name="subject" required bind:value={payload.subject}>
				{#if !subjectSuggestions.includes(payload.subject)}<option value={payload.subject}
						>{payload.subject}</option
					>{/if}
				{#each subjectSuggestions as subject}<option value={subject}>{subject}</option>{/each}
			</select>
		{:else}
			<input
				id={`${id}-subject`}
				name="subject"
				type="text"
				required
				maxlength={contactLimits.subject}
				bind:value={payload.subject}
			/>
		{/if}
		<label for={`${id}-message`}>Message</label>
		<textarea
			id={`${id}-message`}
			name="message"
			rows="6"
			required
			maxlength={contactLimits.message}
			bind:value={payload.message}
		></textarea>
		<div class="honeypot" aria-hidden="true">
			<label for={`${id}-website`}>Company website</label>
			<input
				id={`${id}-website`}
				name="website"
				type="text"
				tabindex="-1"
				autocomplete="off"
				maxlength={contactLimits.website}
				bind:value={payload.website}
			/>
		</div>
		<button class="btn variant-filled-primary" type="submit" disabled={status === 'submitting'}
			>{status === 'submitting' ? 'Sending…' : 'Send message'}</button
		>
		<p role="status" class="status" data-state={status}>{statusMessage}</p>
	</form>
</section>

<style>
	.contact-form {
		padding: 2rem;
		max-width: 42rem;
		margin: 0 auto;
	}
	h1 {
		margin-bottom: 1rem;
	}
	form {
		display: flex;
		flex-direction: column;
		margin-top: 1.5rem;
	}
	label {
		font-weight: 600;
		margin-bottom: 0.375rem;
	}
	input,
	select,
	textarea {
		width: 100%;
		min-width: 0;
		padding: 0.75rem;
		margin-bottom: 1rem;
		color: rgb(var(--color-surface-900));
		background: rgb(var(--color-surface-50));
		border: 1px solid rgb(var(--color-surface-600));
		border-radius: var(--theme-rounded-base);
	}
	textarea {
		resize: vertical;
		min-height: 9rem;
	}
	button {
		align-self: flex-start;
	}
	.status {
		min-height: 1.5rem;
		margin-top: 1rem;
	}
	.honeypot {
		position: absolute;
		left: -10000px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}
	@media (max-width: 480px) {
		.contact-form {
			padding: 1rem;
		}
	}
</style>
