import assert from 'node:assert/strict';

const {
  PREGNANCY_CONTENT_SAFETY_NOTE,
  PREGNANCY_CONTENT_SOURCES,
  PREGNANCY_WEEKS,
  getPregnancyWeekContent,
  normalizePregnancyContentWeek,
} = await import('../src/features/pregnancy/weekContent.ts');
const { getPregnancyProgress } = await import('../src/features/pregnancy/progress.ts');

assert.equal(PREGNANCY_WEEKS.length, 40);
assert.deepEqual(
  PREGNANCY_WEEKS.map((item) => item.gestationalWeek),
  Array.from({ length: 40 }, (_, index) => index + 1),
);
assert.equal(getPregnancyWeekContent(0).gestationalWeek, 1);
assert.equal(getPregnancyWeekContent(41).gestationalWeek, 40);
assert.equal(normalizePregnancyContentWeek(Number.NaN), 1);
assert.match(PREGNANCY_CONTENT_SAFETY_NOTE, /does not diagnose/i);
assert.ok(PREGNANCY_CONTENT_SOURCES.length >= 4);
assert.equal(getPregnancyProgress('2026-10-08', new Date(2026, 0, 1, 23, 30)).gestationalWeek, 0);
assert.equal(getPregnancyProgress('2026-01-01', new Date(2026, 0, 1, 23, 30)).gestationalWeek, 40);
assert.throws(() => getPregnancyProgress('2026-02-30'), /Invalid date-only value/);

for (const item of PREGNANCY_WEEKS) {
  assert.ok(item.dailyGentleMessage.length <= 220, `Week ${item.gestationalWeek} daily message is too long.`);
  assert.ok(item.widgetBabyMessage.length <= 100, `Week ${item.gestationalWeek} baby widget message is too long.`);
  assert.ok(item.widgetWellnessMessage.length <= 100, `Week ${item.gestationalWeek} wellness widget message is too long.`);
  assert.ok(
    item.educationalWarningSigns.some((sign) => /urgent medical care/i.test(sign)),
    `Week ${item.gestationalWeek} lacks urgent-care guidance.`,
  );
}

console.log('Validated complete, safe, reusable pregnancy content for weeks 1–40.');
