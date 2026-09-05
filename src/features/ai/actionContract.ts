export type PregaLoveActionKind =
  | 'create_medication_reminder'
  | 'create_appointment'
  | 'add_journal_entry'
  | 'update_food_preference'
  | 'prepare_doctor_questions'
  | 'show_today_plan'
  | 'answer_question';

export type PregaLoveActionProposal = {
  kind: PregaLoveActionKind;
  summary: string;
  payload: Record<string, unknown>;
  requiresConfirmation: boolean;
  safetyClass: 'routine' | 'health-sensitive' | 'urgent';
};

export function canExecuteWithoutConfirmation(action: PregaLoveActionProposal): boolean {
  return action.safetyClass === 'routine' && action.requiresConfirmation === false && action.kind === 'show_today_plan';
}

export function requiresClinicalEscalation(action: PregaLoveActionProposal): boolean {
  return action.safetyClass === 'urgent';
}
