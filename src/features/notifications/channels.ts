import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { brandizeUiCopy } from '@/i18n/globalUi';
import { normalizeLocaleCode } from '@/i18n/localeRegistry';
import { readGlobalUiLocale } from '@/i18n/uiLocale';

export const CARE_REMINDER_CHANNEL_ID = 'janani-care-reminders';
export const MEDICATION_ALARM_CHANNEL_ID = 'janani-medication-alarms';
export const PARTNER_MESSAGE_CHANNEL_ID = 'janani-partner-messages';

type ChannelCopy = { careName:string; careDescription:string; medicineName:string; medicineDescription:string; partnerName:string; partnerDescription:string };
const en:ChannelCopy={careName:'Janani care reminders',careDescription:'Gentle hydration, nutrition, appointment and custom care reminders.',medicineName:'Medicine alarms',medicineDescription:'High-priority medicine reminders from Janani.',partnerName:'Thinking of You',partnerDescription:'Soft private notes and little moments of warmth from your partner.'};
const channelCopy:Record<string,Partial<ChannelCopy>>={
  en,
  te:{careName:'జనని సంరక్షణ రిమైండర్లు',careDescription:'నీరు, ఆహారం, అపాయింట్‌మెంట్ మరియు ఇతర సంరక్షణ గుర్తింపులు.',medicineName:'మందుల అలారాలు',medicineDescription:'జనని నుంచి అధిక ప్రాధాన్యత గల మందుల రిమైండర్లు.',partnerName:'నిన్ను గుర్తు చేసుకుంటున్నాను',partnerDescription:'మీ భాగస్వామి నుంచి వ్యక్తిగతమైన చిన్న ప్రేమ సందేశాలు.'},
  hi:{careName:'जननी केयर रिमाइंडर',careDescription:'पानी, पोषण, अपॉइंटमेंट और अन्य देखभाल के हल्के रिमाइंडर।',medicineName:'दवा अलार्म',medicineDescription:'जननी से उच्च-प्राथमिकता वाले दवा रिमाइंडर।',partnerName:'आपकी याद',partnerDescription:'आपके साथी की ओर से निजी और हल्के अपनापन भरे संदेश।'},
  es:{careName:'Recordatorios de cuidado Janani',careDescription:'Recordatorios suaves de hidratación, nutrición, citas y cuidados.',medicineName:'Alarmas de medicación',medicineDescription:'Recordatorios de medicación de alta prioridad de Janani.',partnerName:'Pensando en ti',partnerDescription:'Mensajes privados y pequeños gestos de cariño de tu pareja.'},
  pt:{careName:'Lembretes de cuidado Janani',careDescription:'Lembretes gentis de hidratação, nutrição, consultas e cuidados.',medicineName:'Alarmes de medicação',medicineDescription:'Lembretes de medicação de alta prioridade do Janani.',partnerName:'Pensando em você',partnerDescription:'Mensagens privadas e pequenos gestos de carinho do seu parceiro.'},
  fr:{careName:'Rappels de soins Janani',careDescription:'Rappels doux pour l’hydratation, la nutrition, les rendez-vous et les soins.',medicineName:'Alarmes de médicaments',medicineDescription:'Rappels de médicaments prioritaires de Janani.',partnerName:'Je pense à toi',partnerDescription:'Petits messages privés et attentions de votre partenaire.'},
  de:{careName:'Janani Pflege-Erinnerungen',careDescription:'Sanfte Erinnerungen für Trinken, Ernährung, Termine und Pflege.',medicineName:'Medikamentenalarme',medicineDescription:'Hochpriorisierte Medikamentenerinnerungen von Janani.',partnerName:'Ich denke an dich',partnerDescription:'Private kleine Nachrichten und liebevolle Gesten deines Partners.'},
  ar:{careName:'تذكيرات رعاية جاناني',careDescription:'تذكيرات لطيفة بالترطيب والتغذية والمواعيد والرعاية.',medicineName:'تنبيهات الدواء',medicineDescription:'تذكيرات دواء ذات أولوية عالية من جاناني.',partnerName:'أفكر بك',partnerDescription:'رسائل خاصة ولمسات محبة صغيرة من شريكك.'},
  id:{careName:'Pengingat perawatan Janani',careDescription:'Pengingat lembut untuk hidrasi, nutrisi, janji temu, dan perawatan.',medicineName:'Alarm obat',medicineDescription:'Pengingat obat prioritas tinggi dari Janani.',partnerName:'Memikirkanmu',partnerDescription:'Pesan pribadi dan perhatian kecil dari pasangan Anda.'},
  vi:{careName:'Nhắc nhở chăm sóc Janani',careDescription:'Nhắc nhẹ về uống nước, dinh dưỡng, lịch hẹn và chăm sóc.',medicineName:'Báo giờ thuốc',medicineDescription:'Nhắc thuốc ưu tiên cao từ Janani.',partnerName:'Đang nghĩ về bạn',partnerDescription:'Tin nhắn riêng tư và những cử chỉ quan tâm từ bạn đời.'},
  th:{careName:'การแจ้งเตือนการดูแล Janani',careDescription:'การเตือนอย่างอ่อนโยนเรื่องน้ำ อาหาร นัดหมาย และการดูแล',medicineName:'การเตือนยา',medicineDescription:'การแจ้งเตือนยาที่มีความสำคัญสูงจาก Janani',partnerName:'คิดถึงคุณ',partnerDescription:'ข้อความส่วนตัวและความใส่ใจเล็กๆ จากคู่ชีวิตของคุณ'},
  'zh-CN':{careName:'Janani 护理提醒',careDescription:'温和提醒饮水、营养、预约和日常护理。',medicineName:'用药提醒',medicineDescription:'来自 Janani 的高优先级用药提醒。',partnerName:'想念你',partnerDescription:'来自伴侣的私密留言和温暖小心意。'},
  'zh-TW':{careName:'Janani 照護提醒',careDescription:'溫和提醒飲水、營養、預約與日常照護。',medicineName:'用藥提醒',medicineDescription:'來自 Janani 的高優先級用藥提醒。',partnerName:'想念你',partnerDescription:'來自伴侶的私密留言與溫暖小心意。'},
  ja:{careName:'Janani ケア通知',careDescription:'水分、食事、予約、日々のケアをやさしくお知らせします。',medicineName:'お薬アラーム',medicineDescription:'Janani からの優先度の高い服薬リマインダーです。',partnerName:'あなたを想っています',partnerDescription:'パートナーからのプライベートなメッセージや小さな気づかいです。'},
  ko:{careName:'Janani 케어 알림',careDescription:'수분, 영양, 예약 및 일상 케어를 부드럽게 알려드립니다.',medicineName:'복약 알람',medicineDescription:'Janani의 우선순위가 높은 복약 알림입니다.',partnerName:'당신을 생각해요',partnerDescription:'파트너가 보내는 비공개 메시지와 작은 배려입니다.'},
  ru:{careName:'Напоминания Janani',careDescription:'Мягкие напоминания о воде, питании, визитах и повседневном уходе.',medicineName:'Напоминания о лекарствах',medicineDescription:'Приоритетные напоминания о лекарствах от Janani.',partnerName:'Думаю о тебе',partnerDescription:'Личные сообщения и небольшие знаки заботы от партнёра.'},
};

