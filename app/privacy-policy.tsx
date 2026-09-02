import { LegalDocumentScreen, type LegalSection } from '@/components/LegalDocumentScreen';

const sections: LegalSection[] = [
  { title:'1. Information Janani processes', paragraphs:[
    'Depending on the features you use, Janani may process account identifiers and email address; profile, family membership, and mother-or-partner role information; pregnancy dates and optional body measurements; reminder content, schedules, and completion history; journal entries, moods, and sharing choices; partner messages and acknowledgements; and device push tokens and technical information needed to deliver notifications and protect the service.',
    'Janani does not require a medical diagnosis. Avoid placing unnecessary sensitive information in free-text reminders, journals, messages, screenshots, or support requests.'
  ]},
  { title:'2. How information is used', paragraphs:[
    'Janani uses this information to authenticate accounts, create and protect a family space, calculate pregnancy progress, provide reminders, synchronize selected family information, deliver partner notifications, preserve journal entries, support offline synchronization, operate the home-screen widget, prevent duplicate writes, and maintain service reliability and security.'
  ]},
  { title:'3. Family sharing and journal choices', paragraphs:[
    'A partner can join a family only through an invitation flow. Linked family members can see shared reminders and partner messages. Journal entries are private unless their author chooses to share them with the linked partner.',
    'Sensitive mother-only pregnancy details such as last menstrual period, height, and pre-pregnancy weight, together with the active family invite code, are not exposed to a linked partner through the application API. The due date and shared care state support the linked family experience.'
  ]},
  { title:'4. Service providers', paragraphs:[
    'Janani uses Supabase for authentication, database storage, realtime synchronization, and server functions; Expo services for device-token registration and push-notification delivery; and GitHub for the public legal site and public support issue tracker.',
    'Those providers may process technical logs under their own terms and privacy practices. Janani does not sell personal information.'
  ]},
  { title:'5. Device permissions and local storage', paragraphs:[
    'Notification permission is used for care and partner alerts. Android reboot and widget functionality may restore reminders and display selected care information. Janani keeps encrypted, per-user on-device caches and pending synchronization state, plus the minimum local notification and widget state needed for those features.',
    'Device settings can limit permissions. Clearing Janani app data or uninstalling the app removes app-controlled local storage from that device.'
  ]},
  { title:'6. Security', paragraphs:[
    'Janani uses authenticated access controls, database Row Level Security, restricted column grants, protected server functions, private family-scoped realtime invalidation, replay-resistant writes, restricted access to device tokens, and encrypted network connections supported by the app and its providers.',
    'No application or storage system can guarantee absolute security. Protect your device, password, and family invite codes.'
  ]},
  { title:'7. Retention, export, and deletion', paragraphs:[
    'Application data is retained while needed to provide the account and family space. Signed-in users can export a JSON copy in Settings and permanently delete their account from the app.',
    'Deleting a mother account removes its associated family pregnancy space and dependent shared records. Deleting a partner account removes that partner and dependent authored records while preserving the mother family pregnancy space. Unlinking or leaving a family does not itself delete the user Auth account.',
    'Infrastructure providers may retain limited backups or security logs for periods governed by operational or legal requirements.'
  ]},
  { title:'8. User choices', paragraphs:[
    'You can change notification permission in device settings, choose whether individual journal entries are shared, export your data, leave or disconnect a family relationship where available, and permanently delete your account.'
  ]},
  { title:'9. Children', paragraphs:[
    'Janani is intended for adults managing a pregnancy journey and is not directed to children.'
  ]},
  { title:'10. Medical and emergency information', paragraphs:[
    'Janani does not monitor symptoms or contact emergency services. Severe pain, heavy bleeding, breathing difficulty, fainting, seizures, reduced consciousness, or any urgent concern requires immediate contact with local emergency services or a qualified maternity-care professional.'
  ]},
  { title:'11. Changes to this policy', paragraphs:[
    'This policy may change as Janani changes. The effective date will be updated when a revised policy is published.'
  ]},
  { title:'12. Contact and privacy requests', paragraphs:[
    'Janani currently directs public, non-sensitive support requests through its published support page. Never post passwords, invite codes, pregnancy or health information, journal content, medication details, access tokens, device tokens, or screenshots containing personal data in a public support issue.'
  ]},
];

export default function PrivacyPolicyScreen() {
  return <LegalDocumentScreen eyebrow="LEGAL" title="Privacy Policy" effectiveDate="August 3, 2026" notice="Janani is a pregnancy-support application. It is not a medical device and does not provide diagnosis, treatment, monitoring, or emergency services." sections={sections} footer="This in-app copy mirrors Janani's maintained published privacy policy. The published legal-site copy remains the source of record for release review." />;
}
