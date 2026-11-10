<script lang="ts">
	import { isActiveItem, isCurrentPath, type NavigationItem } from '#lib/navigation/navigation.ts';

	let {
		items,
		pathname,
		navigationKey = pathname,
		brand = __TEMPLATE_BRAND__,
		homeHref = '/'
	}: {
		items: NavigationItem[];
		pathname: string;
		navigationKey?: string;
		brand?: string;
		homeHref?: string;
	} = $props();

	let menuOpen = $state(false);
	let openDropdown = $state<string | null>(null);
	let navElement: HTMLElement;
	let menuToggle: HTMLButtonElement;

	function closeMenus() {
		menuOpen = false;
		openDropdown = null;
	}

	$effect(() => {
		void navigationKey;
		closeMenus();
	});

	function handleEscape(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		if (openDropdown) {
			const trigger = navElement.querySelector<HTMLButtonElement>(
				'[data-dropdown][aria-expanded="true"]'
			);
			openDropdown = null;
			trigger?.focus();
		} else if (menuOpen) {
			menuOpen = false;
			menuToggle.focus();
		}
	}
</script>

<svelte:window
	onkeydown={handleEscape}
	onpointerdown={(event) => {
		if (event.target instanceof Node && !navElement.contains(event.target)) closeMenus();
	}}
/>

<nav class="site-nav" aria-label="Primary" bind:this={navElement}>
	<div class="nav-inner">
		<a class="brand" href={homeHref} aria-label={`${brand} home`} onclick={closeMenus}>{brand}</a>
		<button
			bind:this={menuToggle}
			class="menu-toggle"
			type="button"
			aria-expanded={menuOpen}
			aria-controls="primary-navigation"
			aria-label={menuOpen ? 'Close menu' : 'Open menu'}
			onclick={() => {
				menuOpen = !menuOpen;
				if (!menuOpen) openDropdown = null;
			}}
		>
			<svg
				width="32"
				height="32"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				aria-hidden="true"
			>
				<path d={menuOpen ? 'M6 6l12 12M6 18L18 6' : 'M3 6h18M3 12h18M3 18h18'} />
			</svg>
		</button>
		<ul id="primary-navigation" class="nav-links" class:menu-open={menuOpen}>
			{#each items as item, index (item.href)}
				<li class="nav-item" class:active={isActiveItem(item, pathname)}>
					{#if item.children?.length}
						<button
							class="nav-trigger"
							type="button"
							data-dropdown
							aria-expanded={openDropdown === item.href}
							aria-controls={`navigation-submenu-${index}`}
							onclick={() => (openDropdown = openDropdown === item.href ? null : item.href)}
						>
							{item.label}<span
								class="chevron"
								class:expanded={openDropdown === item.href}
								aria-hidden="true"
							></span>
						</button>
						{#if openDropdown === item.href}
							<ul id={`navigation-submenu-${index}`} class="dropdown-panel">
								{#each item.children as child (child.href)}
									<li>
										<a
											href={child.href}
											class:active={isActiveItem(child, pathname)}
											aria-current={isCurrentPath(child.href, pathname) ? 'page' : undefined}
											onclick={closeMenus}>{child.label}</a
										>
									</li>
								{/each}
							</ul>
						{/if}
					{:else}
						<a
							href={item.href}
							aria-current={isCurrentPath(item.href, pathname) ? 'page' : undefined}
							onclick={closeMenus}>{item.label}</a
						>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
</nav>

<style>
	.site-nav {
		position: sticky;
		top: 0;
		z-index: 70;
		width: 100%;
		background: rgb(255 255 255 / 60%);
		backdrop-filter: blur(6px);
	}
	.nav-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 4.25rem;
		padding: 0 1.5rem;
	}
	.brand {
		font-family: var(--theme-font-family-heading);
		font-size: 1.25rem;
		text-decoration: none;
	}
	.nav-links,
	.dropdown-panel {
		list-style: none;
		margin: 0;
	}
	.nav-links {
		display: none;
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		max-height: calc(100dvh - 4.25rem);
		overflow-y: auto;
		padding: 1.5rem;
		background: rgb(255 255 255 / 96%);
		flex-direction: column;
		align-items: flex-end;
		gap: 1.5rem;
	}
	.nav-links.menu-open {
		display: flex;
	}
	.nav-item {
		position: relative;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	a,
	button {
		color: inherit;
	}
	.nav-links a,
	.nav-trigger {
		text-decoration: none;
		font: inherit;
	}
	.nav-trigger,
	.menu-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: transparent;
		border: 0;
		cursor: pointer;
	}
	.nav-trigger {
		padding: 0;
		text-transform: inherit;
		letter-spacing: inherit;
	}
	.menu-toggle {
		min-width: 44px;
		min-height: 44px;
	}
	.nav-item.active > a,
	.nav-item.active > .nav-trigger,
	.dropdown-panel a.active {
		text-decoration: underline;
		text-decoration-thickness: 2px;
		text-underline-offset: 0.2em;
	}
	.chevron {
		width: 0.5rem;
		height: 0.5rem;
		border-right: 2px solid currentColor;
		border-bottom: 2px solid currentColor;
		transform: rotate(45deg);
		margin-top: -0.25rem;
	}
	.chevron.expanded {
		transform: rotate(225deg);
		margin-top: 0.25rem;
	}
	.dropdown-panel {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 1rem;
		padding: 1rem 0.5rem 0;
	}
	.dropdown-panel a {
		display: block;
	}
	@media (min-width: 900px) {
		.nav-inner {
			padding: 0 4rem;
		}
		.menu-toggle {
			display: none;
		}
		.nav-links {
			display: flex;
			position: static;
			flex-direction: row;
			align-items: center;
			gap: 2rem;
			padding: 0;
			overflow: visible;
			background: transparent;
		}
		.dropdown-panel {
			position: absolute;
			top: calc(100% + 1.3rem);
			right: -1rem;
			width: max-content;
			max-width: min(24rem, 80vw);
			padding: 1rem;
			background: rgb(255 255 255 / 96%);
			border: 1px solid rgb(var(--color-surface-200));
			align-items: flex-start;
		}
	}
</style>
