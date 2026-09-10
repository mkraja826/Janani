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
const allowedXmldomBuildAdvisories = new Set([
  'https://github.com/advisories/GHSA-6gmq-8vp8-gcm6',
  'https://github.com/advisories/GHSA-6mj3-qw4j-hgrw',
  'https://github.com/advisories/GHSA-g53g-w8rj-fmg7',
  'https://github.com/advisories/GHSA-w2rr-34g9-rvrj',
  'https://github.com/advisories/GHSA-4w3w-2rp5-g8jm',
  'https://github.com/advisories/GHSA-c7q8-3ch8-vqpv',
  'https://github.com/advisories/GHSA-27p8-2357-5qqv',
  'https://github.com/advisories/GHSA-3px3-54cx-rmw9',
  'https://github.com/advisories/GHSA-vr34-hp96-76pp',
  'https://github.com/advisories/GHSA-6h8r-xr42-gp59',
  'https://github.com/advisories/GHSA-8344-3jmq-59r6',
  'https://github.com/advisories/GHSA-x4fp-j954-r2f4',
  'https://github.com/advisories/GHSA-965w-775f-mr7g',
  'https://github.com/advisories/GHSA-93r5-fhx6-vmg9',
]);
const allowedJsYamlBuildAdvisories = new Set([
  'https://github.com/advisories/GHSA-2883-xcg3-v3hh',
]);

const expectedUpstreamNode = 'node_modules/image-size-upstream';
const expectedUpstreamIntegrity =
  'sha512-IRqXKlaXwgSMAMtpNzZa1ZAe8m+Sa1770Dhk8VkSsP9LS+iHD62Zd8FQKs8fbPiagBE7BzoFX23cxFnwshpV6w==';
const reviewedXmldomBuildNodes = new Map([
  ['node_modules/@xmldom/xmldom', '0.8.13'],
  ['node_modules/plist/node_modules/@xmldom/xmldom', '0.9.10'],
]);
const reviewedJsYamlBuildNodes = new Map([
  ['node_modules/js-yaml', '3.15.1'],
]);

function fail(message) {
  console.error(`Production dependency audit failed: ${message}`);
  process.exit(1);
}

function exactReviewedNodes(nodes, expected) {
  const actual = [...(nodes ?? [])].sort();
  const wanted = [...expected.keys()].sort();
  if (actual.length !== wanted.length || actual.some((node, index) => node !== wanted[index])) {
    return false;
  }
  return actual.every((node) => lock.packages?.[node]?.version === expected.get(node));
}

function advisoriesAreReviewed(advisoryUrls, allowedSet) {
  return advisoryUrls.length > 0 && advisoryUrls.every((url) => allowedSet.has(url));
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
    .map((item) => item.url)
    .filter(Boolean);
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

  // These parser versions are pulled only by Expo/configuration build tooling in
  // the reviewed lockfile. They are not application parsers and Janani does not
  // pass user-controlled XML/YAML to them at runtime. Treat only the exact known
  // nodes + versions + advisory URLs as temporarily reviewed; any dependency
  // movement, version change, indirect cause, new advisory, or additional node
  // fails closed until the lockfile can be upgraded normally.
  const isReviewedXmldomBuildFinding =
    name === '@xmldom/xmldom'
    && !hasIndirectCause
    && advisoriesAreReviewed(advisoryUrls, allowedXmldomBuildAdvisories)
    && exactReviewedNodes(vulnerability.nodes, reviewedXmldomBuildNodes);
  const isReviewedJsYamlBuildFinding =
    name === 'js-yaml'
    && !hasIndirectCause
    && advisoriesAreReviewed(advisoryUrls, allowedJsYamlBuildAdvisories)
    && exactReviewedNodes(vulnerability.nodes, reviewedJsYamlBuildNodes);

  if (isReviewedImageSizeFinding || isReviewedXmldomBuildFinding || isReviewedJsYamlBuildFinding) {
    allowed.push(...advisoryUrls);
  } else {
    blocking.push({
      name,
      severity: vulnerability.severity,
      via: vulnerability.via,
      nodes: vulnerability.nodes,
    });
  }
}

if (blocking.length > 0) {
  console.error(JSON.stringify(blocking, null, 2));
  fail(`${blocking.length} unmitigated high or critical finding(s) remain`);
}

const counts = report.metadata?.vulnerabilities ?? {};
console.log(
  `Production dependency audit passed: ${counts.critical ?? 0} critical, `
  + `${counts.high ?? 0} high (${allowed.length} exact reviewed build/parser advisories), `
  + `${counts.moderate ?? 0} moderate.`
);
