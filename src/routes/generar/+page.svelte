<script lang="ts">
	type HistoryRow = { id: number; issueKey: string; url: string; text: string; createdAt: string };

	let url = $state('');
	let loading = $state(false);
	let error = $state('');
	let result = $state('');
	let copied = $state(false);
	let history = $state<HistoryRow[]>([]);

	async function cargarHistorial() {
		const res = await fetch('/api/history');
		if (!res.ok) return;
		const data = await res.json();
		history = data.history;
	}

	$effect(() => {
		cargarHistorial();
	});

	async function generar() {
		error = '';
		copied = false;

		if (!url.trim()) {
			error = 'Pega la URL de la tarjeta de Jira.';
			return;
		}

		loading = true;
		result = '';
		try {
			const res = await fetch('/api/subtasks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? 'Error desconocido.');
			if (!data.text) {
				error = `${data.issueKey} no tiene subtareas.`;
			} else {
				result = data.text;
				cargarHistorial();
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error desconocido.';
		} finally {
			loading = false;
		}
	}

	async function copiar() {
		if (!result) return;
		await navigator.clipboard.writeText(result);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function verHistorial(row: HistoryRow) {
		url = row.url;
		result = row.text;
		error = '';
		copied = false;
	}

	function formatFecha(iso: string) {
		return new Date(iso).toLocaleString('es-MX', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Jiraformer · Generar texto</title>
</svelte:head>

<div class="card">
	<h1>Convertir subtareas de Jira</h1>
	<p class="subtitle">
		Pega la URL de la tarjeta (con <code>?selectedIssue=</code>) y genera el texto listo para
		pegar en tu formato.
	</p>

	<label for="url">URL de la tarjeta</label>
	<div class="input-row">
		<input
			id="url"
			type="text"
			bind:value={url}
			placeholder="https://buzzwordmx.atlassian.net/jira/software/projects/NEX/boards/591?selectedIssue=NEX-16"
			onkeydown={(e) => e.key === 'Enter' && generar()}
		/>
		<button class="btn-primary" onclick={generar} disabled={loading}>
			{loading ? 'Generando…' : 'Generar'}
		</button>
	</div>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	{#if result}
		<div class="result-block">
			<textarea readonly rows="10" value={result}></textarea>
			<button class="btn-secondary" onclick={copiar}>
				{copied ? 'Copiado ✓' : 'Copiar'}
			</button>
		</div>
	{/if}
</div>

{#if history.length > 0}
	<div class="card history-card">
		<h2>Historial reciente</h2>
		<ul class="history-list">
			{#each history as row (row.id)}
				<li>
					<button class="history-row" onclick={() => verHistorial(row)}>
						<span class="key">{row.issueKey}</span>
						<span class="date">{formatFecha(row.createdAt)}</span>
					</button>
				</li>
			{/each}
		</ul>
	</div>
{/if}

<style>
	.card {
		max-width: 42rem;
		background: var(--card);
		color: var(--card-foreground);
		border: 1px solid var(--border);
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(23, 43, 77, 0.08);
		padding: 2rem;
	}

	h1 {
		font-size: 1.375rem;
		font-weight: 600;
		margin: 0 0 0.4rem;
	}

	.subtitle {
		color: var(--muted-foreground);
		font-size: 0.9rem;
		margin: 0 0 1.5rem;
	}

	.subtitle code {
		background: var(--muted);
		padding: 0.05rem 0.35rem;
		border-radius: 4px;
		font-size: 0.85em;
	}

	label {
		display: block;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--muted-foreground);
		margin-bottom: 0.4rem;
	}

	.input-row {
		display: flex;
		gap: 0.6rem;
	}

	input {
		flex: 1;
		border: 1px solid var(--input);
		border-radius: 8px;
		padding: 0.6rem 0.75rem;
		font-size: 0.9rem;
		color: var(--foreground);
		background: #fff;
	}

	input:focus {
		outline: 2px solid var(--ring);
		outline-offset: 1px;
	}

	.btn-primary {
		background: var(--primary);
		color: var(--primary-foreground);
		border-radius: 8px;
		padding: 0 1.1rem;
		font-size: 0.9rem;
		font-weight: 600;
		white-space: nowrap;
		transition: opacity 0.15s ease;
	}

	.btn-primary:hover {
		opacity: 0.9;
	}

	.btn-primary:disabled {
		opacity: 0.6;
	}

	.error {
		color: var(--destructive);
		font-size: 0.85rem;
		margin-top: 0.75rem;
	}

	.result-block {
		margin-top: 1.5rem;
	}

	textarea {
		width: 100%;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--muted);
		color: var(--foreground);
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.85rem;
		line-height: 1.5;
		padding: 0.75rem;
		resize: vertical;
	}

	.btn-secondary {
		margin-top: 0.6rem;
		background: var(--accent);
		color: var(--accent-foreground);
		border-radius: 8px;
		padding: 0.5rem 1rem;
		font-size: 0.85rem;
		font-weight: 600;
		transition: opacity 0.15s ease;
	}

	.btn-secondary:hover {
		opacity: 0.9;
	}

	.history-card {
		max-width: 42rem;
		margin-top: 1.25rem;
		padding: 1.25rem 1.5rem;
	}

	.history-card h2 {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.02em;
		margin: 0 0 0.75rem;
	}

	.history-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.history-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.5rem 0.6rem;
		border-radius: 8px;
		font-size: 0.85rem;
		color: var(--foreground);
		transition: background 0.15s ease;
	}

	.history-row:hover {
		background: var(--muted);
	}

	.history-row .key {
		font-weight: 700;
		color: var(--primary);
	}

	.history-row .date {
		color: var(--muted-foreground);
		font-size: 0.78rem;
	}
</style>
