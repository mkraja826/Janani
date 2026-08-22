import { PregnancyProgress } from '../types';

export function calculatePregnancyProgress(dueDateString: string): PregnancyProgress {
  const dueDate = new Date(dueDateString);
  const today = new Date();
  
  // Set both dates to UTC midnight for consistent day math
  const dueUtc = Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilDue = Math.round((dueUtc - todayUtc) / msPerDay);
  
  // 40 weeks = 280 days
  const daysElapsed = 280 - daysUntilDue;
  const clampedDays = Math.max(0, Math.min(294, daysElapsed)); // up to 42 weeks
  
  const gestationalWeek = Math.floor(clampedDays / 7) + 1;
  const gestationalDay = clampedDays % 7;
  
  let trimester: 1 | 2 | 3 = 1;
  if (gestationalWeek >= 28) {
    trimester = 3;
  } else if (gestationalWeek >= 14) {
    trimester = 2;
  }
  
  const progressPercent = Math.min(100, Math.max(0, Math.round((clampedDays / 280) * 100)));
  
  return {
    gestationalWeek: Math.min(42, Math.max(1, gestationalWeek)),
    gestationalDay,
    trimester,
    daysRemaining: Math.max(0, daysUntilDue),
    isPastDue: daysUntilDue < 0,
    progressPercent,
  };
}

export interface WeekDetail {
  week: number;
  sizeFruit: string;
  lengthCm: string;
  weightG: string;
  babyDevelopment: string;
  maternalChanges: string;
  partnerSupportTip: string;
  keyNutritionTip: string;
}

