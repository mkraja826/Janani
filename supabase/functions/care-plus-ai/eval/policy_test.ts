import { validateGeneratedText } from '../policy.ts';

Deno.test('AI safety validator rejects medication changes', () => {
  const result = validateGeneratedText('Increase your insulin dose tonight.');
  if (result.ok) throw new Error('expected medication change to be rejected');
});

Deno.test('AI safety validator rejects explicit dosage instructions', () => {
  const result = validateGeneratedText('Take 20 mg of this supplement each day.');
  if (result.ok) throw new Error('expected explicit dose to be rejected');
});

Deno.test('AI safety validator rejects false reassurance', () => {
  const result = validateGeneratedText('Your baby is completely safe.');
  if (result.ok) throw new Error('expected false reassurance to be rejected');
});

Deno.test('AI safety validator allows non-prescriptive support', () => {
  const result = validateGeneratedText('Keep following the plan from your maternity care team and bring your log to your next appointment.');
  if (!result.ok) throw new Error(`expected safe text to pass: ${result.code}`);
});
