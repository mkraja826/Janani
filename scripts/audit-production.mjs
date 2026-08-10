import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const lock = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'package-lock.json'), 'utf8')
);

const allowedImageSizeAdvisories = new Set([
  'https://github.com/advisories/GHSA-w3rx-r6r6-pgpr',
  'https://github.com/advisories/GHSA-5p2g-fcmc-qvqq',
]);
const expectedUpstreamNode = 'node_modules/image-size-upstream';
const expectedUpstreamIntegrity =
  'sha512-IRqXKlaXwgSMAMtpNzZa1ZAe8m+Sa1770Dhk8VkSsP9LS+iHD62Zd8FQKs8fbPiagBE7BzoFX23cxFnwshpV6w==';

function fail(message) {
  console.error(`Production dependency audit failed: ${message}`);
  process.exit(1);
}

const wrapperLock = lock.packages?.['node_modules/image-size'];
const upstreamLock = lock.packages?.[expectedUpstreamNode];
if (wrapperLock?.resolved !== 'vendor/image-size-compat' || wrapperLock?.link !== true) {
  fail('Metro must resolve image-size through the source-controlled Janani adapter.');
}
if (
  upstreamLock?.name !== 'image-size'
  || upstreamLock?.version !== '2.0.2'
  || upstreamLock?.integrity !== expectedUpstreamIntegrity
) {
  fail('the reviewed official image-size@2.0.2 lock entry changed');
}

const npmExecPath = process.env.npm_execpath;
if (!npmExecPath) {
  fail('run this check through npm so the audited npm executable is unambiguous');
}

const auditResult = spawnSync(
  process.execPath,
  [npmExecPath, 'audit', '--omit=dev', '--json'],
  {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  }
);
if (auditResult.error) fail(auditResult.error.message);

let report;
try {
  report = JSON.parse(auditResult.stdout);
} catch {
  if (auditResult.stderr) console.error(auditResult.stderr.trim());
  fail('npm did not return a valid JSON audit report');
}
if (report.error) fail(report.error.summary ?? report.error.message ?? 'npm audit error');

const blocking = [];
const allowed = [];
for (const [name, vulnerability] of Object.entries(report.vulnerabilities ?? {})) {
  if (!['high', 'critical'].includes(vulnerability.severity)) continue;

  const advisoryUrls = (vulnerability.via ?? [])
    .filter((item) => item && typeof item === 'object')
    .map((item) => item.url);
  const hasIndirectCause = (vulnerability.via ?? []).some(
    (item) => typeof item === 'string'
  );
  const isReviewedImageSizeFinding =
    name === 'image-size'
    && !hasIndirectCause
    && advisoryUrls.length === allowedImageSizeAdvisories.size
    && advisoryUrls.every((url) => allowedImageSizeAdvisories.has(url))
    && (vulnerability.nodes ?? []).length === 1
    && vulnerability.nodes[0] === expectedUpstreamNode;

  if (isReviewedImageSizeFinding) {
    allowed.push(...advisoryUrls);
  } else {
    blocking.push({ name, severity: vulnerability.severity, via: vulnerability.via });
  }
}

if (blocking.length > 0) {
  console.error(JSON.stringify(blocking, null, 2));
  fail(`${blocking.length} unmitigated high or critical finding(s) remain`);
}

const counts = report.metadata?.vulnerabilities ?? {};
console.log(
  `Production dependency audit passed: ${counts.critical ?? 0} critical, `
  + `${counts.high ?? 0} high (${allowed.length} reviewed parser advisories mitigated), `
  + `${counts.moderate ?? 0} moderate.`
);
