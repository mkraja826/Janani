import { handleRequest } from "./index.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test("redirects GET and HEAD to the dedicated deletion origin", async () => {
  for (const method of ["GET", "HEAD"]) {
    const response = handleRequest(
      new Request("https://example.test/functions/v1/account-deletion-page", {
        method,
      }),
    );

    assert(response.status === 302, `${method} should redirect`);
    assert(
      response.headers.get("location") ===
        "https://janani-account-deletion.pages.dev/",
      `${method} redirect target is wrong`,
    );
    assert(
      (await response.text()) === "",
      `${method} response must have no body`,
    );
    assert(
      response.headers.get("cache-control") === "no-store, max-age=0",
      "redirect must not be cached",
    );
    assert(
      (response.headers.get("content-security-policy") ?? "").includes(
        "frame-ancestors 'none'",
      ),
      "redirect response must block framing",
    );
    assert(
      response.headers.get("x-frame-options") === "DENY",
      "redirect response must send X-Frame-Options",
    );
  }
});

Deno.test("rejects mutation methods without redirecting", async () => {
  const response = handleRequest(
    new Request("https://example.test/functions/v1/account-deletion-page", {
      method: "POST",
    }),
  );

  assert(response.status === 405, "POST should be rejected");
  assert(response.headers.get("allow") === "GET, HEAD", "Allow header missing");
  assert(response.headers.get("location") === null, "POST must not redirect");
  assert((await response.text()) === "", "405 response must have no body");
});
