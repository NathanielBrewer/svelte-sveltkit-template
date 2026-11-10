<script lang="ts">
	import ContactForm from '#lib/components/contact/ContactForm.svelte';
</script>

<svelte:head>
	<title>Contact | Starter template</title>
	<meta name="description" content="Send a question or tell us about your project." />
</svelte:head>

<div class="mx-auto w-full max-w-6xl px-6 py-12">
	<ContactForm
		subjectSuggestions={['General question', 'Project enquiry', 'Support request']}
		context="Contact page"
	/>
</div>
