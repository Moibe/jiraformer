<script lang="ts">
	let collapsed = $state(false);
	let sidebarEl: HTMLElement | undefined = $state();
	let tiltX = $state(0);
	let tiltY = $state(0);

	function handleMouseMove(e: MouseEvent) {
		if (!sidebarEl) return;
		const rect = sidebarEl.getBoundingClientRect();
		const py = (e.clientY - rect.top) / rect.height - 0.5;
		const px = (e.clientX - rect.left) / rect.width - 0.5;
		tiltX = py * -2.2;
		tiltY = px * 2.2;
	}

	function resetTilt() {
		tiltX = 0;
		tiltY = 0;
	}

	$effect(() => {
		document.documentElement.style.setProperty('--sidebar-width', collapsed ? '4.5rem' : '15rem');
	});
</script>

{#if collapsed}
	<button class="reveal-handle" onclick={() => (collapsed = false)} aria-label="Abrir menú">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
		</svg>
	</button>
{:else}
	<aside
		bind:this={sidebarEl}
		class="sidebar"
		style="transform: perspective(900px) rotateX({tiltX}deg) rotateY({tiltY}deg);"
		onmousemove={handleMouseMove}
		onmouseleave={resetTilt}
	>
		<div class="brand">
			<div class="logo">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9 5l7 7-7 7"
					/>
				</svg>
			</div>
			<span class="brand-name">Jiraformer</span>
			<button class="collapse-btn" onclick={() => (collapsed = true)} aria-label="Colapsar menú">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 6l-6 6 6 6" />
				</svg>
			</button>
		</div>

		<nav>
			<a href="/" class="nav-item active">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9 5h6M9 5a2 2 0 012-2h0a2 2 0 012 2m-4 0a2 2 0 00-2 2v0a2 2 0 002 2h4a2 2 0 002-2v0a2 2 0 00-2-2M5 9v10a2 2 0 002 2h10a2 2 0 002-2V9M9 13h6M9 17h6"
					/>
				</svg>
				<span>Generar texto</span>
			</a>
		</nav>
	</aside>
{/if}

<style>
	.sidebar {
		position: fixed;
		top: 0.75rem;
		left: 0.75rem;
		bottom: 0.75rem;
		width: 15rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem 0.75rem;
		border-radius: 16px;
		border: 1px solid var(--sidebar-border);
		background: linear-gradient(160deg, #de0b80 0%, #6554c0 100%);
		color: var(--sidebar-foreground);
		box-shadow: 0 8px 32px rgba(101, 84, 192, 0.28);
		backdrop-filter: blur(16px);
		transition: transform 0.15s ease;
		z-index: 20;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.5rem 0.75rem;
		border-bottom: 1px solid var(--sidebar-border);
		margin-bottom: 0.5rem;
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
		flex: 1;
	}

	.collapse-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.85);
		transition: background 0.15s ease;
	}

	.collapse-btn:hover {
		background: rgba(255, 255, 255, 0.16);
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.55rem 0.625rem;
		border-radius: 10px;
		font-size: 0.875rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.85);
		transition: background 0.15s ease;
	}

	.nav-item:hover {
		background: rgba(255, 255, 255, 0.12);
	}

	.nav-item.active {
		background: rgba(255, 255, 255, 0.22);
		color: #ffffff;
	}

	.reveal-handle {
		position: fixed;
		top: 0.75rem;
		left: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 12px;
		border: 1px solid var(--sidebar-border);
		background: linear-gradient(160deg, #de0b80 0%, #6554c0 100%);
		color: #ffffff;
		box-shadow: 0 8px 24px rgba(101, 84, 192, 0.3);
		z-index: 20;
	}

	.reveal-handle svg {
		width: 1.25rem;
		height: 1.25rem;
	}
</style>
