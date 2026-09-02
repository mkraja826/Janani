import { LegalDocumentScreen, type LegalSection } from '@/components/LegalDocumentScreen';

const sections: LegalSection[] = [
  { title:'1. Acceptance', paragraphs:['By using Janani, you agree to these terms and the Privacy Policy. Do not use the service if you do not agree.'] },
  { title:'2. Intended use', paragraphs:['Janani supports pregnancy journaling, care reminders, pregnancy-date calculations, and voluntary family connection. Its information is general and educational.'] },
  { title:'3. Medicines and care instructions', paragraphs:['You are responsible for entering accurate reminder information. Medicine name, dose, timing, and duration must follow instructions from a qualified clinician. A notification is not proof that medicine was taken or that a schedule is medically appropriate. Use an independent method for critical medical schedules.'] },
  { title:'4. Emergencies', paragraphs:['Do not rely on Janani during an emergency. For severe pain, heavy bleeding, breathing difficulty, fainting, seizures, reduced consciousness, or any urgent concern, contact local emergency services or a qualified maternity-care professional immediately.'] },
  { title:'5. Accounts and family access', paragraphs:['Keep account credentials and invite codes private. Link only with people you trust. Mothers may disconnect a linked partner, and partners may leave a family where those controls are available. Account deletion is permanent and has different effects for mother and partner accounts, as described in Janani account-deletion guidance.'] },
  { title:'6. User content and conduct', paragraphs:['You remain responsible for journal entries, reminder content, and partner messages you create. Do not submit unlawful, abusive, rights-infringing, or malicious content. Do not add another person’s sensitive information without their permission.'] },
  { title:'7. Availability', paragraphs:['Notifications, realtime updates, offline synchronization, exports, and widgets may be delayed or unavailable because of device settings, connectivity, operating-system restrictions, maintenance, or provider outages. The service may change or be discontinued.'] },
  { title:'8. No warranty', paragraphs:['To the maximum extent permitted by applicable law, Janani is provided without warranties of uninterrupted operation, medical accuracy, data preservation, or fitness for emergency or clinical use. Nothing in these terms excludes rights that cannot lawfully be excluded.'] },
  { title:'9. Changes', paragraphs:['These terms may be updated as the service changes. The effective date will be revised when updated terms are published.'] },
  { title:'10. Support', paragraphs:['Support is currently provided through Janani’s published support page and public issue tracker. Do not post personal, account, pregnancy, health, journal, medication, or security-sensitive information in a public issue.'] },
];

export default function TermsOfServiceScreen() {
  return <LegalDocumentScreen eyebrow="LEGAL" title="Terms of Service" effectiveDate="August 3, 2026" notice="Janani is not a medical device. It does not diagnose, prescribe, monitor a medical condition, or replace a doctor, hospital, emergency service, or individualized medical advice." sections={sections} footer="This in-app copy mirrors Janani's published Terms of Use and Medical Disclaimer for this release." />;
}
