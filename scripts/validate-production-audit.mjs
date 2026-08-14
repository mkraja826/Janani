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
const memo = new Map();

function isAllowedVulnerability(name, stack = new Set()) {
  if (memo.has(name)) return memo.get(name);
  if (stack.has(name)) return false;

  const info = vulnerabilities[name];
  if (!info) return false;

  const nextStack = new Set(stack);
  nextStack.add(name);

  const via = Array.isArray(info.via) ? info.via : [];
  if (via.length === 0) return false;

  const allowed = via.every((entry) => {
    if (typeof entry === 'string') {
      return isAllowedVulnerability(entry, nextStack);
    }

    const severity = entry?.severity;
    if (severity !== 'high' && severity !== 'critical') {
      return true;
    }

    return allowedAdvisoryUrls.has(entry?.url);
  });

  memo.set(name, allowed);
  return allowed;
}

const blocking = [];
const allowed = [];

for (const [name, info] of Object.entries(vulnerabilities)) {
  const severity = info?.severity;
  if (severity !== 'high' && severity !== 'critical') continue;

  if (isAllowedVulnerability(name)) {
    allowed.push({ name, severity });
  } else {
    blocking.push({ name, severity });
  }
}

if (blocking.length > 0) {
  console.error('Production audit validation failed. Blocking high/critical vulnerabilities:');
  for (const item of blocking) {
    console.error(`- ${item.name} (${item.severity})`);
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