function resolveChannelCopy(localeCode:string):ChannelCopy{
  const normalized=normalizeLocaleCode(localeCode); const base=normalized.split('-')[0].toLowerCase(); const selected=channelCopy[normalized]??channelCopy[base]??{}; const merged={...en,...selected}; return Object.fromEntries(Object.entries(merged).map(([key,value])=>[key,brandizeUiCopy(value)])) as ChannelCopy;
}

export async function prepareJananiNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const copy = resolveChannelCopy(await readGlobalUiLocale());
  await Promise.all([
    Notifications.setNotificationChannelAsync(CARE_REMINDER_CHANNEL_ID,{name:copy.careName,description:copy.careDescription,importance:Notifications.AndroidImportance.HIGH,vibrationPattern:[0,180,120,180],lockscreenVisibility:Notifications.AndroidNotificationVisibility.PRIVATE,sound:'default'}),
    Notifications.setNotificationChannelAsync(MEDICATION_ALARM_CHANNEL_ID,{name:copy.medicineName,description:copy.medicineDescription,importance:Notifications.AndroidImportance.MAX,vibrationPattern:[0,700,250,700,250,900],lockscreenVisibility:Notifications.AndroidNotificationVisibility.PRIVATE,sound:'default',bypassDnd:false}),
    Notifications.setNotificationChannelAsync(PARTNER_MESSAGE_CHANNEL_ID,{name:copy.partnerName,description:copy.partnerDescription,importance:Notifications.AndroidImportance.DEFAULT,vibrationPattern:[0,120,90,160],lockscreenVisibility:Notifications.AndroidNotificationVisibility.PRIVATE,sound:'default'}),
  ]);
}
