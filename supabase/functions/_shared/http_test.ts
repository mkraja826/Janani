import { corsHeadersFor } from "./http.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function requestFrom(origin?: string): Request {
  return new Request("https://example.test/functions/v1/delete-account", {
    headers: origin ? { Origin: origin } : undefined,
    method: "OPTIONS",
  });
}

Deno.test("CORS allows only the dedicated production web origin", () => {
  const origin = "https://janani-account-deletion.pages.dev";
  const headers = corsHeadersFor(requestFrom(origin));
  assert(headers !== null, `Expected ${origin} to be allowed`);
  assert(
    headers["Access-Control-Allow-Origin"] === origin,
    `Expected ${origin} to be echoed exactly`,
  );
  assert(headers.Vary === "Origin", "CORS response should vary by origin");
});

Deno.test("CORS rejects unknown and near-match origins", () => {
  const previous = Deno.env.get("ALLOWED_ORIGINS");
  Deno.env.delete("ALLOWED_ORIGINS");

  try {
    for (
      const origin of [
        "https://attacker.example",
        "https://mkraja826.github.io",
        "https://brdjnhfvytdmsnwexras.supabase.co",
        "https://janani-account-deletion.pages.dev.attacker.example",
        "https://janani-account-deletion.pages.dev/",
        "http://janani-account-deletion.pages.dev",
        "https://brdjnhfvytdmsnwexras.supabase.co.attacker.example",
        "https://brdjnhfvytdmsnwexras.supabase.co/",
        "http://brdjnhfvytdmsnwexras.supabase.co",
      ]
    ) {
      assert(
        corsHeadersFor(requestFrom(origin)) === null,
        `Expected ${origin} to be rejected`,
      );
    }
  } finally {
    if (previous === undefined) {
      Deno.env.delete("ALLOWED_ORIGINS");
    } else {
      Deno.env.set("ALLOWED_ORIGINS", previous);
    }
  }
});

Deno.test("CORS still supports explicit environment origins", () => {
  const previous = Deno.env.get("ALLOWED_ORIGINS");
  Deno.env.set(
    "ALLOWED_ORIGINS",
    " https://preview.example,https://staging.example ",
  );

  try {
    for (
      const origin of [
        "https://preview.example",
        "https://staging.example",
      ]
    ) {
      const headers = corsHeadersFor(requestFrom(origin));
      assert(headers !== null, `Expected ${origin} to be allowed from env`);
      assert(headers["Access-Control-Allow-Origin"] === origin, "Wrong origin");
    }
  } finally {
    if (previous === undefined) {
      Deno.env.delete("ALLOWED_ORIGINS");
    } else {
      Deno.env.set("ALLOWED_ORIGINS", previous);
    }
  }
});

Deno.test("CORS permits server-to-server requests without an Origin", () => {
  const headers = corsHeadersFor(requestFrom());
  assert(headers !== null, "Origin-less request should be accepted");
  assert(
    !("Access-Control-Allow-Origin" in headers),
    "Origin-less response should not invent an allow-origin value",
  );
});
