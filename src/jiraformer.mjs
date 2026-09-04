import { parseIssueUrl, fetchIssueWithSubtasks } from './jiraClient.mjs';
import { formatSubtasks } from './format.mjs';
import { copyToClipboard } from './clipboard.mjs';

const rawUrl = process.argv[2];
if (!rawUrl) {
  console.error('Uso: npm start "https://tu-sitio.atlassian.net/jira/software/projects/NEX/boards/591?selectedIssue=NEX-16"');
  process.exit(1);
}

const { host, issueKey } = parseIssueUrl(rawUrl);
const issue = await fetchIssueWithSubtasks(host, issueKey);
const subtasks = issue.fields.subtasks ?? [];

if (subtasks.length === 0) {
  console.log(`${issueKey} no tiene subtareas.`);
  process.exit(0);
}

const text = formatSubtasks(subtasks);
console.log(text);

const copied = await copyToClipboard(text);
console.error(copied ? '\n(copiado al portapapeles)' : '\n(no se pudo copiar automáticamente al portapapeles)');
