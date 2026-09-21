<script lang="ts">
	type Task = {
		key: string;
		summary: string;
		status: string;
		statusCategory: string;
		project: string;
		type: string;
		updated: string;
	};

	let loading = $state(true);
	let error = $state('');
	let tasks = $state<Task[]>([]);
	let site = $state('');
	let selectedProject = $state<string | null>(null);
	let selectedStatus = $state<string | null>(null);

	let projects = $derived(
		[...new Set(tasks.map((t) => t.project))].sort((a, b) => a.localeCompare(b))
	);
	let statuses = $derived(
		[...new Set(tasks.map((t) => t.status))].sort((a, b) => a.localeCompare(b))
	);
	let filteredTasks = $derived(
		tasks.filter(
			(t) =>
				(!selectedProject || t.project === selectedProject) &&
				(!selectedStatus || t.status === selectedStatus)
		)
	);

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/tasks');
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? 'Error desconocido.');
			tasks = data.tasks;
			site = data.site;
			if (selectedProject && !tasks.some((t) => t.project === selectedProject)) {
				selectedProject = null;
			}
			if (selectedStatus && !tasks.some((t) => t.status === selectedStatus)) {
				selectedStatus = null;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error desconocido.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		load();
	});

	function statusClass(category: string) {
		if (category === 'done') return 'status-done';
		if (category === 'indeterminate') return 'status-progress';
		return 'status-todo';
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
	}
</script>

<svelte:head>
	<title>Jiraformer · Tareas</title>
</svelte:head>

<div class="card">
	<div class="header-row">
		<div>
			<h1>Mis tareas</h1>
			<p class="subtitle">Todo lo asignado a ti en Jira, más reciente primero.</p>
		</div>
		<button class="btn-secondary" onclick={load} disabled={loading}>
			{loading ? 'Cargando…' : 'Refrescar'}
		</button>
	</div>

	{#if error}
		<p class="error">{error}</p>
	{:else if loading}
		<p class="muted">Cargando tareas…</p>
	{:else if tasks.length === 0}
		<p class="muted">No tienes tareas asignadas.</p>
	{:else}
		<div class="filters">
			<div class="filter-field">
				<label for="filter-project">Proyecto</label>
				<select id="filter-project" bind:value={selectedProject}>
					<option value={null}>Todos ({tasks.length})</option>
					{#each projects as project (project)}
						<option value={project}>
							{project} ({tasks.filter((t) => t.project === project).length})
						</option>
					{/each}
				</select>
			</div>

			<div class="filter-field">
				<label for="filter-status">Estado</label>
				<select id="filter-status" bind:value={selectedStatus}>
					<option value={null}>Todos ({tasks.length})</option>
					{#each statuses as status (status)}
						<option value={status}>
							{status} ({tasks.filter((t) => t.status === status).length})
						</option>
					{/each}
				</select>
			</div>
		</div>

		{#if filteredTasks.length === 0}
			<p class="muted">No hay tareas con ese filtro.</p>
		{/if}

		<ul class="task-list">
			{#each filteredTasks as task (task.key)}
				<li>
					<a href="https://{site}/browse/{task.key}" target="_blank" rel="noopener">
						<span class="key">{task.key}</span>
						<span class="summary">{task.summary}</span>
						<span class="status {statusClass(task.statusCategory)}">{task.status}</span>
						<span class="meta">{task.project} · {formatDate(task.updated)}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.card {
		max-width: 46rem;
		background: var(--card);
		color: var(--card-foreground);
		border: 1px solid var(--border);
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(23, 43, 77, 0.08);
		padding: 2rem;
	}

	.header-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	h1 {
		font-size: 1.375rem;
		font-weight: 600;
		margin: 0 0 0.3rem;
	}

	.subtitle {
		color: var(--muted-foreground);
		font-size: 0.9rem;
		margin: 0;
	}

	.muted {
		color: var(--muted-foreground);
		font-size: 0.9rem;
	}

	.error {
		color: var(--destructive);
		font-size: 0.9rem;
	}

	.btn-secondary {
		background: var(--accent);
		color: var(--accent-foreground);
		border-radius: 8px;
		padding: 0.5rem 1rem;
		font-size: 0.85rem;
		font-weight: 600;
		white-space: nowrap;
		transition: opacity 0.15s ease;
	}

	.btn-secondary:hover {
		opacity: 0.9;
	}

	.btn-secondary:disabled {
		opacity: 0.6;
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	.filter-field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.filter-field label {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.filter-field select {
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.45rem 2rem 0.45rem 0.7rem;
		font-size: 0.85rem;
		color: var(--foreground);
		background: var(--card);
		min-width: 12rem;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2342526e' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.6rem center;
		background-size: 1rem;
	}

	.filter-field select:focus {
		outline: 2px solid var(--ring);
		outline-offset: 1px;
	}

	.task-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.task-list a {
		display: grid;
		grid-template-columns: 5rem 1fr auto;
		align-items: center;
		gap: 0.25rem 0.75rem;
		padding: 0.75rem 0.9rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		transition:
			border-color 0.15s ease,
			background 0.15s ease;
	}

	.task-list a:hover {
		border-color: var(--primary);
		background: var(--muted);
	}

	.key {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--muted-foreground);
	}

	.summary {
		font-size: 0.9rem;
		font-weight: 500;
		grid-column: 2;
	}

	.status {
		grid-row: 1;
		grid-column: 3;
		font-size: 0.72rem;
		font-weight: 600;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		white-space: nowrap;
		justify-self: end;
	}

	.status-todo {
		background: #dfe1e6;
		color: #42526e;
	}

	.status-progress {
		background: #deebff;
		color: #0052cc;
	}

	.status-done {
		background: #e3fcef;
		color: #006644;
	}

	.meta {
		grid-column: 2 / span 2;
		font-size: 0.78rem;
		color: var(--muted-foreground);
	}
</style>
