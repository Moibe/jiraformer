import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { calendarChecks } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const GET: RequestHandler = async () => {
	const rows = db.select().from(calendarChecks).all();
	const days: Record<string, boolean> = {};
	for (const row of rows) {
		days[row.date] = true;
	}
	return json({ days });
};

export const PUT: RequestHandler = async ({ request }) => {
	const { date, checked } = await request.json();
	if (typeof date !== 'string' || !DATE_RE.test(date) || typeof checked !== 'boolean') {
		return json({ error: 'Falta date (YYYY-MM-DD) o checked.' }, { status: 400 });
	}

	if (checked) {
		db.insert(calendarChecks).values({ date }).onConflictDoNothing().run();
	} else {
		db.delete(calendarChecks).where(eq(calendarChecks.date, date)).run();
	}

	return json({ date, checked });
};
