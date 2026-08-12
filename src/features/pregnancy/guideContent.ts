export type TrimesterGuide = {
  trimester: 1 | 2 | 3;
  title: string;
  weeks: string;
  icon: 'leaf-outline' | 'sunny-outline' | 'heart-outline';
  points: string[];
};

export const TRIMESTER_GUIDES: TrimesterGuide[] = [
  {
    trimester: 1,
    title: 'First trimester',
    weeks: 'Weeks 1–13',
    icon: 'leaf-outline',
    points: [
      'Rest when fatigue is strong.',
      'Small regular meals may help with nausea.',
      'Take medicines and supplements only as advised by your clinician.',
      'Keep your first antenatal visits and recommended tests.',
    ],
  },
  {
    trimester: 2,
    title: 'Second trimester',
    weeks: 'Weeks 14–27',
    icon: 'sunny-outline',
    points: [
      'Continue balanced meals and hydration.',
      'Stay active only within the limits your maternity team recommends.',
      'Keep track of appointments and questions for your doctor.',
      'Notice how your body and baby movement patterns change over time.',
    ],
  },
  {
    trimester: 3,
    title: 'Third trimester',
    weeks: 'Weeks 28–40+',
    icon: 'heart-outline',
    points: [
      'Keep regular antenatal reviews.',
      'Prepare medicines, records, transport and hospital essentials.',
      'Ask your clinician what changes in baby movement should prompt review.',
      'Seek urgent care for severe or worrying symptoms rather than waiting for the app.',
    ],
  },
];

export function guideForTrimester(trimester: 1 | 2 | 3): TrimesterGuide {
  return TRIMESTER_GUIDES[trimester - 1];
}

export function journeyWeekLine(week: number, day: number): string {
  if (week <= 0) return 'Your pregnancy journey is just beginning.';
  if (day === 0) return `Week ${week} begins today.`;
  return `Week ${week}, day ${day}.`;
}
