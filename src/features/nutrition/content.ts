export type NutritionTopic = {
  id: string;
  title: string;
  summary: string;
  trimester: 'all' | 1 | 2 | 3;
  tags: string[];
  points: string[];
};

export const nutritionTopics: NutritionTopic[] = [
  {
    id: 'balanced-plate',
    title: 'Build a simple balanced plate',
    summary: 'Keep everyday meals varied rather than chasing a perfect pregnancy diet.',
    trimester: 'all',
    tags: ['everyday', 'vegetarian', 'eggetarian', 'non_vegetarian', 'vegan'],
    points: [
      'Include vegetables or fruit, a protein food, and a grain or other staple across your meals.',
      'Choose foods you tolerate and that fit your household, culture, allergies, and clinician advice.',
      'Pregnancy does not require you to double the amount of food you eat.',
    ],
  },
  {
    id: 'food-safety',
    title: 'Food safety matters',
    summary: 'Pregnancy makes careful food handling especially important.',
    trimester: 'all',
    tags: ['safety'],
    points: [
      'Wash produce and keep raw foods separate from ready-to-eat foods.',
      'Cook meat, fish, seafood, and eggs thoroughly and avoid unpasteurised milk products.',
      'Refrigerate perishable food promptly and avoid food that has been stored unsafely.',
    ],
  },
  {
    id: 'hydration',
    title: 'Keep fluids nearby',
    summary: 'Regular fluids can be easier than trying to drink a large amount at once.',
    trimester: 'all',
    tags: ['hydration', 'nausea'],
    points: [
      'Sip water regularly through the day.',
      'If nausea makes drinking difficult, try smaller frequent sips and discuss persistent difficulty with your care team.',
      'Your clinician may give different fluid advice for a medical condition; follow that advice.',
    ],
  },
  {
    id: 'nausea',
    title: 'When nausea makes meals difficult',
    summary: 'Small, simple meals may feel easier during periods of nausea.',
    trimester: 1,
    tags: ['nausea'],
    points: [
      'Try smaller meals or snacks more frequently if that feels easier.',
      'Choose foods and smells you can tolerate rather than forcing a particular food.',
      'Contact your maternity care team if you cannot keep fluids down, feel dehydrated, or symptoms are severe.',
    ],
  },
  {
    id: 'heartburn',
    title: 'Gentler habits for heartburn',
    summary: 'Meal timing and portion size can sometimes make heartburn easier to manage.',
    trimester: 'all',
    tags: ['heartburn'],
    points: [
      'Smaller meals may be more comfortable than very large meals.',
      'Notice which foods worsen your own symptoms rather than following a long universal avoidance list.',
      'Speak with your clinician before starting medicines or remedies for persistent heartburn.',
    ],
  },
  {
    id: 'constipation',
    title: 'Support regular bowel habits',
    summary: 'Food, fluids, and movement can all contribute to bowel regularity.',
    trimester: 'all',
    tags: ['constipation'],
    points: [
      'Include fibre-containing foods such as vegetables, fruit, pulses, and whole grains as tolerated.',
      'Keep up regular fluids unless your clinician has restricted them.',
      'Discuss persistent constipation or any medicine or supplement change with your care team.',
    ],
  },
];
