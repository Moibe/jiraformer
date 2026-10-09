<script lang="ts">
	const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

	const now = new Date();
	let viewYear = $state(now.getFullYear());
	let viewMonth = $state(now.getMonth());
	let checked = $state<Record<string, boolean>>({});

	function toIso(y: number, m: number, d: number) {
		return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
	}

	const todayIso = toIso(now.getFullYear(), now.getMonth(), now.getDate());

	let monthLabel = $derived.by(() => {
		const label = new Date(viewYear, viewMonth, 1).toLocaleDateString('es-MX', {
			month: 'long',
			year: 'numeric'
		});
		return label.charAt(0).toUpperCase() + label.slice(1);
	});

	let cells = $derived.by(() => {
		const leading = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
		const total = new Date(viewYear, viewMonth + 1, 0).getDate();
		const out: ({ day: number; iso: string } | null)[] = Array(leading).fill(null);
		for (let d = 1; d <= total; d++) {
			out.push({ day: d, iso: toIso(viewYear, viewMonth, d) });
		}
		return out;
	});

	let monthCount = $derived(cells.filter((c) => c && checked[c.iso]).length);
	let isCurrentMonth = $derived(viewYear === now.getFullYear() && viewMonth === now.getMonth());

	async function load() {
		const res = await fetch('/api/calendar');
		if (!res.ok) return;
		checked = (await res.json()).days;
	}

	$effect(() => {
		load();
	});

	function shiftMonth(delta: number) {
		const d = new Date(viewYear, viewMonth + delta, 1);
		viewYear = d.getFullYear();
		viewMonth = d.getMonth();
	}

	function goToday() {
		viewYear = now.getFullYear();
		viewMonth = now.getMonth();
	}

	async function toggle(iso: string, value: boolean) {
		checked = { ...checked, [iso]: value };
		try {
			const res = await fetch('/api/calendar', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ date: iso, checked: value })
			});
			if (!res.ok) throw new Error();
		} catch {
			checked = { ...checked, [iso]: !value };
		}
	}
</script>

<div class="calendar-card">
	<div class="cal-header">
		<button type="button" class="nav-btn" onclick={() => shiftMonth(-1)} aria-label="Mes anterior">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 6l-6 6 6 6" />
			</svg>
		</button>
		<h2>{monthLabel}</h2>
		<button type="button" class="nav-btn" onclick={() => shiftMonth(1)} aria-label="Mes siguiente">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 6l6 6-6 6" />
			</svg>
		</button>
	</div>

	<div class="grid">
		{#each WEEKDAYS as w, i (i)}
			<span class="weekday">{w}</span>
		{/each}

		{#each cells as cell, i (i)}
			{#if cell}
				<label class="day" class:today={cell.iso === todayIso}>
					<span class="num">{cell.day}</span>
					<input
						type="checkbox"
						aria-label="Marcar {cell.day} de {monthLabel.toLowerCase()}"
						checked={checked[cell.iso] ?? false}
						onchange={(e) => toggle(cell.iso, e.currentTarget.checked)}
					/>
				</label>
			{:else}
				<span></span>
			{/if}
		{/each}
	</div>

	<div class="cal-footer">
		<span class="count">{monthCount} {monthCount === 1 ? 'día marcado' : 'días marcados'}</span>
		{#if !isCurrentMonth}
			<button type="button" class="today-btn" onclick={goToday}>Hoy</button>
		{/if}
	</div>
</div>

<style>
	.calendar-card {
		flex-shrink: 0;
		background: var(--card);
		color: var(--card-foreground);
		border: 1px solid var(--border);
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(23, 43, 77, 0.08);
		padding: 1.25rem 1rem;
	}

	.cal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.9rem;
	}

	h2 {
		font-size: 0.95rem;
		font-weight: 600;
		margin: 0;
		text-align: center;
		flex: 1;
	}

	.nav-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.8rem;
		height: 1.8rem;
		border-radius: 8px;
		color: var(--muted-foreground);
		transition: background 0.15s ease;
	}

	.nav-btn:hover {
		background: var(--muted);
	}

	.nav-btn svg {
		width: 1rem;
		height: 1rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.2rem;
	}

	.weekday {
		text-align: center;
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--muted-foreground);
		padding-bottom: 0.25rem;
	}

	.day {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		padding: 0.3rem 0 0.35rem;
		border-radius: 8px;
		border: 2px solid transparent;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.day:hover {
		background: var(--muted);
	}

	.day.today {
		border-color: var(--foreground);
	}

	.day.today .num {
		font-weight: 800;
	}

	.num {
		font-size: 0.78rem;
		font-weight: 500;
	}

	.day input {
		width: 0.95rem;
		height: 0.95rem;
		accent-color: var(--primary);
		cursor: pointer;
	}

	.cal-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.9rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border);
		font-size: 0.78rem;
		color: var(--muted-foreground);
	}

	.today-btn {
		font-weight: 600;
		color: var(--primary);
		padding: 0.15rem 0.5rem;
		border-radius: 6px;
	}

	.today-btn:hover {
		background: var(--muted);
	}
</style>
