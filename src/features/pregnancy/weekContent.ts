export type PregnancyTrimester = 1 | 2 | 3;

export type PregnancyWeekContent = {
  gestationalWeek: number;
  trimester: PregnancyTrimester;
  babyDevelopment: string[];
  motherChanges: string[];
  commonExperiences: string[];
  nutritionFocus: string[];
  hydration: string[];
  movementAndRestGuidance: string[];
  emotionalWellbeing: string[];
  partnerGuidance: string[];
  thingsToPrepare: string[];
  commonUpcomingTestsAndAppointments: string[];
  suggestedClinicianQuestions: string[];
  educationalWarningSigns: string[];
  dailyGentleMessage: string;
  widgetBabyMessage: string;
  widgetWellnessMessage: string;
};

type WeekCore = {
  week: number;
  baby: string;
  mother: string;
  common: string;
  gentle: string;
  widgetBaby: string;
};

type StageGuidance = Pick<
  PregnancyWeekContent,
  | 'nutritionFocus'
  | 'hydration'
  | 'movementAndRestGuidance'
  | 'emotionalWellbeing'
  | 'partnerGuidance'
  | 'thingsToPrepare'
  | 'commonUpcomingTestsAndAppointments'
  | 'suggestedClinicianQuestions'
  | 'widgetWellnessMessage'
>;

export const PREGNANCY_CONTENT_SOURCES = [
  'https://medlineplus.gov/ency/article/002398.htm',
  'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/',
  'https://www.acog.org/womens-health/faqs/prenatal-care',
  'https://www.acog.org/womens-health/faqs/routine-tests-during-pregnancy',
  'https://www.acog.org/womens-health/faqs/a-partners-guide-to-pregnancy',
  'https://www.cdc.gov/hearher/maternal-warning-signs/index.html',
] as const;

export const PREGNANCY_CONTENT_SAFETY_NOTE =
  'Pregnancy timing, symptoms, tests, and development vary. Janani offers supportive education only and does not diagnose or replace your maternity care team.';

