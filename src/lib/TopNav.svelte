<script lang="ts">
	import { page } from '$app/state';
</script>

<header class="topnav">
	<div class="brand">
		<div class="logo">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
			</svg>
		</div>
		<span class="brand-name">Jiraformer</span>
	</div>

	<nav>
		<a href="/" class="nav-item" class:active={page.url.pathname === '/'}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M9 5h6M9 5a2 2 0 012-2h0a2 2 0 012 2m-4 0a2 2 0 00-2 2v0a2 2 0 002 2h4a2 2 0 002-2v0a2 2 0 00-2-2M5 9v10a2 2 0 002 2h10a2 2 0 002-2V9M9 13h6M9 17h6"
				/>
			</svg>
			<span>Generar texto</span>
		</a>
		<a href="/tareas" class="nav-item" class:active={page.url.pathname === '/tareas'}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"
				/>
			</svg>
			<span>Tareas</span>
		</a>
	</nav>
</header>

<style>
	.topnav {
		position: fixed;
		top: 0.75rem;
		left: 0.75rem;
		right: 0.75rem;
		height: 4rem;
		display: flex;
		align-items: center;
		gap: 2rem;
		padding: 0 1.25rem;
		border-radius: 16px;
		border: 1px solid var(--sidebar-border);
		background: linear-gradient(120deg, #de0b80 0%, #6554c0 100%);
		color: var(--sidebar-foreground);
		box-shadow: 0 8px 32px rgba(101, 84, 192, 0.28);
		backdrop-filter: blur(16px);
		z-index: 20;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.logo {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.2);
		flex-shrink: 0;
	}

	.brand-name {
		font-weight: 600;
		font-size: 0.95rem;
		white-space: nowrap;
	}

	nav {
		display: flex;
		gap: 0.4rem;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.9rem;
		border-radius: 10px;
		font-size: 0.875rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.85);
		white-space: nowrap;
		transition: background 0.15s ease;
	}

	.nav-item:hover {
		background: rgba(255, 255, 255, 0.12);
	}

	.nav-item.active {
		background: rgba(255, 255, 255, 0.22);
		color: #ffffff;
	}
</style>
