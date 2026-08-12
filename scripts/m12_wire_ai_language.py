from pathlib import Path

p = Path('supabase/functions/janani-ai/index.ts')
s = p.read_text()

http_import = '''import {
  type CorsHeaders,
  corsHeadersFor,
  jsonResponse,
  readJsonBody,
  RequestBodyError,
} from "../_shared/http.ts";
'''
language_import = '''import {
  resolveResponseLanguage,
  responseLanguageInstruction,
} from "../_shared/jananiLanguage.ts";
'''
if language_import not in s:
    if http_import not in s:
        raise SystemExit('http import anchor missing')
    s = s.replace(http_import, http_import + language_import, 1)

role_line = '    const role = memberships?.[0]?.role === "mother" ? "mother" : "partner";\n'
profile_block = '''    const role = memberships?.[0]?.role === "mother" ? "mother" : "partner";
    const { data: profileLanguage, error: profileLanguageError } = await admin
      .from("profiles")
      .select("preferred_language")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (profileLanguageError) {
      console.error(JSON.stringify({ request_id: requestId, stage: "profile-language", code: profileLanguageError.code }));
    }
    const responseLanguage = resolveResponseLanguage(profileLanguage?.preferred_language);
'''
if profile_block not in s:
    if role_line not in s:
        raise SystemExit('role anchor missing')
    s = s.replace(role_line, profile_block, 1)

old_provider = '''        content: `${SYSTEM_PROMPT}\\n\\n${JANANI_TONE_PROMPT}\\n\\n${clinicalModePrompt(safety)}\\n\\n${toneStateInstruction(toneState)}`,
'''
new_provider = '''        content: `${SYSTEM_PROMPT}\\n\\n${JANANI_TONE_PROMPT}\\n\\n${clinicalModePrompt(safety)}\\n\\n${toneStateInstruction(toneState)}\\n\\n${responseLanguageInstruction(responseLanguage)}`,
'''
if old_provider not in s:
    raise SystemExit('provider system prompt target missing')
s = s.replace(old_provider, new_provider, 1)

old_metadata = '''      role_mode: role === "mother" ? "mother" : "partner_general",
      tone_state: toneState,
'''
new_metadata = '''      role_mode: role === "mother" ? "mother" : "partner_general",
      tone_state: toneState,
      response_language: responseLanguage,
'''
if old_metadata not in s:
    raise SystemExit('response metadata target missing')
s = s.replace(old_metadata, new_metadata, 1)

# Emergency and reviewed safety responses intentionally remain deterministic English
# until clinically reviewed localized safety copy is available.
old_emergency = '''        selected_topics: [],
        tone_state: "urgent",
'''
new_emergency = '''        selected_topics: [],
        tone_state: "urgent",
        response_language: "en",
'''
if old_emergency not in s:
    raise SystemExit('emergency metadata target missing')
s = s.replace(old_emergency, new_emergency, 1)

old_attention = '''          clinical_content_available: safety.clinicalContentAvailable,
          tone_state: safety.highestSeverity === "urgent" ? "urgent" : "attention",
'''
new_attention = '''          clinical_content_available: safety.clinicalContentAvailable,
          tone_state: safety.highestSeverity === "urgent" ? "urgent" : "attention",
          response_language: "en",
'''
if old_attention not in s:
    raise SystemExit('attention metadata target missing')
s = s.replace(old_attention, new_attention, 1)

p.write_text(s)
