import { whoAmI } from './jiraClient.mjs';

const host = process.argv[2] ?? 'buzzwordmx.atlassian.net';
const { ok, status, body } = await whoAmI(host);

if (ok) {
  const me = JSON.parse(body);
  console.log(`OK - autenticado como ${me.displayName} <${me.emailAddress}> en ${host}`);
} else {
  console.log(`FALLÓ (${status}) contra ${host}`);
  console.log(body);
}
