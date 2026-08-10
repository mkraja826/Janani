import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const siteRoot = path.join(repositoryRoot, 'site');
const secureDeletionUrl = 'https://janani-account-deletion.pages.dev/';
const compatibilityDeletionUrl = 'https://brdjnhfvytdmsnwexras.supabase.co/functions/v1/account-deletion-page';
const failures = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function fail(file, message) {
  failures.push(`${path.relative(repositoryRoot, file)}: ${message}`);
}

const requiredFiles = [
  'index.html',
  'privacy/index.html',
  'terms/index.html',
  'account-deletion/index.html',
  'support/index.html',
  'assets/styles.css',
  '.nojekyll',
  'robots.txt',
  'sitemap.xml',
];

for (const relativePath of requiredFiles) {
  const target = path.join(siteRoot, relativePath);
  if (!fs.existsSync(target)) fail(target, 'required site file is missing');
}

for (const relativePath of [
  'assets/account-deletion-config.js',
  'assets/account-deletion.js',
]) {
  const target = path.join(siteRoot, relativePath);
  if (fs.existsSync(target)) {
    fail(target, 'credential-handling scripts must not be hosted on the shared GitHub Pages origin');
  }
}

const htmlFiles = fs.existsSync(siteRoot)
  ? walk(siteRoot).filter((file) => file.endsWith('.html'))
  : [];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const relativeHtmlPath = path.relative(siteRoot, file).replaceAll(path.sep, '/');

  const requiredPatterns = [
    [/^<!doctype html>/i, 'missing HTML doctype'],
    [/<html\s+lang="en">/i, 'missing page language'],
    [/<meta\s+name="viewport"/i, 'missing responsive viewport metadata'],
    [/<meta\s+name="description"/i, 'missing page description'],
    [/<meta\s+http-equiv="Content-Security-Policy"/i, 'missing Content Security Policy'],
    [/<title>[^<]+<\/title>/i, 'missing page title'],
    [/<link\s+rel="stylesheet"/i, 'missing external stylesheet'],
    [/<a\s+class="skip-link"\s+href="#main-content">/i, 'missing skip link'],
    [/<main\s+id="main-content"/i, 'missing main-content landmark'],
    [/<nav\b/i, 'missing navigation landmark'],
  ];

  for (const [pattern, message] of requiredPatterns) {
    if (!pattern.test(html)) fail(file, message);
  }

  const forbiddenPatterns = [
    [/<style\b/i, 'inline styles are not allowed by the site CSP'],
    [/\sstyle\s*=/i, 'inline style attribute is not allowed by the site CSP'],
    [/\son[a-z]+\s*=/i, 'inline event handler is not allowed'],
    [/\bmailto:/i, 'an unverified support email must not be published'],
    [/before public release/i, 'release placeholder text remains'],
    [/\badd before release\b/i, 'release placeholder text remains'],
    [/\breplace this\b/i, 'release placeholder text remains'],
  ];

  for (const [pattern, message] of forbiddenPatterns) {
    if (pattern.test(html)) fail(file, message);
  }

  if (/<script\b/i.test(html)) {
    fail(file, 'scripts are not allowed on the GitHub Pages information site');
  }

  if (relativeHtmlPath === 'account-deletion/index.html') {
    const requiredDeletionPagePatterns = [
      [secureDeletionUrl, 'canonical Cloudflare deletion-form link is missing'],
      ['information-only', 'shared-origin information-only disclosure is missing'],
      ['never asks for or processes your account credentials', 'credential boundary disclosure is missing'],
      ['dedicated Cloudflare Pages origin', 'dedicated credential-host boundary disclosure is missing'],
      ['browser sends those credentials only to Supabase Auth and the protected account-deletion function', 'credential destination disclosure is missing'],
      ['form is not submitted to Cloudflare Pages', 'Cloudflare submission boundary disclosure is missing'],
      ["script-src 'none'", 'account-deletion CSP must forbid scripts'],
      ["connect-src 'none'", 'account-deletion CSP must forbid browser connections'],
      ['<meta name="referrer" content="no-referrer">', 'account-deletion page must suppress referrers'],
    ];
    for (const [required, message] of requiredDeletionPagePatterns) {
      if (!html.includes(required)) fail(file, message);
    }

    const secureDeletionLinks = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)]
      .map((match) => match[1])
      .filter((href) => href === secureDeletionUrl);
    if (secureDeletionLinks.length !== 1) {
      fail(file, 'account-deletion page must contain exactly one secure deletion-form link');
    }

    for (const [pattern, message] of [
      [/<form\b/i, 'must not host a credential form on GitHub Pages'],
      [/<(?:input|textarea|select|button)\b/i, 'must not host interactive form controls on GitHub Pages'],
      [/\btype\s*=\s*["']password["']/i, 'must not host a password field on GitHub Pages'],
      [/\/auth\/v1\/token/i, 'must not authenticate users from GitHub Pages'],
      [/\/functions\/v1\/delete-account(?:[?"'\s/]|$)/i, 'must not invoke account deletion from GitHub Pages'],
      [/\bsb_(?:publishable|secret)_[A-Za-z0-9_-]+/i, 'must not embed an API key on GitHub Pages'],
      [new RegExp(compatibilityDeletionUrl.replaceAll('.', '\\.').replaceAll('/', '\\/'), 'i'), 'must link directly to the canonical Cloudflare form rather than the compatibility redirect'],
    ]) {
      if (pattern.test(html)) fail(file, message);
    }
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/gi)].map((match) => match[1]);
  for (const id of new Set(ids)) {
    if (ids.filter((candidate) => candidate === id).length > 1) {
      fail(file, `duplicate id "${id}"`);
    }
  }

  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/gi)) {
    const reference = match[1];
    if (reference.startsWith('https://') || reference.startsWith('#')) continue;
    if (/^(?:http:|\/\/|data:|javascript:)/i.test(reference)) {
      fail(file, `unsafe or insecure reference "${reference}"`);
      continue;
    }

    const withoutFragment = reference.split('#', 1)[0].split('?', 1)[0];
    if (!withoutFragment) continue;

    const resolved = path.resolve(path.dirname(file), decodeURIComponent(withoutFragment));
    if (resolved !== siteRoot && !resolved.startsWith(`${siteRoot}${path.sep}`)) {
      fail(file, `reference escapes site root: "${reference}"`);
      continue;
    }

    const target = fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()
      ? path.join(resolved, 'index.html')
      : resolved;
    if (!fs.existsSync(target)) fail(file, `broken internal reference "${reference}"`);
  }
}

if (failures.length > 0) {
  console.error(`Legal site validation failed with ${failures.length} problem(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} legal-site pages and ${requiredFiles.length} required files.`);
