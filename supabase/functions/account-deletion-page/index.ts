const ACCOUNT_DELETION_URL = "https://janani-account-deletion.pages.dev/";

function responseHeaders(): Headers {
  return new Headers({
    "Cache-Control": "no-store, max-age=0",
    "Content-Security-Policy": [
      "default-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
      "object-src 'none'",
    ].join("; "),
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Permissions-Policy":
      "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
    "Pragma": "no-cache",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  });
}

export function handleRequest(request: Request): Response {
  const headers = responseHeaders();

  if (request.method !== "GET" && request.method !== "HEAD") {
    headers.set("Allow", "GET, HEAD");
    return new Response(null, { status: 405, headers });
  }

  headers.set("Location", ACCOUNT_DELETION_URL);
  return new Response(null, { status: 302, headers });
}

if (import.meta.main) Deno.serve(handleRequest);
