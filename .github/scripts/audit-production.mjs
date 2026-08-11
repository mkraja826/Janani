import { spawnSync } from 'node:child_process';

const ALLOWED_HIGH_ADVISORIES = new Set([
  'https://github.com/advisories/GHSA-w3rx-r6r6-pgpr',
  'https://github.com/advisories/GHSA-5p2g-fcmc-qvqq',
]);

// Both allowed advisories affect image-size <=2.0.2 through Expo/Metro build tooling.
// GitHub listed no patched version on 2026-08-12. This exception must be reviewed
// rather than silently becoming permanent.
const EXCEPTION_REVIEW_DEADLINE = new Date('2026-09-15T00:00:00Z');

if (Date.now() >= EXCEPTION_REVIEW_DEADLINE.getTime()) {
  console.error('The temporary image-size security exception has expired. Re-check the upstream advisories and dependency tree.');
  process.exit(1);
}

const result = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error('Could not execute npm audit:', result.error.message);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout || '{}');
} catch {
  console.error('npm audit did not return valid JSON.');
  if (result.stderr) console.error(result.stderr);
  process.exit(1);
}

const vulnerabilities = report.vulnerabilities ?? {};
const highOrCritical = new Set(['high', 'critical']);
const memo = new Map();

function isAllowedChain(packageName, stack = new Set()) {
  if (memo.has(packageName)) return memo.get(packageName);
  if (stack.has(packageName)) return false;

  const vulnerability = vulnerabilities[packageName];
  if (!vulnerability || !highOrCritical.has(vulnerability.severity)) {
    memo.set(packageName, true);
    return true;
  }

  const nextStack = new Set(stack);
  nextStack.add(packageName);

  let foundRelevantCause = false;
  for (const cause of vulnerability.via ?? []) {
    if (typeof cause === 'string') {
      const dependency = vulnerabilities[cause];
      if (dependency && highOrCritical.has(dependency.severity)) {
        foundRelevantCause = true;
        if (!isAllowedChain(cause, nextStack)) {
          memo.set(packageName, false);
          return false;
        }
      }
      continue;
    }

    if (!cause || !highOrCritical.has(cause.severity)) continue;
    foundRelevantCause = true;
    if (!ALLOWED_HIGH_ADVISORIES.has(cause.url)) {
      memo.set(packageName, false);
      return false;
    }
  }

  const allowed = foundRelevantCause;
  memo.set(packageName, allowed);
  return allowed;
}

const blocking = [];
const allowed = [];

for (const [packageName, vulnerability] of Object.entries(vulnerabilities)) {
  if (!highOrCritical.has(vulnerability.severity)) continue;
  if (isAllowedChain(packageName)) allowed.push(packageName);
  else blocking.push(packageName);
}

if (allowed.length) {
  console.warn(
    `Temporarily accepted high-severity dependency chain(s) caused only by the two unpatched image-size advisories: ${allowed.sort().join(', ')}`,
  );
  console.warn('Exception review deadline: 2026-09-15.');
}

if (blocking.length) {
  console.error(`Blocking high/critical production vulnerabilities remain: ${blocking.sort().join(', ')}`);
  process.exit(1);
}

const counts = report.metadata?.vulnerabilities ?? {};
console.log(
  `Production audit gate passed. Critical: ${counts.critical ?? 0}; high: ${counts.high ?? 0}; moderate: ${counts.moderate ?? 0}.`,
);
