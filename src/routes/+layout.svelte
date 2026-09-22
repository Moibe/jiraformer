<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import TopNav from '$lib/TopNav.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<TopNav />

<main>
	{@render children()}
</main>

<style>
	main {
		min-height: 100vh;
		padding: 6.25rem 2rem 2.5rem;
	}
</style>
