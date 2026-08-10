const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

function isEmergency(text: string) {
  const value = text.toLowerCase();
  const patterns = [
    'heavy bleeding',
    'severe abdominal pain',
    'severe stomach pain',
    'trouble breathing',
    'difficulty breathing',
    'seizure',
    'fainted',
    'fainting',
    'loss of consciousness',
    'unconscious',
    'severe headache',
    'blurred vision',
    'vision changes',
  ];
  return patterns.some((item) => value.includes(item));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => null) as { message?: unknown } | null;
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (!message || message.length > 1200) {
      return new Response(JSON.stringify({ error: 'Message must be between 1 and 1200 characters.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (isEmergency(message)) {
      return new Response(JSON.stringify({
        answer: 'This could need urgent medical attention. Please contact your maternity care team or local emergency service now, especially if symptoms are severe, worsening, or you feel unsafe. Janani AI should not be used to assess an emergency.',
        safety: 'urgent',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiUrl = Deno.env.get('JANANI_AI_API_URL');
    const apiKey = Deno.env.get('JANANI_AI_API_KEY');
    const model = Deno.env.get('JANANI_AI_MODEL');

    if (!apiUrl || !apiKey || !model) {
      return new Response(JSON.stringify({ error: 'Janani AI provider is not configured yet.' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const upstream = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!upstream.ok) {
      const details = await upstream.text().catch(() => '');
      console.error('Janani AI provider error', upstream.status, details.slice(0, 500));
      return new Response(JSON.stringify({ error: 'Janani AI is temporarily unavailable.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await upstream.json();
    const answer = result?.choices?.[0]?.message?.content;
    if (typeof answer !== 'string' || !answer.trim()) {
      return new Response(JSON.stringify({ error: 'Janani AI returned an empty response.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ answer: answer.trim(), safety: 'general' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Janani AI edge function failure', error);
    return new Response(JSON.stringify({ error: 'Janani AI is temporarily unavailable.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
