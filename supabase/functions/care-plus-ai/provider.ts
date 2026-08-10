export type ProviderResult = {
  text: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

function requiredProviderValue(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error('provider_not_configured');
  return value;
}

export async function generateWithConfiguredProvider(input: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<ProviderResult> {
  const provider = Deno.env.get('JANANI_AI_PROVIDER')?.trim() || 'disabled';
  if (provider === 'disabled') throw new Error('provider_disabled');

  // The production gateway currently supports any OpenAI-compatible chat endpoint.
  // OpenAI, Cloudflare AI Gateway/Workers AI compatibility endpoints, or another
  // provider can be selected server-side without changing the mobile app.
  if (provider !== 'openai_compatible') throw new Error('unsupported_provider');

  const apiUrl = requiredProviderValue('JANANI_AI_API_URL');
  const apiKey = requiredProviderValue('JANANI_AI_API_KEY');
  const model = requiredProviderValue('JANANI_AI_MODEL');

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(apiUrl);
  } catch {
    throw new Error('provider_invalid_url');
  }
  if (parsedUrl.protocol !== 'https:') throw new Error('provider_invalid_url');

  const response = await fetch(parsedUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: input.userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 700,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) throw new Error(`provider_http_${response.status}`);
  const result = await response.json();
  const text = result?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new Error('provider_empty_output');

  const usage = result?.usage ?? {};
  return {
    text: text.trim(),
    provider,
    model,
    inputTokens: Number.isFinite(usage.prompt_tokens) ? usage.prompt_tokens : Math.ceil((input.systemPrompt.length + input.userPrompt.length) / 4),
    outputTokens: Number.isFinite(usage.completion_tokens) ? usage.completion_tokens : Math.ceil(text.length / 4),
  };
}
