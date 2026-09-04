import { spawn } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

// clip.exe copies stdin using the console's OEM codepage, which mangles
// accented characters. Set-Clipboard reading a file explicitly as UTF-8
// sidesteps that entirely.
async function copyWindows(text) {
  const file = join(tmpdir(), `jiraformer-clip-${randomUUID()}.txt`);
  await writeFile(file, text, 'utf8');
  try {
    await new Promise((resolve, reject) => {
      const child = spawn('powershell', [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `Set-Clipboard -Value (Get-Content -Raw -Encoding UTF8 -LiteralPath '${file}')`,
      ]);
      child.on('error', reject);
      child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`powershell exit ${code}`))));
    });
    return true;
  } catch {
    return false;
  } finally {
    await unlink(file).catch(() => {});
  }
}

function copyUnix(text) {
  const cmd = process.platform === 'darwin' ? 'pbcopy' : 'xclip';
  const args = process.platform === 'linux' ? ['-selection', 'clipboard'] : [];

  return new Promise((resolve) => {
    try {
      const child = spawn(cmd, args, { stdio: ['pipe', 'ignore', 'ignore'] });
      child.on('error', () => resolve(false));
      child.on('close', (code) => resolve(code === 0));
      child.stdin.end(text);
    } catch {
      resolve(false);
    }
  });
}

export function copyToClipboard(text) {
  return process.platform === 'win32' ? copyWindows(text) : copyUnix(text);
}