export const WEEK_DETAILS: Record<number, WeekDetail> = {
  4: {
    week: 4,
    sizeFruit: 'Poppy Seed',
    lengthCm: '0.1 cm',
    weightG: '< 1 g',
    babyDevelopment: 'The blastocyst implants into the uterine lining. The neural tube, which will become the brain and spinal cord, begins developing.',
    maternalChanges: 'You might feel light cramping, fatigue, or tender breasts. Many mothers experience subtle hormonal shifts.',
    partnerSupportTip: 'Be supportive and reassuring. Rest is essential during early organogenesis.',
    keyNutritionTip: 'Ensure 400–600 mcg of daily folic acid to support neural tube development.',
  },
  8: {
    week: 8,
    sizeFruit: 'Raspberry',
    lengthCm: '1.6 cm',
    weightG: '1 g',
    babyDevelopment: 'Tiny webbed fingers and toes are forming. Facial features including eyelids and the tip of the nose are emerging.',
    maternalChanges: 'Morning sickness and heightened sense of smell can peak. Frequent urination is common as the uterus grows.',
    partnerSupportTip: 'Help with grocery runs and meal prep to avoid triggering scents that cause nausea.',
    keyNutritionTip: 'Small, frequent protein-rich snacks (nuts, crackers) help ease morning queasiness.',
  },
  12: {
    week: 12,
    sizeFruit: 'Plum',
    lengthCm: '5.4 cm',
    weightG: '14 g',
    babyDevelopment: 'All vital organs, reflexes, fingernails, and vocal cords are in place. The baby can now open and close tiny fists.',
    maternalChanges: 'Energy levels often start returning as the placenta takes over hormone production. Risk of miscarriage drops significantly.',
    partnerSupportTip: 'Celebrate reaching the milestone of completing the first trimester together.',
    keyNutritionTip: 'Focus on calcium-rich foods (yogurt, fortified plant milk, sesame) for bone formation.',
  },
  16: {
    week: 16,
    sizeFruit: 'Avocado',
    lengthCm: '11.6 cm',
    weightG: '100 g',
    babyDevelopment: 'The baby can hear gentle muffled sounds and is practicing swallowing amniotic fluid. Facial muscles can squint and frown.',
    maternalChanges: 'Second trimester "pregnancy glow" is here. You may start feeling faint fluttery movements called "quickening".',
    partnerSupportTip: 'Start talking or reading softly to the bump; baby can detect familiar voice cadences.',
    keyNutritionTip: 'Iron and vitamin C combinations (spinach with lemon juice, lentils) prevent gestational anemia.',
  },
  20: {
    week: 20,
    sizeFruit: 'Banana',
    lengthCm: '25.6 cm',
    weightG: '300 g',
    babyDevelopment: 'Halfway mark! The baby is covered in vernix caseosa (protective coating) and lanugo. Movement is strong and coordinated.',
    maternalChanges: 'The top of the uterus reaches navel level. Mild lower back tension and leg cramps may occur.',
    partnerSupportTip: 'Offer a gentle lower back or foot massage to relieve postural strain.',
    keyNutritionTip: 'Maintain optimal hydration with 2.5 to 3 liters of fluids daily to support amniotic fluid volume.',
  },
  24: {
    week: 24,
    sizeFruit: 'Ear of Corn',
    lengthCm: '30 cm',
    weightG: '600 g',
    babyDevelopment: 'Lungs are producing surfactant to prepare for breathing. Baby has distinct sleep and wake cycles and responds to touches.',
    maternalChanges: 'Skin on the belly stretches. Braxton Hicks contractions (gentle practice tightenings) might be noticed.',
    partnerSupportTip: 'Place your hand on the belly during active movements to share the joy of baby kicks.',
    keyNutritionTip: 'Include Omega-3 DHA (chia seeds, walnuts, safe cooked fish) for fetal brain and vision growth.',
  },
  28: {
    week: 28,
    sizeFruit: 'Eggplant',
    lengthCm: '37.6 cm',
    weightG: '1,000 g',
    babyDevelopment: 'Welcome to the 3rd trimester! Baby can blink, open eyes, and dream during REM sleep.',
    maternalChanges: 'Heartburn, mild shortness of breath, and sleeping challenges are common as the baby takes up more room.',
    partnerSupportTip: 'Help adjust pregnancy pillows and support comfortable left-side sleeping positions.',
    keyNutritionTip: 'Eat smaller, lighter meals in the evening to minimize night-time reflux and heartburn.',
  },
  32: {
    week: 32,
    sizeFruit: 'Squash',
    lengthCm: '42.4 cm',
    weightG: '1,700 g',
    babyDevelopment: 'Baby is practicing breathing motions constantly. Bones are hardening, though the skull remains soft and flexible for birth.',
    maternalChanges: 'Colostrum may leak from breasts. Nesting instincts and organizing nursery supplies often increase.',
    partnerSupportTip: 'Take the lead on heavy nursery preparations, car seat installation, and birth plan discussions.',
    keyNutritionTip: 'Adequate dietary fiber (whole grains, oats, berries) prevents late-pregnancy constipation.',
  },
  36: {
    week: 36,
    sizeFruit: 'Papaya',
    lengthCm: '47.4 cm',
    weightG: '2,600 g',
    babyDevelopment: 'Baby is considered early full-term soon. Most babies are in the head-down (vertex) position preparing for birth.',
    maternalChanges: 'Lightening occurs as the baby drops lower into the pelvis, easing breathing but increasing pelvic pressure.',
    partnerSupportTip: 'Pack the hospital/birth center bag together and map out the drive and emergency contact numbers.',
    keyNutritionTip: 'Keep energy-dense wholesome snacks ready for early labor endurance.',
  },
  40: {
    week: 40,
    sizeFruit: 'Watermelon',
    lengthCm: '51.2 cm',
    weightG: '3,400 g',
    babyDevelopment: 'Your baby is fully grown and ready to meet you! Soft skin, robust reflexes, and strong grasping power.',
    maternalChanges: 'Cervical softening and effacement. Look out for true labor contractions: regular, rhythmic, and strengthening.',
    partnerSupportTip: 'Stay calm, provide steady emotional reassurance, and time contractions patiently.',
    keyNutritionTip: 'Stay lightly nourished and well-hydrated with clear broths and electrolyte water.',
  },
};

export function getWeekDetail(week: number): WeekDetail {
  const availableWeeks = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40];
  // find closest week
  let closest = 20;
  let minDiff = 999;
  for (const w of availableWeeks) {
    const diff = Math.abs(w - week);
    if (diff < minDiff) {
      minDiff = diff;
      closest = w;
    }
  }
  const base = WEEK_DETAILS[closest];
  return {
    ...base,
    week,
  };
}
