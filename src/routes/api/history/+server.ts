import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { generations } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const rows = db
		.select()
		.from(generations)
		.orderBy(desc(generations.createdAt))
		.limit(10)
		.all();

	return json({ history: rows });
};
