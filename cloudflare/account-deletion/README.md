# Janani account-deletion site

This directory is the complete static source for the dedicated credential-handling origin:

`https://janani-account-deletion.pages.dev/`

The page makes direct browser requests to the Janani Supabase project. It does not proxy form data through Cloudflare Pages, use Pages Functions, or persist browser state. `config.js` contains only the active public `sb_publishable_...` key; never add a Supabase secret key, service-role key, analytics, third-party assets, or client-side storage here.

## Security prerequisites

The protected `delete-account` Edge Function restricts browser origins. Its
source-controlled built-in allowlist contains only the exact production Pages
origin, `https://janani-account-deletion.pages.dev`. Deploy the reviewed
`delete-account` function before publishing this page. Native and trusted
server-to-server calls remain supported because they do not send an `Origin`
header. Optional `ALLOWED_ORIGINS` values are reserved for explicitly reviewed
temporary environments and must not include shared hosting origins.

## Local validation

Run the source, policy, and simulated browser-flow checks before every deployment:

```powershell
Set-Location C:\janani\cloudflare\account-deletion
node .\validate.mjs
node --check .\public\config.js
node --check .\public\app.js
node --check .\validate.mjs
```

The validator checks the Cloudflare `_headers` policy, the no-secret/no-storage boundary, absolute Supabase endpoints, field clearing, best-effort logout, deletion-timeout uncertainty, and both storage-cleanup outcomes.

## Cloudflare Pages deployment

Authenticate Wrangler and create the Direct Upload project once if it does not already exist:

```powershell
npx wrangler whoami
npx wrangler pages project create janani-account-deletion
```

Confirm Cloudflare assigns exactly `https://janani-account-deletion.pages.dev`. Do not publish legal/store links to a suffixed or preview hostname.

Deploy the reviewed directory to the production branch:

```powershell
Set-Location C:\janani\cloudflare\account-deletion
npx wrangler pages deploy .\public --project-name janani-account-deletion --branch main
```

Cloudflare Pages reads `_headers` from the uploaded static directory and applies it to the static responses. This project intentionally has no Pages Functions.

## Post-deploy verification

Run the live validator. It compares every served page asset with the reviewed local source, checks all response security headers, and verifies non-destructive CORS preflights to Supabase Auth and `delete-account`:

```powershell
Set-Location C:\janani\cloudflare\account-deletion
node .\validate.mjs --remote https://janani-account-deletion.pages.dev/
```

Also inspect the response manually if needed:

```powershell
curl.exe -sS -D - -o NUL https://janani-account-deletion.pages.dev/
curl.exe -sS -D - -o NUL -X OPTIONS https://brdjnhfvytdmsnwexras.supabase.co/functions/v1/delete-account -H "Origin: https://janani-account-deletion.pages.dev" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: authorization,apikey,content-type"
```

Expect `X-Frame-Options: DENY`, `Content-Security-Policy` with `frame-ancestors 'none'`, `Cache-Control: no-store`, and an exact `Access-Control-Allow-Origin: https://janani-account-deletion.pages.dev` on the preflight.

Finally, perform one end-to-end deletion using an explicitly disposable Janani account. A timeout or network failure after the deletion request begins has an unknown final result, so do not immediately repeat it; verify later whether sign-in still succeeds.
