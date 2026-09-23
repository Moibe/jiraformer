import { json } from '@sveltejs/kit';
import { JIRA_EMAIL, JIRA_API_TOKEN, JIRA_SITE } from '$env/static/private';
import type { RequestHandler } from './$types';

function authHeader() {
	return `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`;
}

type JiraIssue = {
	key: string;
	fields: {
		summary: string;
		status: { name: string; statusCategory: { key: string } };
		project: { name: string };
		issuetype: { name: string };
		updated: string;
		subtasks?: unknown[];
		parent?: { key: string; fields?: { summary?: string } };
	};
};

const MAX_PAGES = 20; // safety cap: 20 * 100 = 2000 issues

async function fetchAllAssignedIssues(): Promise<JiraIssue[]> {
	const issues: JiraIssue[] = [];
	let nextPageToken: string | undefined;
	let page = 0;

	do {
		const res = await fetch(`https://${JIRA_SITE}/rest/api/3/search/jql`, {
			method: 'POST',
			headers: {
				Authorization: authHeader(),
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				jql: 'assignee = currentUser() ORDER BY updated DESC',
				maxResults: 100,
				nextPageToken,
				fields: ['summary', 'status', 'project', 'issuetype', 'updated', 'subtasks', 'parent']
			})
		});

		if (!res.ok) {
			throw new Error(`Jira respondió ${res.status} ${res.statusText} buscando tus tareas.`);
		}

		const data = await res.json();
		issues.push(...(data.issues ?? []));
		nextPageToken = data.isLast ? undefined : data.nextPageToken;
		page++;
	} while (nextPageToken && page < MAX_PAGES);

	return issues;
}

export const GET: RequestHandler = async () => {
	let issues: JiraIssue[];
	try {
		issues = await fetchAllAssignedIssues();
	} catch (e) {
		return json({ error: e instanceof Error ? e.message : 'Error desconocido.' }, { status: 502 });
	}

	return json({
		site: JIRA_SITE,
		tasks: issues.map((issue) => ({
			key: issue.key,
			summary: issue.fields.summary,
			status: issue.fields.status?.name ?? '',
			statusCategory: issue.fields.status?.statusCategory?.key ?? 'new',
			project: issue.fields.project?.name ?? '',
			type: issue.fields.issuetype?.name ?? '',
			updated: issue.fields.updated,
			hasSubtasks: (issue.fields.subtasks?.length ?? 0) > 0,
			parent: issue.fields.parent
				? { key: issue.fields.parent.key, summary: issue.fields.parent.fields?.summary ?? '' }
				: null
		}))
	});
};
