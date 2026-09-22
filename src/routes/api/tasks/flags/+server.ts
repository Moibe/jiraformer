import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { taskFlags } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const rows = db.select().from(taskFlags).all();
	const flags: Record<string, boolean> = {};
	for (const row of rows) {
		flags[row.issueKey] = row.sentToUsercare;
	}
	return json({ flags });
};

export const PUT: RequestHandler = async ({ request }) => {
	const { issueKey, sentToUsercare } = await request.json();
	if (!issueKey || typeof sentToUsercare !== 'boolean') {
		return json({ error: 'Falta issueKey o sentToUsercare.' }, { status: 400 });
	}

	db.insert(taskFlags)
		.values({ issueKey, sentToUsercare, updatedAt: new Date() })
		.onConflictDoUpdate({
			target: taskFlags.issueKey,
			set: { sentToUsercare, updatedAt: new Date() }
		})
		.run();

	return json({ issueKey, sentToUsercare });
};
