export function formatSubtasks(subtasks) {
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
