<script lang="ts">
	type Task = {
		key: string;
		summary: string;
		status: string;
		statusCategory: string;
		project: string;
		type: string;
		updated: string;
		hasSubtasks: boolean;
		parent: { key: string; summary: string } | null;
	};

	type PanelSubtask = { key: string; summary: string };

	let loading = $state(true);
	let error = $state('');
	let tasks = $state<Task[]>([]);
	let site = $state('');
	let selectedProjects = $state<Set<string>>(new Set(['ART -BROKER Seguros', 'NEXUS DOC IA']));
	let projectMenuOpen = $state(false);
	let projectMenuEl: HTMLElement | undefined = $state();
	let selectedStatus = $state<string | null>(null);
	let selectedSubtasks = $state<'con' | 'sin' | null>(null);
	let selectedUsercare = $state<'si' | 'no' | null>(null);
	let sortOrder = $state<'desc' | 'asc'>('desc');

	let flags = $state<Record<string, boolean>>({});

	let selectedTask = $state<Task | null>(null);
	let panelLoading = $state(false);
	let panelError = $state('');
	let panelSubtasks = $state<PanelSubtask[]>([]);
	let panelText = $state('');
	let panelCopied = $state(false);

	let projects = $derived(
		[...new Set(tasks.map((t) => t.project))].sort((a, b) => a.localeCompare(b))
	);
	let statuses = $derived(
		[...new Set(tasks.map((t) => t.status))].sort((a, b) => a.localeCompare(b))
	);
	let filteredTasks = $derived(
		tasks
			.filter(
				(t) =>
					(selectedProjects.size === 0 || selectedProjects.has(t.project)) &&
					(!selectedStatus || t.status === selectedStatus) &&
					(!selectedSubtasks ||
						(selectedSubtasks === 'con' ? t.hasSubtasks : !t.hasSubtasks)) &&
					(!selectedUsercare ||
						(selectedUsercare === 'si' ? flags[t.key] : !flags[t.key]))
			)
			.sort((a, b) => {
				const diff = new Date(a.updated).getTime() - new Date(b.updated).getTime();
				return sortOrder === 'desc' ? -diff : diff;
			})
	);
	let withSubtasksCount = $derived(tasks.filter((t) => t.hasSubtasks).length);
	let withUsercareCount = $derived(tasks.filter((t) => flags[t.key]).length);
	let showFilters = $derived(!loading && !error && tasks.length > 0);

	async function load() {
		loading = true;
		error = '';
		try {
			const [tasksRes, flagsRes] = await Promise.all([
				fetch('/api/tasks'),
				fetch('/api/tasks/flags')
			]);
			const data = await tasksRes.json();
			if (!tasksRes.ok) throw new Error(data.error ?? 'Error desconocido.');
			tasks = data.tasks;
			site = data.site;
			if (flagsRes.ok) {
				flags = (await flagsRes.json()).flags;
			}
			selectedProjects = new Set(
				[...selectedProjects].filter((p) => tasks.some((t) => t.project === p))
			);
			if (selectedStatus && !tasks.some((t) => t.status === selectedStatus)) {
				selectedStatus = null;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error desconocido.';
		} finally {
			loading = false;
		}
	}

	function toggleProject(project: string) {
		const next = new Set(selectedProjects);
		if (next.has(project)) next.delete(project);
		else next.add(project);
		selectedProjects = next;
	}

	function clearProjects() {
		selectedProjects = new Set();
	}

	function handleWindowClick(e: MouseEvent) {
		if (projectMenuOpen && projectMenuEl && !projectMenuEl.contains(e.target as Node)) {
			projectMenuOpen = false;
		}
	}

	function handleWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') projectMenuOpen = false;
	}

	async function toggleFlag(issueKey: string, checked: boolean) {
		flags = { ...flags, [issueKey]: checked };
		try {
			const res = await fetch('/api/tasks/flags', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ issueKey, sentToUsercare: checked })
			});
			if (!res.ok) throw new Error();
		} catch {
			flags = { ...flags, [issueKey]: !checked };
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

	async function seleccionar(task: Task) {
		selectedTask = task;
		panelCopied = false;
		panelLoading = true;
		panelError = '';
		panelSubtasks = [];
		panelText = '';
		try {
			const res = await fetch(`/api/tasks/${task.key}/subtasks`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? 'Error desconocido.');
			panelSubtasks = data.subtasks;
			panelText = data.text;
		} catch (e) {
			panelError = e instanceof Error ? e.message : 'Error desconocido.';
		} finally {
			panelLoading = false;
		}
	}

	async function copiarPanel() {
		if (!panelText) return;
		await navigator.clipboard.writeText(panelText);
		panelCopied = true;
		setTimeout(() => (panelCopied = false), 2000);
	}
</script>

<svelte:head>
	<title>Jiraformer · Tareas</title>
</svelte:head>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

{#if showFilters}
	<div class="card filters-card">
		<div class="filters">
			<div class="filter-group filter-group-filters">
				<span class="group-label">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 5h16M7 12h10M10 19h4" />
					</svg>
					Filtros
				</span>
				<div class="group-row">
					<div class="filter-field">
						<!-- svelte-ignore a11y_label_has_associated_control -->
					<label id="filter-project-label">Proyecto</label>
						<div class="multi-select" bind:this={projectMenuEl}>
							<button
								type="button"
								class="multi-select-trigger"
								aria-labelledby="filter-project-label"
								onclick={() => (projectMenuOpen = !projectMenuOpen)}
							>
								{#if selectedProjects.size === 0}
									Todos ({tasks.length})
								{:else if selectedProjects.size === 1}
									{[...selectedProjects][0]} ({tasks.filter(
										(t) => t.project === [...selectedProjects][0]
									).length})
								{:else}
									{selectedProjects.size} proyectos seleccionados
								{/if}
							</button>

							{#if projectMenuOpen}
								<div class="multi-select-panel">
									<label class="multi-select-option">
										<input
											type="checkbox"
											checked={selectedProjects.size === 0}
											onchange={clearProjects}
										/>
										<span>Todos ({tasks.length})</span>
									</label>
									{#each projects as project (project)}
										<label class="multi-select-option">
											<input
												type="checkbox"
												checked={selectedProjects.has(project)}
												onchange={() => toggleProject(project)}
											/>
											<span
												>{project} ({tasks.filter((t) => t.project === project).length})</span
											>
										</label>
									{/each}
								</div>
							{/if}
						</div>
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

					<div class="filter-field">
						<label for="filter-subtasks">Subtareas</label>
						<select id="filter-subtasks" bind:value={selectedSubtasks}>
							<option value={null}>Todos ({tasks.length})</option>
							<option value="con">Con subtareas ({withSubtasksCount})</option>
							<option value="sin">Sin subtareas ({tasks.length - withSubtasksCount})</option>
						</select>
					</div>

					<div class="filter-field">
						<label for="filter-usercare">Usercare</label>
						<select id="filter-usercare" bind:value={selectedUsercare}>
							<option value={null}>Todos ({tasks.length})</option>
							<option value="si">Subidas ({withUsercareCount})</option>
							<option value="no">No subidas ({tasks.length - withUsercareCount})</option>
						</select>
					</div>
				</div>
			</div>

			<div class="filter-group filter-group-sort">
				<span class="group-label">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 7h11M3 12h7M3 17h4M17 4v16m0 0l-3.5-3.5M17 20l3.5-3.5" />
					</svg>
					Orden
				</span>
				<div class="group-row">
					<div class="filter-field">
						<label for="filter-sort">Fecha</label>
						<select id="filter-sort" bind:value={sortOrder}>
							<option value="desc">Más reciente primero</option>
							<option value="asc">Más antiguo primero</option>
						</select>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<div class="layout">
	<div class="card list-card">
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
			{#if filteredTasks.length === 0}
				<p class="muted">No hay tareas con ese filtro.</p>
			{/if}

			<ul class="task-list">
				{#each filteredTasks as task (task.key)}
					<li class="task-item">
						<input
							type="checkbox"
							class="usercare-check"
							title="¿Subida a Usercare?"
							checked={flags[task.key] ?? false}
							onclick={(e) => e.stopPropagation()}
							onchange={(e) => toggleFlag(task.key, e.currentTarget.checked)}
						/>
						<button
							class="task-row"
							class:selected={selectedTask?.key === task.key}
							onclick={() => seleccionar(task)}
						>
							<span class="key">{task.key}</span>
							<span class="summary">{task.summary}</span>
							<span class="status {statusClass(task.statusCategory)}">{task.status}</span>
							<span class="meta">{task.project} · {formatDate(task.updated)}</span>
							{#if task.parent}
								<span class="parent-info">
									Principal: {task.parent.key} · {task.parent.summary}
								</span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div class="card panel-card">
		{#if !selectedTask}
			<p class="muted">Selecciona una tarea para ver sus subtareas.</p>
		{:else}
			<div class="panel-header">
				<div>
					<span class="panel-key">{selectedTask.key}</span>
					<h2>{selectedTask.summary}</h2>
				</div>
				<a
					class="btn-secondary"
					href="https://{site}/browse/{selectedTask.key}"
					target="_blank"
					rel="noopener"
				>
					Abrir en Jira
				</a>
			</div>

			{#if panelLoading}
				<p class="muted">Cargando subtareas…</p>
			{:else if panelError}
				<p class="error">{panelError}</p>
			{:else if panelSubtasks.length === 0}
				<p class="muted">Esta tarea no tiene subtareas.</p>
			{:else}
				<ul class="subtask-list">
					{#each panelSubtasks as st (st.key)}
						<li>
							<span class="key">{st.key}</span>
							<span class="summary">{st.summary}</span>
						</li>
					{/each}
				</ul>
				<button class="btn-primary" onclick={copiarPanel}>
					{panelCopied ? 'Copiado ✓' : 'Copiar como texto'}
				</button>
			{/if}
		{/if}
	</div>
</div>

<style>
	.filters-card {
		width: 100%;
		padding: 0.75rem 1.25rem;
		margin-bottom: 1.25rem;
	}

	.layout {
		display: flex;
		align-items: flex-start;
		gap: 1.25rem;
		flex-wrap: wrap;
	}

	.card {
		background: var(--card);
		color: var(--card-foreground);
		border: 1px solid var(--border);
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(23, 43, 77, 0.08);
		padding: 2rem;
	}

	.list-card {
		flex: 1 1 32rem;
		max-width: 42rem;
	}

	.panel-card {
		flex: 1 1 20rem;
		max-width: 24rem;
		position: sticky;
		top: 6.25rem;
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

	.btn-primary {
		background: var(--primary);
		color: var(--primary-foreground);
		border-radius: 8px;
		padding: 0.5rem 1rem;
		font-size: 0.85rem;
		font-weight: 600;
		transition: opacity 0.15s ease;
	}

	.btn-primary:hover {
		opacity: 0.9;
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
		align-items: flex-start;
		gap: 1.25rem;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.45rem 1rem 0.55rem;
		border-radius: 10px;
		border-left: 3px solid transparent;
	}

	.filter-group-filters {
		background: color-mix(in srgb, var(--primary) 6%, transparent);
		border-left-color: var(--primary);
	}

	.filter-group-sort {
		background: color-mix(in srgb, var(--accent) 8%, transparent);
		border-left-color: var(--accent);
	}

	.group-label {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.filter-group-filters .group-label {
		color: var(--primary);
	}

	.filter-group-sort .group-label {
		color: var(--accent);
	}

	.group-label svg {
		width: 0.85rem;
		height: 0.85rem;
	}

	.group-row {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.filter-field {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
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
		padding: 0.3rem 2rem 0.3rem 0.7rem;
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

	.multi-select {
		position: relative;
	}

	.multi-select-trigger {
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.3rem 2rem 0.3rem 0.7rem;
		font-size: 0.85rem;
		color: var(--foreground);
		background: var(--card);
		min-width: 12rem;
		max-width: 16rem;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2342526e' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.6rem center;
		background-size: 1rem;
	}

	.multi-select-trigger:focus {
		outline: 2px solid var(--ring);
		outline-offset: 1px;
	}

	.multi-select-panel {
		position: absolute;
		top: calc(100% + 0.35rem);
		left: 0;
		z-index: 30;
		min-width: 100%;
		max-height: 16rem;
		overflow-y: auto;
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 8px;
		box-shadow: 0 8px 24px rgba(23, 43, 77, 0.16);
		padding: 0.4rem;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.multi-select-option {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.4rem 0.5rem;
		border-radius: 6px;
		font-size: 0.85rem;
		color: var(--foreground);
		white-space: nowrap;
		cursor: pointer;
	}

	.multi-select-option:hover {
		background: var(--muted);
	}

	.multi-select-option input {
		width: 1rem;
		height: 1rem;
		accent-color: var(--primary);
		flex-shrink: 0;
		cursor: pointer;
	}

	.task-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.task-item {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.usercare-check {
		flex-shrink: 0;
		width: 1.05rem;
		height: 1.05rem;
		accent-color: var(--primary);
		cursor: pointer;
	}

	.task-row {
		display: grid;
		grid-template-columns: 5rem 1fr auto;
		align-items: center;
		gap: 0.25rem 0.75rem;
		flex: 1;
		min-width: 0;
		padding: 0.75rem 0.9rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		text-align: left;
		transition:
			border-color 0.15s ease,
			background 0.15s ease,
			box-shadow 0.15s ease;
	}

	.task-row:hover {
		border-color: var(--primary);
		background: var(--muted);
	}

	.task-row.selected {
		border-color: var(--primary);
		box-shadow: 0 0 0 1px var(--primary);
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

	.parent-info {
		grid-column: 2 / span 2;
		font-size: 0.75rem;
		color: var(--accent);
		font-weight: 500;
	}

	.panel-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border);
	}

	.panel-key {
		display: block;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--primary);
		margin-bottom: 0.2rem;
	}

	.panel-header h2 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
	}

	.subtask-list {
		list-style: none;
		margin: 0 0 1rem;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.subtask-list li {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding-bottom: 0.6rem;
		border-bottom: 1px solid var(--border);
	}

	.subtask-list li:last-child {
		border-bottom: none;
	}

	.subtask-list .key {
		font-size: 0.72rem;
	}

	.subtask-list .summary {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--foreground);
	}
</style>
