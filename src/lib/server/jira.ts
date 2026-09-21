import { JIRA_EMAIL, JIRA_API_TOKEN } from '$env/static/private';

function authHeader() {
	return `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`;
}

export function parseIssueUrl(rawUrl: string) {
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

export type Subtask = { key: string; fields: { summary: string } };

export function formatSubtasks(subtasks: Subtask[]) {
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

export async function fetchIssueSubtasks(host: string, issueKey: string): Promise<Subtask[]> {
	const res = await fetch(`https://${host}/rest/api/3/issue/${issueKey}?fields=subtasks,summary`, {
		headers: {
			Authorization: authHeader(),
			Accept: 'application/json'
		}
	});

	if (!res.ok) {
		throw new Error(`Jira respondió ${res.status} ${res.statusText} para ${issueKey}.`);
	}

	const issue = await res.json();
	return issue.fields?.subtasks ?? [];
}
