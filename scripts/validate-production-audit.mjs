import { spawnSync } from 'node:child_process';

const allowedHighPackages = new Set(['image-size']);

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
const blocking = [];
const allowed = [];

for (const [name, info] of Object.entries(vulnerabilities)) {
  const severity = info?.severity;
  if (severity !== 'high' && severity !== 'critical') continue;

  if (allowedHighPackages.has(name)) {
    allowed.push({ name, severity, via: info?.via ?? [] });
    continue;
  }

  blocking.push({ name, severity, via: info?.via ?? [] });
}

if (blocking.length > 0) {
  console.error('Production audit validation failed. Blocking high/critical vulnerabilities:');
  for (const item of blocking) {
    console.error(`- ${item.name} (${item.severity})`);
  }
  process.exit(1);
}

if (allowed.length > 0) {
  console.warn('Production audit contains explicitly tracked upstream exception(s):');
  for (const item of allowed) {
    console.warn(`- ${item.name} (${item.severity})`);
  }
}

console.log('Production dependency audit policy passed.');
