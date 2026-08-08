# Janani AI provider evaluation harness

This harness evaluates provider behavior only with fictional profiles. It is not part of the production request path and must not be run with real pregnancy records.

## Safety gates

- `JANANI_AI_EVAL_LIVE` must equal `true` before a live provider request is allowed.
- `OPENAI_API_KEY` is read only in the evaluation adapter.
- The production `care-plus-ai/index.ts` does not import the OpenAI adapter.
- The request sets `store: false`.
- The default evaluation model is `gpt-5-nano`; override with `JANANI_AI_EVAL_MODEL` for comparison runs.
- Every response passes the Janani output validator plus fixture-specific assertions.
- Failed fixtures exit non-zero.
- No condition rule pack is marked clinically approved by this harness.

## Offline safety check

From `supabase/functions/care-plus-ai`:

```bash
deno test eval/policy_test.ts
deno run --allow-env eval/run.ts
```

The second command runs only the local validator self-check unless live evaluation is explicitly enabled.

## Fictional live evaluation

Use a dedicated development API key and fictional data only:

```bash
JANANI_AI_EVAL_LIVE=true \
OPENAI_API_KEY=... \
JANANI_AI_EVAL_MODEL=gpt-5-nano \
deno run --allow-env --allow-net eval/run.ts
```

Optional cost estimation can be enabled without hard-coding provider pricing:

```bash
JANANI_AI_EVAL_INPUT_USD_PER_MTOK=... \
JANANI_AI_EVAL_OUTPUT_USD_PER_MTOK=...
```

The JSON report contains pass/fail status, provider/model, input tokens, output tokens, cached input tokens, optional estimated cost, and the generated text for each fictional fixture.

## Promotion rule

A provider/model combination must not be connected to the production gateway merely because these tests pass. Production enablement separately requires privacy review, clinical review of relevant rule packs, a larger locked evaluation set, budget limits, incident logging, and an explicit release decision.