const WEEK_CORE: WeekCore[] = [
  { week: 1, baby: 'Pregnancy is conventionally dated from the first day of the last menstrual period, so conception usually has not happened yet.', mother: 'Your body may be beginning a new menstrual cycle, without pregnancy-specific changes yet.', common: 'Most people do not notice pregnancy symptoms at this stage.', gentle: 'Your pregnancy timeline starts with dating, even before conception may occur. One calm day at a time is enough.', widgetBaby: 'Dating begins before conception may occur.' },
  { week: 2, baby: 'Ovulation may be approaching or occurring around this stage, although timing differs from person to person.', mother: 'Hormonal changes may support ovulation, but pregnancy symptoms are not expected for everyone.', common: 'Cycle-related changes may be subtle or absent.', gentle: 'Bodies follow different timelines. Be kind to yours as this cycle unfolds.', widgetBaby: 'Ovulation timing may vary this week.' },
  { week: 3, baby: 'If fertilization occurs, a tiny group of cells may begin dividing while travelling toward the uterus.', mother: 'You may not feel any clear change while these very early events happen.', common: 'Many people still feel exactly as they usually do.', gentle: 'Very early changes can be quiet. Rest in the uncertainty rather than expecting a particular feeling.', widgetBaby: 'Tiny cells may be beginning their journey.' },
  { week: 4, baby: 'A developing blastocyst may be implanting in the uterine lining around this stage.', mother: 'A missed period or a positive home test may be the first sign, but timing and symptoms vary.', common: 'Mild cramping, light spotting, breast tenderness, or no symptoms may occur.', gentle: 'However today feels, your experience does not need to match anyone else’s.', widgetBaby: 'Implantation may be happening around this stage.' },
  { week: 5, baby: 'The early nervous system and other foundational structures are beginning to form.', mother: 'Pregnancy hormones may rise and fatigue, breast tenderness, or nausea may begin.', common: 'Frequent urination, food aversions, or no strong symptoms may occur.', gentle: 'Small meals, gentle hydration, and rest can be meaningful care today.', widgetBaby: 'Early foundations are beginning to form.' },
  { week: 6, baby: 'The embryo is growing quickly, with early limb buds and facial structures beginning to develop.', mother: 'Nausea and tiredness may become more noticeable, though symptom strength varies widely.', common: 'Bloating, smell sensitivity, mood changes, or mild cramping may occur.', gentle: 'You do not have to push through fatigue. A slower pace is still progress.', widgetBaby: 'Early limb and facial structures may be forming.' },
  { week: 7, baby: 'The brain and spinal cord continue developing, and the head grows rapidly around this stage.', mother: 'Hormonal changes may affect digestion, energy, skin, and emotions.', common: 'Nausea, excess saliva, constipation, or vivid dreams may occur.', gentle: 'Choose the next manageable thing: a sip, a bite, a breath, or some rest.', widgetBaby: 'Brain development is moving quickly this week.' },
  { week: 8, baby: 'Early arms, legs, fingers, and toes are becoming more defined, while organs continue forming.', mother: 'The uterus is growing even if there is little visible change from the outside.', common: 'Fatigue, nausea, tender breasts, and changing appetite may continue.', gentle: 'Your body may be doing a great deal even when the outside looks unchanged.', widgetBaby: 'Tiny limbs are becoming more defined.' },
  { week: 9, baby: 'Major body structures are present in early form and continue to mature and change.', mother: 'Blood volume and hormone changes may contribute to tiredness, dizziness, or headaches.', common: 'Food preferences, bloating, heartburn, or emotional shifts may occur.', gentle: 'Regular food, fluids, and pauses can help make a demanding day gentler.', widgetBaby: 'Early body structures continue to mature.' },
  { week: 10, baby: 'The fetal period begins around this stage, with continued growth and refinement of developing organs and limbs.', mother: 'Your waist may feel different even if a pregnancy bump is not yet visible.', common: 'Nausea, tiredness, constipation, or increased vaginal discharge may occur.', gentle: 'There is no correct way to look or feel at week 10.', widgetBaby: 'Growth and refinement continue this week.' },
  { week: 11, baby: 'Fingers and toes are separating and small movements may occur, although you will not usually feel them yet.', mother: 'Hormone-related symptoms may continue or begin to ease gradually.', common: 'Changes in appetite, gums, skin, hair, or digestion may occur.', gentle: 'Let your own symptoms set the pace instead of comparing timelines.', widgetBaby: 'Tiny fingers and toes are taking shape.' },
  { week: 12, baby: 'The fetus is moving and developing reflexes, while organs continue maturing.', mother: 'For some people nausea begins to ease; for others it continues beyond this point.', common: 'Energy may slowly improve, but fatigue and headaches may still occur.', gentle: 'A changing symptom pattern can be normal, and your clinician is there for concerns.', widgetBaby: 'Movement and reflex development continue.' },
  { week: 13, baby: 'Growth continues as bones, muscles, and facial features become more defined.', mother: 'The uterus is rising and a small bump may begin to show, though body shapes vary.', common: 'Round-ligament sensations, appetite changes, or continuing nausea may occur.', gentle: 'You are entering a new stage, without needing symptoms to change on schedule.', widgetBaby: 'Bones and features are becoming more defined.' },
  { week: 14, baby: 'Facial muscles and coordinated movements continue developing around the start of the second trimester.', mother: 'Some people notice more energy, while others still need substantial rest.', common: 'Nasal congestion, gum sensitivity, appetite changes, or stretching sensations may occur.', gentle: 'Welcome any extra energy gently, and keep making room for rest.', widgetBaby: 'Coordinated movements are developing.' },
  { week: 15, baby: 'The skeleton continues to strengthen and hearing structures continue developing.', mother: 'Circulation and skin changes may become more noticeable.', common: 'Dizziness, heartburn, nosebleeds, or ligament discomfort may occur.', gentle: 'Move slowly when you need to, especially if you feel light-headed.', widgetBaby: 'The skeleton and hearing structures are developing.' },
  { week: 16, baby: 'The fetus is becoming more active, and some people may soon notice the first fluttering movements.', mother: 'Your bump may be more visible and posture may begin to change.', common: 'Backache, constipation, headaches, or early movement sensations may occur.', gentle: 'First movements arrive on different schedules; there is no need to compare.', widgetBaby: 'Small movements may soon become noticeable.' },
  { week: 17, baby: 'The skeleton and joints continue developing, and early fat stores begin to form.', mother: 'The growing uterus may change balance, sleep positions, and comfort.', common: 'Stretching skin, vivid dreams, increased appetite, or back discomfort may occur.', gentle: 'A pillow, a pause, or a change of position can be useful care.', widgetBaby: 'Joints and early fat stores are developing.' },
  { week: 18, baby: 'Ears are moving toward their usual position and hearing pathways continue to develop.', mother: 'You may notice movement, but it can still be normal not to feel it yet, especially in a first pregnancy.', common: 'Leg cramps, backache, swelling, or sleep changes may occur.', gentle: 'Your baby’s movement story is individual and may unfold gradually.', widgetBaby: 'Hearing pathways continue developing.' },
  { week: 19, baby: 'Protective vernix begins covering the skin and sensory development continues.', mother: 'The uterus is growing and may contribute to ligament, back, or pelvic discomfort.', common: 'Movement flutters, skin changes, heartburn, or breathlessness with exertion may occur.', gentle: 'Notice what helps you feel supported, then build a little more of it into today.', widgetBaby: 'A protective skin coating is beginning to form.' },
  { week: 20, baby: 'This is around the halfway point of a 40-week pregnancy, with continued growth and increasingly coordinated movement.', mother: 'Movements may become clearer, although timing, location, and pattern vary.', common: 'Backache, indigestion, leg cramps, or changing sleep may occur.', gentle: 'Halfway is a milestone, not a performance target. Your path remains your own.', widgetBaby: 'Around halfway, movement is becoming more coordinated.' },
  { week: 21, baby: 'Swallowing and digestive practice continue, while movements may become stronger.', mother: 'The growing uterus can affect posture, digestion, and comfort.', common: 'Movement, heartburn, backache, leg cramps, or mild swelling may occur.', gentle: 'Small adjustments to food, posture, and rest can support a steadier day.', widgetBaby: 'Swallowing practice and stronger movements continue.' },
  { week: 22, baby: 'Facial features, eyebrows, and fine body hair are becoming more defined as growth continues.', mother: 'Your centre of gravity and skin may continue changing.', common: 'Stretch marks, pelvic pressure, backache, or Braxton Hicks sensations may occur.', gentle: 'Changing skin and shape are part of a body making room in its own way.', widgetBaby: 'Features are becoming more defined.' },
  { week: 23, baby: 'Hearing responses and movement coordination continue to develop.', mother: 'You may recognise more consistent periods of activity and rest, though patterns differ.', common: 'Rib discomfort, indigestion, leg cramps, or sleep disruption may occur.', gentle: 'Make space for comfort where you can; small supports add up.', widgetBaby: 'Hearing responses and movement coordination are growing.' },
  { week: 24, baby: 'The lungs remain immature but continue important structural development.', mother: 'The uterus is expanding and movement may feel more distinct.', common: 'Backache, heartburn, constipation, or mild swelling may occur.', gentle: 'Let today be about steady care rather than doing everything.', widgetBaby: 'The lungs continue important development.' },
  { week: 25, baby: 'Movement, startle responses, and periods of sleep and activity may become more noticeable.', mother: 'Your body is adapting to increasing weight and blood volume.', common: 'Tiredness, pelvic pressure, leg cramps, or restless sleep may occur.', gentle: 'Rest is useful work, especially when sleep feels interrupted.', widgetBaby: 'Sleep, activity, and startle patterns are developing.' },
  { week: 26, baby: 'The eyes may begin opening, while the brain, lungs, and nervous system continue maturing.', mother: 'The growing uterus may increase breathlessness, heartburn, or back discomfort.', common: 'Braxton Hicks sensations, swelling, sleep changes, or movement may occur.', gentle: 'Slow down when your body asks and mention changes that worry you.', widgetBaby: 'Eyes may begin opening as the brain and lungs mature.' },
  { week: 27, baby: 'Brain and nervous-system development continue rapidly near the end of the second trimester.', mother: 'You may feel stronger movement and increasing physical effort in daily activities.', common: 'Backache, leg cramps, heartburn, or fatigue may increase.', gentle: 'You are allowed to adjust expectations as your body’s workload grows.', widgetBaby: 'Brain and nervous-system development continue rapidly.' },
  { week: 28, baby: 'The third trimester begins, with continued brain, lung, and fat development.', mother: 'Movements may have an individual pattern that becomes familiar over time.', common: 'Tiredness, breathlessness, backache, heartburn, or swelling may occur.', gentle: 'Notice your baby’s usual movement pattern and ask your care team about any concern.', widgetBaby: 'The third trimester brings continued brain and lung growth.' },
  { week: 29, baby: 'Muscles, lungs, and fat stores continue developing as growth accelerates.', mother: 'The uterus may place more pressure on the bladder, ribs, and digestive system.', common: 'Frequent urination, indigestion, leg cramps, or sleep disruption may occur.', gentle: 'Comfort can come in small pieces: a stretch, a sip, a pillow, a pause.', widgetBaby: 'Muscle and fat development continue.' },
  { week: 30, baby: 'The brain continues forming complex connections and the eyes can respond to light.', mother: 'Balance, sleep, and stamina may keep changing as the bump grows.', common: 'Breathlessness, tiredness, pelvic pressure, or Braxton Hicks sensations may occur.', gentle: 'Choose steady, supported movement and leave room for recovery.', widgetBaby: 'Brain connections and responses to light are developing.' },
  { week: 31, baby: 'The nervous system continues maturing and the fetus practises coordinated movement.', mother: 'Daily activities may take more energy, with increased pressure and interrupted sleep.', common: 'Backache, heartburn, swelling, or leaking colostrum may occur.', gentle: 'A lower-energy day is not a setback; it is information from your body.', widgetBaby: 'Nervous-system maturation and movement practice continue.' },
  { week: 32, baby: 'Breathing movements are practised while the lungs continue to mature.', mother: 'The uterus may make full breaths, large meals, and comfortable sleep more difficult.', common: 'Breathlessness, indigestion, pelvic pressure, or frequent urination may occur.', gentle: 'Smaller meals and more pauses may fit this stage better than pushing through.', widgetBaby: 'Breathing practice continues while the lungs mature.' },
  { week: 33, baby: 'Bones continue strengthening, while the skull remains flexible for birth.', mother: 'The bump’s size and position may affect movement, sleep, and appetite.', common: 'Pelvic heaviness, backache, swelling, or vivid dreams may occur.', gentle: 'Prepare gradually; you do not need to finish everything in one day.', widgetBaby: 'Bones strengthen while the skull stays flexible.' },
  { week: 34, baby: 'The lungs and nervous system continue maturing, with steady growth and fat gain.', mother: 'You may notice changing pressure if the baby’s position shifts.', common: 'Tiredness, Braxton Hicks sensations, rib discomfort, or pelvic pressure may occur.', gentle: 'Listen to changing comfort needs and ask for practical help.', widgetBaby: 'Lung maturation and steady growth continue.' },
  { week: 35, baby: 'Growth and fat gain continue, and there is less room for broad movements.', mother: 'Movement may feel different in shape but should still follow an individual pattern.', common: 'Frequent urination, sleep difficulty, pressure, or swelling may occur.', gentle: 'Movement can feel different as space changes; contact your care team for a reduction or concern.', widgetBaby: 'Growth continues as space becomes snugger.' },
  { week: 36, baby: 'The baby may move lower into the pelvis, although position and timing vary.', mother: 'Breathing may feel easier if the baby lowers, while pelvic pressure may increase.', common: 'Pelvic heaviness, frequent urination, backache, or irregular tightenings may occur.', gentle: 'Keep essentials simple and close; your care team can guide you on signs of labour.', widgetBaby: 'The baby may be moving lower, though timing varies.' },
  { week: 37, baby: 'This is considered early term; growth and final preparation for birth continue.', mother: 'Your body may show more signs of preparation, but labour timing remains unpredictable.', common: 'Pelvic pressure, discharge changes, irregular contractions, or fatigue may occur.', gentle: 'Readiness is practical, not perfect. Keep your plan flexible and your support close.', widgetBaby: 'Early-term growth and preparation continue.' },
  { week: 38, baby: 'The baby continues gaining fat and practising breathing and swallowing movements.', mother: 'You may feel physically full, tired, restless, or eager for labour to begin.', common: 'Pressure, backache, sleep difficulty, discharge changes, or contractions may occur.', gentle: 'Waiting can be emotionally demanding. Keep today small and supported.', widgetBaby: 'Final growth and breathing practice continue.' },
  { week: 39, baby: 'This is considered full term, with ongoing growth and readiness for birth.', mother: 'Labour may begin or may still be some time away; due dates are estimates.', common: 'Pelvic pressure, contractions, fatigue, or changing discharge may occur.', gentle: 'Your estimated date is not a deadline. Stay connected to your maternity plan.', widgetBaby: 'Full-term growth continues while birth timing varies.' },
  { week: 40, baby: 'Around the estimated due date, the baby continues to move, grow, and prepare for birth.', mother: 'You may be in labour, waiting, or discussing next steps with your maternity team.', common: 'Contractions, pelvic pressure, fatigue, and a wide range of emotions may occur.', gentle: 'Due dates are estimates. Keep following your care team’s plan and ask about anything uncertain.', widgetBaby: 'Around the due date, growth and movement continue.' },
];

