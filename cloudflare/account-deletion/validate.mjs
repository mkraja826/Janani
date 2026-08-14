import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_ROOT = path.join(ROOT, "public");
const SITE_ORIGIN = "https://janani-account-deletion.pages.dev";
const PROJECT_ORIGIN = "https://brdjnhfvytdmsnwexras.supabase.co";
const REQUIRED_FILES = [
  "index.html",
  "styles.css",
  "config.js",
  "app.js",
  "_headers"
];

const sources = Object.fromEntries(
  await Promise.all(
    REQUIRED_FILES.map(async (name) => [
      name,
      await readFile(path.join(PUBLIC_ROOT, name), "utf8")
    ])
  )
);

function occurrenceCount(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function parseHeaders(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  assert.equal(lines[0], "/*", "_headers must use one wildcard rule");

  const headers = new Map();
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    assert.ok(line.startsWith("  "), "header lines must be indented");
    assert.ok(line.length <= 2_000, "Cloudflare limits each _headers line to 2,000 characters");
    const separator = line.indexOf(":");
    assert.ok(separator > 2, `invalid header line: ${line}`);
    const name = line.slice(2, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    assert.ok(!headers.has(name), `duplicate header: ${name}`);
    headers.set(name, value);
  }
  return headers;
}

function parseCsp(value) {
  const directives = new Map();
  for (const entry of value.split(";")) {
    const tokens = entry.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    const name = tokens.shift();
    assert.ok(!directives.has(name), `duplicate CSP directive: ${name}`);
    directives.set(name, tokens);
  }
  return directives;
}

function validateHeaders(headers) {
  const exact = new Map([
    ["cache-control", "no-store, max-age=0, must-revalidate"],
    ["pragma", "no-cache"],
    ["expires", "0"],
    ["cross-origin-opener-policy", "same-origin"],
    ["cross-origin-resource-policy", "same-origin"],
    ["origin-agent-cluster", "?1"],
    ["referrer-policy", "no-referrer"],
    ["strict-transport-security", "max-age=31536000"],
    ["x-content-type-options", "nosniff"],
    ["x-frame-options", "DENY"],
    ["x-permitted-cross-domain-policies", "none"],
    ["x-robots-tag", "noindex, nofollow, noarchive, nosnippet, noimageindex"]
  ]);

  for (const [name, expected] of exact) {
    assert.equal(headers.get(name), expected, `unexpected ${name}`);
  }

  const permissions = headers.get("permissions-policy") || "";
  for (const feature of [
    "camera",
    "display-capture",
    "document-domain",
    "geolocation",
    "microphone",
    "payment",
    "publickey-credentials-create",
    "publickey-credentials-get",
    "usb"
  ]) {
    assert.match(permissions, new RegExp(`(?:^|, )${feature}=\\(\\)(?:,|$)`));
  }

  const cspValue = headers.get("content-security-policy") || "";
  assert.doesNotMatch(cspValue, /unsafe-inline|unsafe-eval|\*|\bdata:|\bblob:|http:/i);
  const csp = parseCsp(cspValue);
  const required = new Map([
    ["default-src", ["'none'"]],
    ["base-uri", ["'none'"]],
    ["connect-src", [PROJECT_ORIGIN]],
    ["form-action", ["'none'"]],
    ["frame-ancestors", ["'none'"]],
    ["object-src", ["'none'"]],
    ["script-src", ["'self'"]],
    ["script-src-attr", ["'none'"]],
    ["style-src", ["'self'"]],
    ["style-src-attr", ["'none'"]],
    ["trusted-types", ["'none'"]],
    ["require-trusted-types-for", ["'script'"]],
    ["upgrade-insecure-requests", []]
  ]);
  for (const [name, expected] of required) {
    assert.deepEqual(csp.get(name), expected, `unexpected CSP ${name}`);
  }
}

function validateStaticSources() {
  const html = sources["index.html"];
  const config = sources["config.js"];
  const app = sources["app.js"];
  const runtime = html + "\n" + sources["styles.css"] + "\n" + config + "\n" + app;

  assert.match(html, /<meta name="referrer" content="no-referrer">/);
  assert.match(html, /<meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">/);
  assert.match(html, /<link rel="stylesheet" href="\.\/styles\.css">/);
  assert.ok(
    html.indexOf('<script src="./config.js" defer></script>') <
      html.indexOf('<script src="./app.js" defer></script>'),
    "config.js must load before app.js"
  );
  assert.equal(occurrenceCount(html, /<script\b/g), 2, "only the two local scripts are allowed");
  assert.doesNotMatch(html, /<script(?![^>]+src=)[^>]*>/i);
  assert.doesNotMatch(html, /<style\b|\sstyle\s*=|\son[a-z]+\s*=/i);
  assert.doesNotMatch(html, /<iframe\b|<object\b|<embed\b|<base\b/i);
  assert.doesNotMatch(html, /<form[^>]+(?:action|method)\s*=/i);
  assert.match(html, /Supabase Auth/);
  assert.match(html, /delete-account/);
  assert.match(html, new RegExp(SITE_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  for (const id of [
    "deletion-form",
    "email",
    "password",
    "confirmation",
    "acknowledgement",
    "submit-button",
    "status"
  ]) {
    assert.equal(occurrenceCount(html, new RegExp(`id="${id}"`, "g")), 1, `missing or duplicate #${id}`);
  }

  assert.doesNotMatch(
    runtime,
    /sb_secret_|service[_-]?role|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEYS|\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\./
  );
  assert.doesNotMatch(
    runtime,
    /localStorage|sessionStorage|indexedDB|document\.cookie|sendBeacon|caches\.|console\./
  );
  assert.equal(occurrenceCount(config, /sb_publishable_[A-Za-z0-9_-]+/g), 1);
  assert.match(config, new RegExp(PROJECT_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(config, /\/auth\/v1\/token\?grant_type=password/);
  assert.match(config, /\/auth\/v1\/logout\?scope=local/);
  assert.match(config, /\/functions\/v1\/delete-account/);
  assert.equal(occurrenceCount(app, /credentials: "omit"/g), 3);
  assert.equal(occurrenceCount(app, /referrerPolicy: "no-referrer"/g), 3);
  assert.match(app, /current_password: password/);
  assert.match(app, /finally \{\s*await logoutSession\(accessToken\);\s*clearSensitiveFields\(\);/);
  assert.match(app, /could not confirm the final result\. Your account may already be deleted/);
  assert.match(app, /recorded and may continue asynchronously/);
  assert.match(app, /window\.addEventListener\("pagehide", clearSensitiveFields\)/);

  validateHeaders(parseHeaders(sources._headers));
}

function createElement(id) {
  return {
    id,
    value: "",
    checked: false,
    disabled: false,
    dataset: {},
    attributes: new Map(),
    focused: false,
    textContent: "",
    checkValidity() {
      if (id === "email") return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.value);
      if (id === "password") return this.value.length >= 1 && this.value.length <= 256;
      return true;
    },
    focus() {
      this.focused = true;
    },
    setAttribute(name, value) {
      this.attributes.set(name, value);
    },
    removeAttribute(name) {
      this.attributes.delete(name);
    },
    addEventListener() {}
  };
}

function createHarness(fetchImplementation) {
  const ids = [
    "deletion-form",
    "email",
    "password",
    "confirmation",
    "acknowledgement",
    "submit-button",
    "status"
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, createElement(id)]));
  let submitHandler;
  const windowListeners = new Map();
  elements["deletion-form"].addEventListener = (name, listener) => {
    if (name === "submit") submitHandler = listener;
  };

  const sandbox = {
    AbortController,
    Headers,
    Response,
    URL,
    clearTimeout,
    document: {
      getElementById(id) {
        return elements[id] || null;
      }
    },
    fetch: fetchImplementation,
    setTimeout
  };
  sandbox.window = sandbox;
  sandbox.addEventListener = (name, listener) => windowListeners.set(name, listener);
  vm.createContext(sandbox);
  vm.runInContext(sources["config.js"], sandbox, { filename: "config.js" });
  vm.runInContext(sources["app.js"], sandbox, { filename: "app.js" });
  assert.equal(typeof submitHandler, "function", "submit handler was not installed");

  return {
    elements,
    windowListeners,
    async submit() {
      await submitHandler({ preventDefault() {} });
    }
  };
}

function fillValidForm(elements) {
  elements.email.value = "test@example.com";
  elements.password.value = "Disposable-password-1";
  elements.confirmation.value = "DELETE";
  elements.acknowledgement.checked = true;
}

function assertCleared(elements) {
  assert.equal(elements.email.value, "");
  assert.equal(elements.password.value, "");
  assert.equal(elements.confirmation.value, "");
  assert.equal(elements.acknowledgement.checked, false);
}

async function validateBehavior() {
  {
    const calls = [];
    const harness = createHarness(async (...args) => {
      calls.push(args);
      throw new Error("fetch must not run for local validation failures");
    });
    fillValidForm(harness.elements);
    harness.elements.confirmation.value = "delete";
    await harness.submit();
    assert.equal(calls.length, 0);
    assertCleared(harness.elements);
    assert.equal(harness.elements.status.dataset.kind, "error");
  }

  for (const cleanupComplete of [true, false]) {
    const calls = [];
    const harness = createHarness(async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith("/auth/v1/token?grant_type=password")) {
        return new Response(JSON.stringify({ access_token: "test-access-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (url.endsWith("/functions/v1/delete-account")) {
        return new Response(
          JSON.stringify({ ok: true, storage_cleanup_complete: cleanupComplete }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.endsWith("/auth/v1/logout?scope=local")) {
        return new Response(null, { status: 204 });
      }
      throw new Error(`unexpected URL: ${url}`);
    });
    fillValidForm(harness.elements);
    await harness.submit();

    assert.deepEqual(calls.map((call) => call.url), [
      PROJECT_ORIGIN + "/auth/v1/token?grant_type=password",
      PROJECT_ORIGIN + "/functions/v1/delete-account",
      PROJECT_ORIGIN + "/auth/v1/logout?scope=local"
    ]);
    for (const call of calls) {
      assert.equal(call.options.credentials, "omit");
      assert.equal(call.options.referrerPolicy, "no-referrer");
      assert.equal(call.options.cache, "no-store");
    }
    const deletionBody = JSON.parse(calls[1].options.body);
    assert.equal(deletionBody.confirmation, "DELETE");
    assert.equal(deletionBody.current_password, "Disposable-password-1");
    assertCleared(harness.elements);
    assert.equal(
      harness.elements.status.dataset.kind,
      cleanupComplete ? "success" : "warning"
    );
    if (!cleanupComplete) {
      assert.match(harness.elements.status.textContent, /recorded and may continue asynchronously/);
    }
  }

  {
    const calls = [];
    const harness = createHarness(async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith("/auth/v1/token?grant_type=password")) {
        return new Response(JSON.stringify({ access_token: "test-access-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (url.endsWith("/functions/v1/delete-account")) {
        throw new Error("simulated connection loss after request start");
      }
      return new Response(null, { status: 204 });
    });
    fillValidForm(harness.elements);
    await harness.submit();
    assert.equal(calls.length, 3, "logout must still be attempted after an unknown deletion result");
    assert.match(harness.elements.status.textContent, /could not confirm the final result/);
    assert.match(harness.elements.status.textContent, /may already be deleted/);
    assertCleared(harness.elements);
  }
}

async function validateRemote(urlValue) {
  const target = new URL(urlValue);
  assert.equal(target.origin, SITE_ORIGIN, `remote validation is locked to ${SITE_ORIGIN}`);
  assert.equal(target.pathname, "/", "remote URL must point to the site root");

  for (const name of ["index.html", "styles.css", "config.js", "app.js"]) {
    const url = name === "index.html" ? SITE_ORIGIN + "/" : SITE_ORIGIN + "/" + name;
    const response = await fetch(url, {
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer"
    });
    assert.equal(response.status, 200, `${url} returned ${response.status}`);
    validateHeaders(new Map([...response.headers].map(([key, value]) => [key.toLowerCase(), value])));
    const remoteBody = (await response.text()).replace(/\r\n/g, "\n").trimEnd();
    const localBody = sources[name].replace(/\r\n/g, "\n").trimEnd();
    assert.equal(remoteBody, localBody, `${name} does not match the reviewed local file`);
  }

  const preflight = await fetch(PROJECT_ORIGIN + "/functions/v1/delete-account", {
    method: "OPTIONS",
    headers: {
      Origin: SITE_ORIGIN,
      "Access-Control-Request-Headers": "authorization,apikey,content-type",
      "Access-Control-Request-Method": "POST"
    },
    cache: "no-store",
    credentials: "omit",
    redirect: "error",
    referrerPolicy: "no-referrer"
  });
  assert.equal(preflight.status, 204, "delete-account CORS preflight did not return 204");
  assert.equal(
    preflight.headers.get("access-control-allow-origin"),
    SITE_ORIGIN,
    "delete-account does not allow the dedicated Pages origin"
  );

  const authPreflight = await fetch(PROJECT_ORIGIN + "/auth/v1/token?grant_type=password", {
    method: "OPTIONS",
    headers: {
      Origin: SITE_ORIGIN,
      "Access-Control-Request-Headers": "apikey,content-type",
      "Access-Control-Request-Method": "POST"
    },
    cache: "no-store",
    credentials: "omit",
    redirect: "error",
    referrerPolicy: "no-referrer"
  });
  assert.ok(
    authPreflight.status === 200 || authPreflight.status === 204,
    `Supabase Auth CORS preflight returned ${authPreflight.status}`
  );
  assert.ok(
    ["*", SITE_ORIGIN].includes(authPreflight.headers.get("access-control-allow-origin")),
    "Supabase Auth does not allow the dedicated Pages origin"
  );
}

validateStaticSources();
await validateBehavior();

const remoteIndex = process.argv.indexOf("--remote");
if (remoteIndex !== -1) {
  const remoteUrl = process.argv[remoteIndex + 1];
  assert.ok(remoteUrl, "--remote requires the deployed root URL");
  await validateRemote(remoteUrl);
}

process.stdout.write(
  remoteIndex === -1
    ? "Account-deletion site validation passed (static policy + behavior).\n"
    : "Account-deletion site validation passed (static policy + behavior + live deployment).\n"
);
