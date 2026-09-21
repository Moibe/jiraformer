import { json } from '@sveltejs/kit';
import { parseIssueUrl, fetchIssueSubtasks, formatSubtasks } from '$lib/server/jira';
import { db } from '$lib/server/db';
import { generations } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { url } = await request.json();
	if (!url) {
		return json({ error: 'Falta la URL.' }, { status: 400 });
	}

	let host: string;
	let issueKey: string;
	try {
		({ host, issueKey } = parseIssueUrl(url));
	} catch (e) {
		return json({ error: e instanceof Error ? e.message : 'URL inválida.' }, { status: 400 });
	}

	let subtasks;
	try {
		subtasks = await fetchIssueSubtasks(host, issueKey);
	} catch (e) {
		return json({ error: e instanceof Error ? e.message : 'Error desconocido.' }, { status: 502 });
	}

	const text = formatSubtasks(subtasks);

	if (text) {
		db.insert(generations).values({ issueKey, url, text }).run();
	}

	return json({ issueKey, text });
};