const STAGE_GUIDANCE: Record<string, StageGuidance> = {
  earliest: {
    nutritionFocus: ['Choose varied everyday foods when possible, including vegetables, fruit, whole grains, beans or other proteins.', 'Ask your clinician which supplements are appropriate for you; Janani does not prescribe them.'],
    hydration: ['Drink regularly according to thirst and local conditions; needs vary with climate, activity, and health.'],
    movementAndRestGuidance: ['Continue comfortable usual activity unless your clinician has advised limits.', 'Prioritise sleep and rest when fatigue appears.'],
    emotionalWellbeing: ['Uncertainty is common this early; avoid judging your pregnancy by the presence or absence of symptoms.'],
    partnerGuidance: ['Listen without trying to interpret symptoms, help with regular meals and water, and support early-care planning.'],
    thingsToPrepare: ['Record the first day of the last menstrual period if known.', 'List current medicines, supplements, conditions, allergies, and questions for the first visit.'],
    commonUpcomingTestsAndAppointments: ['A home or clinical pregnancy test may confirm pregnancy after a missed period.', 'First prenatal-care timing varies; contact a maternity clinician early to plan care.'],
    suggestedClinicianQuestions: ['When should I schedule my first prenatal visit?', 'Are my current medicines and supplements safe to continue?', 'Which symptoms should prompt urgent care where I live?'],
    widgetWellnessMessage: 'Eat regularly, drink to thirst, and rest when needed.',
  },
  earlySymptoms: {
    nutritionFocus: ['Try small, regular meals if nausea makes larger meals difficult.', 'Include tolerated protein and fibre foods; avoid forcing foods that worsen nausea.'],
    hydration: ['Take frequent small sips if nausea is present and ask for help if you cannot keep fluids down.'],
    movementAndRestGuidance: ['Gentle walking or usual comfortable movement may help wellbeing.', 'Rest before fatigue becomes overwhelming.'],
    emotionalWellbeing: ['Hormones, nausea, and uncertainty can affect mood; share persistent distress with your clinician.'],
    partnerGuidance: ['Reduce smell triggers, offer simple food choices, share household tasks, and take severe or worsening symptoms seriously.'],
    thingsToPrepare: ['Prepare health history, vaccination information, and a current medicine list.', 'Note questions instead of relying on memory during appointments.'],
    commonUpcomingTestsAndAppointments: ['Early visits often include health history, blood pressure, urine and blood tests; exact timing varies.', 'Your clinician may discuss ultrasound and optional screening choices.'],
    suggestedClinicianQuestions: ['What can I safely try for nausea or constipation?', 'Which screening options are available and what do they tell me?', 'How will my due date be confirmed?'],
    widgetWellnessMessage: 'Small meals, steady sips, and extra rest may help today.',
  },
  firstTrimesterClose: {
    nutritionFocus: ['Build balanced meals from tolerated foods and include iron-, protein-, folate-, calcium-, and fibre-containing choices.', 'Discuss food safety and any supplement questions with your clinician.'],
    hydration: ['Keep fluids accessible and increase them gradually if heat or activity raises thirst.'],
    movementAndRestGuidance: ['Use comfortable low-impact movement and stop for pain, dizziness, bleeding, or breathlessness that worries you.', 'Continue making room for sleep even if energy improves.'],
    emotionalWellbeing: ['Mixed feelings about tests and milestones are common; choose trusted people for support.'],
    partnerGuidance: ['Attend visits if invited, help write down questions, and avoid comparing symptoms or bump size with others.'],
    thingsToPrepare: ['Review appointment dates and optional screening decisions.', 'Plan simple meals and practical support for low-energy days.'],
    commonUpcomingTestsAndAppointments: ['First-trimester screening or ultrasound may be offered depending on location, choice, and clinical history.', 'Routine early blood and urine testing may be reviewed.'],
    suggestedClinicianQuestions: ['What did my early test results show?', 'What movement and travel are appropriate for me?', 'What care schedule do you recommend for my pregnancy?'],
    widgetWellnessMessage: 'Choose balanced foods, comfortable movement, and enough rest.',
  },
  earlySecond: {
    nutritionFocus: ['Use regular meals with varied protein, iron-rich foods, vegetables, fruit, whole grains, and calcium sources.', 'Food needs are individual; focus on quality and appetite rather than “eating for two.”'],
    hydration: ['Drink across the day and carry water when active or outdoors.'],
    movementAndRestGuidance: ['Comfortable activity can continue if your maternity team has not advised restrictions.', 'Adjust posture, footwear, and pillows as your balance changes.'],
    emotionalWellbeing: ['A symptom shift can bring relief or new worries; both are valid topics for your care team.'],
    partnerGuidance: ['Share planning, notice fatigue even when energy improves, and ask what support feels useful.'],
    thingsToPrepare: ['Plan upcoming visits and consider practical needs for work, travel, and home support.', 'Keep an evolving question list.'],
    commonUpcomingTestsAndAppointments: ['Second-trimester visits usually continue routine checks tailored to you.', 'An anatomy ultrasound is commonly offered around the middle of pregnancy, with timing varying.'],
    suggestedClinicianQuestions: ['When might I notice movement and what should I expect?', 'When is my anatomy ultrasound likely to happen?', 'Are there changes to activity or work that you recommend for me?'],
    widgetWellnessMessage: 'A balanced plate, water, gentle movement, and rest all count.',
  },
  midPregnancy: {
    nutritionFocus: ['Continue varied iron-, protein-, folate-, calcium-, and fibre-containing foods.', 'Use food-safety guidance and avoid foods your clinician has told you to avoid.'],
    hydration: ['Drink regularly; pale urine can be a useful general hydration cue, but medical needs vary.'],
    movementAndRestGuidance: ['Use supported, comfortable movement and change position when sitting for long periods.', 'Protect time for sleep and recovery.'],
    emotionalWellbeing: ['Movement expectations can create anxiety; ask your clinician how and when they want you to notice patterns.'],
    partnerGuidance: ['Learn about movement together without pressing the abdomen or setting a “normal” count yourselves.', 'Help with meals, posture supports, and appointment notes.'],
    thingsToPrepare: ['Review anatomy-scan questions and begin discussing birth-place and support preferences without locking in a rigid plan.'],
    commonUpcomingTestsAndAppointments: ['An anatomy ultrasound is often offered around 18–22 weeks.', 'Your clinician may review placenta position, growth, and any follow-up needs.'],
    suggestedClinicianQuestions: ['What did the anatomy review show and is follow-up needed?', 'How should I respond if movement later decreases from my baby’s usual pattern?', 'Which discomforts are expected and which should be reviewed?'],
    widgetWellnessMessage: 'Hydrate steadily, support your posture, and notice your need for rest.',
  },
  lateSecond: {
    nutritionFocus: ['Pair iron-rich plant foods with vitamin-C foods when useful, and include protein across meals.', 'Choose fibre foods and fluids to support digestion.'],
    hydration: ['Keep drinking steadily, especially with activity, heat, vomiting, or constipation.'],
    movementAndRestGuidance: ['Adapt activity to balance and comfort; avoid pushing through pain or concerning breathlessness.', 'Use side-lying or other clinician-recommended sleep support if comfortable.'],
    emotionalWellbeing: ['Approaching the third trimester may bring excitement and worry; write down specific concerns for care visits.'],
    partnerGuidance: ['Take on more physical tasks, support sleep routines, and learn the maternity unit’s contact plan.'],
    thingsToPrepare: ['Review leave, transport, support contacts, and upcoming third-trimester visits.'],
    commonUpcomingTestsAndAppointments: ['Glucose screening is commonly offered around 24–28 weeks, with earlier or different testing for some people.', 'Blood count, blood group, or other repeat tests may be offered based on local care.'],
    suggestedClinicianQuestions: ['When and how will glucose screening be done?', 'Do I need repeat blood tests or Rh-related care?', 'What changes in movement or symptoms should prompt a same-day call?'],
    widgetWellnessMessage: 'Steady fluids, fibre, protein, and supported rest can help.',
  },
  earlyThird: {
    nutritionFocus: ['Use smaller balanced meals if fullness or heartburn makes large meals uncomfortable.', 'Continue varied protein, iron, calcium, folate, and fibre sources.'],
    hydration: ['Drink across the day while adjusting timing if nighttime urination disrupts sleep.'],
    movementAndRestGuidance: ['Choose stable, low-impact movement within your clinician’s guidance.', 'Build in recovery time as ordinary tasks take more effort.'],
    emotionalWellbeing: ['Birth and parenting thoughts may intensify; focus on practical questions rather than perfect preparation.'],
    partnerGuidance: ['Learn urgent warning signs, protect rest time, and help prepare transport, documents, and contact numbers.'],
    thingsToPrepare: ['Begin a flexible birth-preference list, transport plan, and hospital or birth-centre essentials.', 'Review who to call day and night.'],
    commonUpcomingTestsAndAppointments: ['Visits often become more frequent, but schedules are tailored to the pregnancy.', 'Your clinician may repeat blood tests, review growth, and discuss vaccines or Rh-related care where relevant.'],
    suggestedClinicianQuestions: ['How should I recognise and report a change in movement?', 'What is the after-hours contact pathway?', 'Which birth-preparation choices are available to me?'],
    widgetWellnessMessage: 'Smaller meals, steady water, safe movement, and recovery time matter.',
  },
  birthPreparation: {
    nutritionFocus: ['Keep meals simple, varied, and regular as appetite and stomach space change.', 'Continue safe protein, iron, calcium, and fibre sources that you tolerate.'],
    hydration: ['Keep water nearby and drink regularly unless your clinician has given a different plan.'],
    movementAndRestGuidance: ['Use gentle movement for comfort only and avoid exhaustion.', 'Rest with supportive pillows and accept help with physical tasks.'],
    emotionalWellbeing: ['It is common to feel both ready and unready; a flexible plan can reduce pressure.'],
    partnerGuidance: ['Confirm transport and contact plans, protect rest, and practise listening to preferences without taking over.'],
    thingsToPrepare: ['Pack essential records, medicines, comfortable items, baby basics, chargers, and emergency contacts.', 'Review feeding support and early-postpartum help.'],
    commonUpcomingTestsAndAppointments: ['Your clinician may review baby position, growth, blood pressure, and birth planning.', 'Group B strep screening is commonly offered late in pregnancy in some care systems.'],
    suggestedClinicianQuestions: ['What signs mean we should call or travel in?', 'What is the plan if labour begins early or the waters break?', 'How will baby position and late-pregnancy tests be reviewed?'],
    widgetWellnessMessage: 'Keep preparation simple, water nearby, and rest protected.',
  },
  term: {
    nutritionFocus: ['Choose familiar, safe foods and regular light meals as comfort allows.', 'Do not start supplements, herbal products, or labour-inducing foods without clinician guidance.'],
    hydration: ['Keep drinking regularly and follow any specific maternity-unit instructions.'],
    movementAndRestGuidance: ['Use comfortable movement and rest without trying to trigger labour yourself.', 'Stop and contact your care team for concerning symptoms or reduced movement.'],
    emotionalWellbeing: ['Waiting beyond an estimated date can be difficult; due dates are estimates, not deadlines.'],
    partnerGuidance: ['Stay reachable, keep logistics ready, listen carefully, and contact the maternity team when the agreed signs occur.'],
    thingsToPrepare: ['Keep transport, contact numbers, documents, medicines, and essential bags ready.', 'Review the plan for pets, children, work, and early home support.'],
    commonUpcomingTestsAndAppointments: ['Late visits may review movement, baby position, blood pressure, wellbeing, and options if pregnancy continues beyond the estimated date.', 'Monitoring or induction discussions are individual clinical decisions.'],
    suggestedClinicianQuestions: ['When exactly should I call about contractions, waters, bleeding, or movement?', 'What monitoring is planned if I pass my estimated date?', 'What are my options, benefits, and risks if induction is discussed?'],
    widgetWellnessMessage: 'Eat simply, drink regularly, rest, and stay close to your care plan.',
  },
};

