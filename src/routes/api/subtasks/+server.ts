import { json } from '@sveltejs/kit';
import { JIRA_EMAIL, JIRA_API_TOKEN } from '$env/static/private';
import type { RequestHandler } from './$types';

function authHeader() {
	return `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`;
}

function parseIssueUrl(rawUrl: string) {
	const url = new URL(rawUrl);
	const host = url.host;

	const selectedIssue = url.searchParams.get('selectedIssue');
	if (selectedIssue) return { host, issueKey: selectedIssue };

	const browseMatch = url.pathname.match(/\/browse\/([A-Z][A-Z0-9]*-\d+)/i);
	if (browseMatch) return { host, issueKey: browseMatch[1] };

	throw new Error(
		'No encontré la clave de la historia en la URL (esperaba ?selectedIssue=NEX-16 o /browse/NEX-16).'
	);
}

type Subtask = { key: string; fields: { summary: string } };

function formatSubtasks(subtasks: Subtask[]) {
	return subtasks
		.slice()
		.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }))
		.map(({ key, fields }) => {
			const [project, number] = key.split('-');
			const summary = (fields.summary || '').trim();
			const withPeriod = /[.!?]$/.test(summary) ? summary : `${summary}.`;
			return `${project} ${number} - ${withPeriod}`;
		})
		.join('\n');
}

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

	const res = await fetch(`https://${host}/rest/api/3/issue/${issueKey}?fields=subtasks,summary`, {
		headers: {
			Authorization: authHeader(),
			Accept: 'application/json'
		}
	});

	if (!res.ok) {
		return json(
			{ error: `Jira respondió ${res.status} ${res.statusText} para ${issueKey}.` },
			{ status: 502 }
		);
	}

	const issue = await res.json();
	const subtasks: Subtask[] = issue.fields?.subtasks ?? [];

	return json({ issueKey, text: formatSubtasks(subtasks) });
};
