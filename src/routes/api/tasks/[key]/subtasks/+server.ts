import { json } from '@sveltejs/kit';
import { JIRA_SITE } from '$env/static/private';
import { fetchIssueSubtasks, formatSubtasks } from '$lib/server/jira';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const issueKey = params.key;

	try {
		const subtasks = await fetchIssueSubtasks(JIRA_SITE, issueKey);
		return json({
			issueKey,
			subtasks: subtasks.map((s) => ({ key: s.key, summary: s.fields.summary })),
			text: formatSubtasks(subtasks)
		});
	} catch (e) {
		return json({ error: e instanceof Error ? e.message : 'Error desconocido.' }, { status: 502 });
	}
};
