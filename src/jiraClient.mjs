function credentials() {
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  if (!email || !token) {
    throw new Error(
      'Faltan JIRA_EMAIL / JIRA_API_TOKEN. Copia .env.example a .env y llena tus credenciales.'
    );
  }
  return { email, token };
}

function authHeader() {
  const { email, token } = credentials();
  const encoded = Buffer.from(`${email}:${token}`).toString('base64');
  return `Basic ${encoded}`;
}

export function parseIssueUrl(rawUrl) {
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

export async function fetchIssueWithSubtasks(host, issueKey) {
  const apiUrl = `https://${host}/rest/api/3/issue/${issueKey}?fields=subtasks,summary`;
  const res = await fetch(apiUrl, {
    headers: {
      Authorization: authHeader(),
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jira respondió ${res.status} ${res.statusText} para ${issueKey}:\n${body}`);
  }

  return res.json();
}

export async function whoAmI(host) {
  const res = await fetch(`https://${host}/rest/api/3/myself`, {
    headers: {
      Authorization: authHeader(),
      Accept: 'application/json',
    },
  });
  return { ok: res.ok, status: res.status, body: await res.text() };
}
