export type PregaLoveRole = 'mother' | 'partner';

export const partnerNavigation = {
  home: 'Home',
  care: 'Care',
  journey: 'Journey',
  us: 'Us',
} as const;

export const partnerCarePrinciples = [
  'Ask how she feels instead of assuming what she needs.',
  'Help with meals, hydration, rest and household tasks when she wants support.',
  'Prepare for appointments together and keep transport and practical plans simple.',
  'If something feels urgent or unusual, encourage her to contact her maternity care team.',
] as const;