function stageForWeek(week: number): StageGuidance {
  if (week <= 4) return STAGE_GUIDANCE.earliest;
  if (week <= 8) return STAGE_GUIDANCE.earlySymptoms;
  if (week <= 13) return STAGE_GUIDANCE.firstTrimesterClose;
  if (week <= 17) return STAGE_GUIDANCE.earlySecond;
  if (week <= 22) return STAGE_GUIDANCE.midPregnancy;
  if (week <= 27) return STAGE_GUIDANCE.lateSecond;
  if (week <= 31) return STAGE_GUIDANCE.earlyThird;
  if (week <= 35) return STAGE_GUIDANCE.birthPreparation;
  return STAGE_GUIDANCE.term;
}

function warningSignsForWeek(week: number): string[] {
  const signs = [
    'Seek urgent medical care for heavy bleeding, severe or worsening abdominal pain, trouble breathing, chest pain, fainting, or a seizure.',
    'Seek urgent medical care for a severe or worsening headache, especially with vision changes, or for sudden overwhelming weakness.',
    'Contact your maternity team promptly for fluid leaking from the vagina, fever, or any symptom that feels seriously wrong.',
  ];
  if (week >= 20) {
    signs.push('Contact your maternity team immediately if the baby moves less than the pattern that is usual for your pregnancy; do not wait for the app.');
  }
  return signs;
}

