import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.join(root, 'public');
const siteOrigin = 'https://janani-account-deletion.pages.dev';
const projectOrigin = 'https://brdjnhfvytdmsnwexras.supabase.co';

async function read(name) {
  return readFile(path.join(publicRoot, name), 'utf8');
}

const files = {
  html: await read('index.html'),
  css: await read('styles.css'),
  config: await read('config.js'),
  app: await read('app.js'),
  headers: await read('_headers'),
};

function count(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function parseHeaders(source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  assert.equal(lines[0], '/*', '_headers must use a wildcard route');
  const headers = new Map();
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    assert.ok(line.startsWith('  '), 'header lines must be indented');
    const separator = line.indexOf(':');
    assert.ok(separator > 2, `invalid header line: ${line}`);
    headers.set(line.slice(2, separator).trim().toLowerCase(), line.slice(separator + 1).trim());
  }
  return headers;
}

const headers = parseHeaders(files.headers);
assert.equal(headers.get('cache-control'), 'no-store, max-age=0, must-revalidate');
assert.equal(headers.get('referrer-policy'), 'no-referrer');
assert.equal(headers.get('x-frame-options'), 'DENY');
assert.equal(headers.get('x-content-type-options'), 'nosniff');
assert.match(headers.get('content-security-policy') || '', /connect-src https:\/\/brdjnhfvytdmsnwexras\.supabase\.co/);
assert.match(headers.get('content-security-policy') || '', /frame-ancestors 'none'/);

assert.match(files.html, new RegExp(siteOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
assert.equal(count(files.html, /<script\b/g), 2, 'only config.js and app.js should be loaded');
assert.match(files.html, /<script src="\.\/config\.js" defer><\/script>/);
assert.match(files.html, /<script src="\.\/app\.js" defer><\/script>/);
assert.doesNotMatch(files.html, /<script(?![^>]+src=)[^>]*>/i, 'inline scripts are not allowed');
assert.doesNotMatch(files.html, /<style\b|\sstyle\s*=|\son[a-z]+\s*=/i, 'inline style/event handlers are not allowed');
assert.match(files.html, /type="password"/);
assert.match(files.html, /Type DELETE to confirm/);

const runtime = `${files.html}\n${files.css}\n${files.config}\n${files.app}`;
assert.doesNotMatch(runtime, /sb_secret_|service[_-]?role|SUPABASE_SERVICE_ROLE_KEY/i, 'secret keys must not be present');
assert.equal(count(files.config, /sb_publishable_[A-Za-z0-9_-]+/g), 1, 'exactly one public publishable key is expected');
assert.match(files.config, new RegExp(projectOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
assert.match(files.config, /\/auth\/v1\/token\?grant_type=password/);
assert.match(files.config, /\/functions\/v1\/delete-account/);
assert.equal(count(files.app, /credentials: "omit"/g), 3, 'all network calls must omit browser credentials');
assert.equal(count(files.app, /referrerPolicy: "no-referrer"/g), 3, 'all network calls must suppress referrers');
assert.match(files.app, /current_password: password/);
assert.match(files.app, /clearSensitiveFields/);
assert.match(files.app, /pagehide/);
assert.match(files.app, /could not confirm the final result/);

const remoteIndex = process.argv.indexOf('--remote');
if (remoteIndex !== -1) {
  const remoteUrl = process.argv[remoteIndex + 1];
  assert.ok(remoteUrl, '--remote requires a URL');
  const target = new URL(remoteUrl);
  assert.equal(target.origin, siteOrigin, `remote validation is locked to ${siteOrigin}`);
  assert.equal(target.pathname, '/', 'remote URL must point to the deployed root');
}

process.stdout.write('Account-deletion static validation passed.\n');
