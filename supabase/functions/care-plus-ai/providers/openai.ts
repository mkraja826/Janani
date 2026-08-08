export type ProviderRequest = {
  system: string;
  user: string;
  maxOutputTokens?: number;
};

export type ProviderResult = {
  provider: 'openai';
  model: string;
  text: string;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  requestId: string | null;
};

type OpenAIResponse = {
  id?: string;
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    input_tokens_details?: { cached_tokens?: number };
  };
  error?: { message?: string };
};

function extractText(body: OpenAIResponse): string {
  if (typeof body.output_text === 'string' && body.output_text.trim()) return body.output_text.trim();
  const parts: string[] = [];
  for (const item of body.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === 'output_text' && typeof content.text === 'string') parts.push(content.text);
    }
  }
  return parts.join('\n').trim();
}

/**
 * Evaluation-only OpenAI Responses API adapter.
 *
 * This file is intentionally NOT imported by the production gateway entrypoint.
 * A live call requires both JANANI_AI_EVAL_LIVE=true and OPENAI_API_KEY.
 */
export async function runOpenAiEval(request: ProviderRequest): Promise<ProviderResult> {
  if (Deno.env.get('JANANI_AI_EVAL_LIVE') !== 'true') {
    throw new Error('live_eval_disabled');
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('openai_api_key_missing');

  const model = Deno.env.get('JANANI_AI_EVAL_MODEL') ?? 'gpt-5-nano';
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      store: false,
      input: [
        { role: 'system', content: request.system },
        { role: 'user', content: request.user },
      ],
      max_output_tokens: request.maxOutputTokens ?? 450,
    }),
  });

  const body = await response.json() as OpenAIResponse;
  if (!response.ok) {
    throw new Error(`openai_error:${response.status}:${body.error?.message ?? 'unknown'}`);
  }

  const text = extractText(body);
  return {
    provider: 'openai',
    model,
    text,
    inputTokens: body.usage?.input_tokens ?? 0,
    outputTokens: body.usage?.output_tokens ?? 0,
    cachedInputTokens: body.usage?.input_tokens_details?.cached_tokens ?? 0,
    requestId: body.id ?? null,
  };
}
