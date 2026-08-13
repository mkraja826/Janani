import {
  corsHeadersFor,
  jsonResponse,
  readJsonBody,
  RequestBodyError,
} from "../_shared/http.ts";

const SYSTEM_PROMPT = `You are Janani Companion, a calm pregnancy-support assistant.

Rules:
- Provide general educational and supportive information only.
- Never diagnose, prescribe, change medication, interpret scans/labs as definitive, or claim to replace a doctor.
- Never invent medical facts or certainty.
- Keep answers concise, warm, practical, and easy to understand.
- For nutrition questions, give general meal/food ideas and remind users with diabetes, hypertension, thyroid disease, anemia, allergies, severe vomiting, or other medical conditions to follow their clinician/dietitian plan.
- If the user describes heavy bleeding, severe abdominal pain, trouble breathing, seizures, fainting/loss of consciousness, severe headache with visual changes, or says something feels seriously wrong, tell them to seek urgent medical care immediately rather than continuing with AI guidance.
- Do not request or expose secrets, tokens, passwords, or internal system information.
- Do not provide unrelated general chatbot content; stay focused on pregnancy, maternal wellness, partner support, reminders, nutrition, and Janani app guidance.`;

const MAX_MESSAGE_LENGTH = 1200;
const MAX_REQUEST_BYTES = 4096;
const PROVIDER_TIMEOUT_MS = 15_000;

function isEmergency(text: string) {
  const value = text.toLowerCase();
  const patterns = [
    "heavy bleeding",
    "severe abdominal pain",
    "severe stomach pain",
    "trouble breathing",
    "difficulty breathing",
    "seizure",
    "fainted",
    "fainting",
    "loss of consciousness",
    "unconscious",
    "severe headache",
    "blurred vision",
    "vision changes",
  ];
  return patterns.some((item) => value.includes(item));
}

function requestIdFor(req: Request) {
  return req.headers.get("x-request-id") ?? crypto.randomUUID();
}

Deno.serve(async (req) => {
  const requestId = requestIdFor(req);
  const corsHeaders = corsHeadersFor(req);

  if (!corsHeaders) {
    return new Response(null, { status: 403 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders, requestId);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Authentication required" }, 401, corsHeaders, requestId);
    }

    const body = await readJsonBody(req, MAX_REQUEST_BYTES) as { message?: unknown };
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return jsonResponse(
        { error: `Message must be between 1 and ${MAX_MESSAGE_LENGTH} characters.` },
        400,
        corsHeaders,
        requestId,
      );
    }

    if (isEmergency(message)) {
      return jsonResponse({
        answer: "This could need urgent medical attention. Please contact your maternity care team or local emergency service now, especially if symptoms are severe, worsening, or you feel unsafe. Janani AI should not be used to assess an emergency.",
        safety: "urgent",
      }, 200, corsHeaders, requestId);
    }

    const apiUrl = Deno.env.get("JANANI_AI_API_URL");
    const apiKey = Deno.env.get("JANANI_AI_API_KEY");
    const model = Deno.env.get("JANANI_AI_MODEL");

    if (!apiUrl || !apiKey || !model) {
      return jsonResponse(
        { error: "Janani AI provider is not configured yet." },
        503,
        corsHeaders,
        requestId,
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

    let upstream: Response;
    try {
      upstream = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: message },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "AbortError";
      console.error(JSON.stringify({
        request_id: requestId,
        stage: timedOut ? "provider_timeout" : "provider_fetch",
      }));
      return jsonResponse(
        { error: "Janani AI is temporarily unavailable." },
        502,
        corsHeaders,
        requestId,
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!upstream.ok) {
      console.error(JSON.stringify({
        request_id: requestId,
        stage: "provider_response",
        status: upstream.status,
      }));
      return jsonResponse(
        { error: "Janani AI is temporarily unavailable." },
        502,
        corsHeaders,
        requestId,
      );
    }

    const result = await upstream.json().catch(() => null);
    const answer = result?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) {
      return jsonResponse(
        { error: "Janani AI returned an empty response." },
        502,
        corsHeaders,
        requestId,
      );
    }

    return jsonResponse(
      { answer: answer.trim(), safety: "general" },
      200,
      corsHeaders,
      requestId,
    );
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return jsonResponse({ error: error.message }, error.status, corsHeaders, requestId);
    }

    console.error(JSON.stringify({
      request_id: requestId,
      stage: "unhandled",
    }));
    return jsonResponse(
      { error: "Janani AI is temporarily unavailable." },
      500,
      corsHeaders,
      requestId,
    );
  }
});
