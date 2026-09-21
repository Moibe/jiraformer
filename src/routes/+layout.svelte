<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Sidebar from '$lib/Sidebar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Sidebar />

<main>
	{@render children()}
</main>

<style>
	main {
		min-height: 100vh;
		margin-left: calc(var(--sidebar-width) + 1.5rem);
		padding: 2.5rem 2rem;
		transition: margin-left 0.15s ease;
	}
</style>