function trimesterForWeek(week: number): PregnancyTrimester {
  return week <= 13 ? 1 : week <= 27 ? 2 : 3;
}

export const PREGNANCY_WEEKS: readonly PregnancyWeekContent[] = WEEK_CORE.map((core) => ({
  gestationalWeek: core.week,
  trimester: trimesterForWeek(core.week),
  babyDevelopment: [core.baby],
  motherChanges: [core.mother],
  commonExperiences: [core.common],
  ...stageForWeek(core.week),
  educationalWarningSigns: warningSignsForWeek(core.week),
  dailyGentleMessage: core.gentle,
  widgetBabyMessage: core.widgetBaby,
}));

function assertCompletePregnancyContent(content: readonly PregnancyWeekContent[]): void {
  if (content.length !== 40) throw new Error(`Expected 40 pregnancy weeks, received ${content.length}.`);
  const expectedArrayFields: (keyof PregnancyWeekContent)[] = [
    'babyDevelopment',
    'motherChanges',
    'commonExperiences',
    'nutritionFocus',
    'hydration',
    'movementAndRestGuidance',
    'emotionalWellbeing',
    'partnerGuidance',
    'thingsToPrepare',
    'commonUpcomingTestsAndAppointments',
    'suggestedClinicianQuestions',
    'educationalWarningSigns',
  ];
  content.forEach((item, index) => {
    const expectedWeek = index + 1;
    if (item.gestationalWeek !== expectedWeek) throw new Error(`Pregnancy week ${expectedWeek} is missing or out of order.`);
    if (item.trimester !== trimesterForWeek(expectedWeek)) throw new Error(`Pregnancy week ${expectedWeek} has an invalid trimester.`);
    expectedArrayFields.forEach((field) => {
      const value = item[field];
      if (!Array.isArray(value) || value.length === 0 || value.some((entry) => typeof entry !== 'string' || !entry.trim())) {
        throw new Error(`Pregnancy week ${expectedWeek} has incomplete ${String(field)} content.`);
      }
    });
    if (!item.dailyGentleMessage.trim() || !item.widgetBabyMessage.trim() || !item.widgetWellnessMessage.trim()) {
      throw new Error(`Pregnancy week ${expectedWeek} has incomplete daily or widget content.`);
    }
  });
}

assertCompletePregnancyContent(PREGNANCY_WEEKS);

export function normalizePregnancyContentWeek(week: number): number {
  if (!Number.isFinite(week)) return 1;
  return Math.min(40, Math.max(1, Math.floor(week)));
}

export function getPregnancyWeekContent(week: number): PregnancyWeekContent {
  return PREGNANCY_WEEKS[normalizePregnancyContentWeek(week) - 1];
}
