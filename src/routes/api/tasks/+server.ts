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
	};
};

export const GET: RequestHandler = async () => {
	const res = await fetch(`https://${JIRA_SITE}/rest/api/3/search/jql`, {
		method: 'POST',
		headers: {
			Authorization: authHeader(),
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			jql: 'assignee = currentUser() ORDER BY updated DESC',
			maxResults: 50,
			fields: ['summary', 'status', 'project', 'issuetype', 'updated']
		})
	});

	if (!res.ok) {
		return json(
			{ error: `Jira respondió ${res.status} ${res.statusText} buscando tus tareas.` },
			{ status: 502 }
		);
	}

	const data = await res.json();
	const issues: JiraIssue[] = data.issues ?? [];

	return json({
		site: JIRA_SITE,
		tasks: issues.map((issue) => ({
			key: issue.key,
			summary: issue.fields.summary,
			status: issue.fields.status?.name ?? '',
			statusCategory: issue.fields.status?.statusCategory?.key ?? 'new',
			project: issue.fields.project?.name ?? '',
			type: issue.fields.issuetype?.name ?? '',
			updated: issue.fields.updated
		}))
	});
};
