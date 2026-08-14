import { spawnSync } from 'node:child_process';

const allowedAdvisoryUrls = new Set([
  'https://github.com/advisories/GHSA-w3rx-r6r6-pgpr',
  'https://github.com/advisories/GHSA-5p2g-fcmc-qvqq',
]);

const result = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

let report;
try {
  report = JSON.parse(result.stdout || '{}');
} catch {
  console.error('Production audit validation failed: npm audit did not return valid JSON.');
  if (result.stderr) console.error(result.stderr);
  process.exit(1);
}

const vulnerabilities = report.vulnerabilities ?? {};

function collectHighCriticalAdvisories(name, visited = new Set()) {
  if (visited.has(name)) return new Set();

  const info = vulnerabilities[name];
  if (!info) return new Set();

  const nextVisited = new Set(visited);
  nextVisited.add(name);

  const advisories = new Set();
  const via = Array.isArray(info.via) ? info.via : [];

  for (const entry of via) {
    if (typeof entry === 'string') {
      for (const advisory of collectHighCriticalAdvisories(entry, nextVisited)) {
        advisories.add(advisory);
      }
      continue;
    }

    const severity = entry?.severity;
    if ((severity === 'high' || severity === 'critical') && entry?.url) {
      advisories.add(entry.url);
    }
  }

  return advisories;
}

const blocking = [];
const allowed = [];

for (const [name, info] of Object.entries(vulnerabilities)) {
  const severity = info?.severity;
  if (severity !== 'high' && severity !== 'critical') continue;

  const advisories = collectHighCriticalAdvisories(name);
  const advisoryList = [...advisories];
  const isAllowed =
    advisoryList.length > 0 && advisoryList.every((url) => allowedAdvisoryUrls.has(url));

  if (isAllowed) {
    allowed.push({ name, severity, advisories: advisoryList });
  } else {
    blocking.push({ name, severity, advisories: advisoryList });
  }
}

if (blocking.length > 0) {
  console.error('Production audit validation failed. Blocking high/critical vulnerabilities:');
  for (const item of blocking) {
    const sources = item.advisories.length > 0 ? ` -> ${item.advisories.join(', ')}` : '';
    console.error(`- ${item.name} (${item.severity})${sources}`);
  }
  process.exit(1);
}

if (allowed.length > 0) {
  console.warn('Production audit contains tracked upstream image-size advisory chain(s):');
  for (const item of allowed) {
    console.warn(`- ${item.name} (${item.severity})`);
  }
  console.warn('Allowed advisories: GHSA-w3rx-r6r6-pgpr, GHSA-5p2g-fcmc-qvqq');
}

console.log('Production dependency audit policy passed.');
