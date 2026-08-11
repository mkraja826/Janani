import { spawnSync } from 'node:child_process';

const ALLOWED_HIGH_ADVISORIES = new Set([
  'https://github.com/advisories/GHSA-w3rx-r6r6-pgpr',
  'https://github.com/advisories/GHSA-5p2g-fcmc-qvqq',
]);

// These two advisories affect image-size <=2.0.2 through Expo/Metro build tooling.
// GitHub listed no patched version on 2026-08-12. This exception is deliberately
// exact, temporary, and must be revisited instead of becoming permanent policy.
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
const rootAdvisories = [];

for (const [packageName, vulnerability] of Object.entries(vulnerabilities)) {
  for (const cause of vulnerability.via ?? []) {
    if (typeof cause === 'string' || !cause || !highOrCritical.has(cause.severity)) continue;
    rootAdvisories.push({
      packageName,
      name: cause.name,
      severity: cause.severity,
      title: cause.title,
      url: cause.url,
    });
  }
}

const blockingRoots = rootAdvisories.filter((cause) => !ALLOWED_HIGH_ADVISORIES.has(cause.url));
const allowedRoots = rootAdvisories.filter((cause) => ALLOWED_HIGH_ADVISORIES.has(cause.url));

if (blockingRoots.length) {
  for (const cause of blockingRoots) {
    console.error(`Blocking ${cause.severity} advisory: ${cause.packageName} — ${cause.title} — ${cause.url}`);
  }
  process.exit(1);
}

// A high/critical package entry without any high/critical root advisory object is
// unexpected. Refuse to pass rather than guessing, unless at least one known allowed
// root exists in the report and every explicit high/critical root is allowed. npm's
// report represents dependent package chains by string references, which may be cyclic.
const highPackageNames = Object.entries(vulnerabilities)
  .filter(([, vulnerability]) => highOrCritical.has(vulnerability.severity))
  .map(([packageName]) => packageName);

if (highPackageNames.length && !allowedRoots.length) {
  console.error(`High/critical package entries exist but no recognized root advisory was found: ${highPackageNames.sort().join(', ')}`);
  process.exit(1);
}

if (allowedRoots.length) {
  const urls = [...new Set(allowedRoots.map((cause) => cause.url))].sort();
  console.warn(`Temporarily accepted unpatched image-size advisory root(s): ${urls.join(', ')}`);
  console.warn(`Affected high-severity dependency-chain packages: ${highPackageNames.sort().join(', ')}`);
  console.warn('Exception review deadline: 2026-09-15.');
}

const counts = report.metadata?.vulnerabilities ?? {};
console.log(
  `Production audit gate passed. Critical: ${counts.critical ?? 0}; high: ${counts.high ?? 0}; moderate: ${counts.moderate ?? 0}.`,
);
