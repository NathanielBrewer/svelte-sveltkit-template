<script lang="ts">
	let {
		label,
		tone = 'neutral'
	}: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'error' } = $props();
</script>

<span data-template-component="status-badge" class="status-badge" data-tone={tone}>{label}</span>

<style>
	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		background: rgb(var(--color-surface-200));
		color: rgb(var(--color-surface-900));
		font-size: 0.875rem;
	}
	[data-tone='success'] {
		background: rgb(var(--color-success-100));
		color: rgb(var(--color-success-900));
	}
	[data-tone='warning'] {
		background: rgb(var(--color-warning-100));
		color: rgb(var(--color-warning-900));
	}
	[data-tone='error'] {
		background: rgb(var(--color-error-100));
		color: rgb(var(--color-error-900));
	}
</style>
