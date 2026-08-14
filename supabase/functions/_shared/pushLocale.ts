type PushCopy = { title: string; body: string };

const COPY: Record<string, PushCopy> = {
  en: { title: 'Someone is thinking of you', body: 'Open Janani to view a private partner note.' },
  te: { title: 'ఎవరో మిమ్మల్ని గుర్తు చేసుకుంటున్నారు', body: 'మీ భాగస్వామి వ్యక్తిగత సందేశాన్ని చూడటానికి జనని తెరవండి.' },
  hi: { title: 'कोई आपको याद कर रहा है', body: 'अपने साथी का निजी संदेश देखने के लिए जननी खोलें।' },
  ta: { title: 'யாரோ உங்களை நினைக்கிறார்கள்', body: 'உங்கள் துணையின் தனிப்பட்ட குறிப்பைப் பார்க்க ஜனனியைத் திறக்கவும்.' },
  kn: { title: 'ಯಾರೋ ನಿಮ್ಮನ್ನು ನೆನಸುತ್ತಿದ್ದಾರೆ', body: 'ನಿಮ್ಮ ಸಂಗಾತಿಯ ಖಾಸಗಿ ಸಂದೇಶವನ್ನು ನೋಡಲು ಜನನಿಯನ್ನು ತೆರೆಯಿರಿ.' },
  ml: { title: 'ആരോ നിങ്ങളെ ഓർക്കുന്നു', body: 'നിങ്ങളുടെ പങ്കാളിയുടെ സ്വകാര്യ സന്ദേശം കാണാൻ ജനനി തുറക്കുക.' },
  mr: { title: 'कोणीतरी तुमची आठवण काढत आहे', body: 'तुमच्या जोडीदाराचा खाजगी संदेश पाहण्यासाठी जननी उघडा.' },
  bn: { title: 'কেউ আপনাকে মনে করছে', body: 'আপনার সঙ্গীর ব্যক্তিগত বার্তা দেখতে জননী খুলুন।' },
  gu: { title: 'કોઈ તમને યાદ કરી રહ્યું છે', body: 'તમારા સાથીનો ખાનગી સંદેશ જોવા જનની ખોલો.' },
  pa: { title: 'ਕੋਈ ਤੁਹਾਨੂੰ ਯਾਦ ਕਰ ਰਿਹਾ ਹੈ', body: 'ਆਪਣੇ ਸਾਥੀ ਦਾ ਨਿੱਜੀ ਸੁਨੇਹਾ ਵੇਖਣ ਲਈ ਜਨਨੀ ਖੋਲ੍ਹੋ।' },
  ur: { title: 'کوئی آپ کو یاد کر رہا ہے', body: 'اپنے ساتھی کا نجی پیغام دیکھنے کے لیے جانانی کھولیں۔' },
  ne: { title: 'कसैले तपाईंलाई सम्झिरहेको छ', body: 'आफ्नो साथीको निजी सन्देश हेर्न जननी खोल्नुहोस्।' },
  es: { title: 'Alguien está pensando en ti', body: 'Abre Janani para ver una nota privada de tu pareja.' },
  pt: { title: 'Alguém está pensando em você', body: 'Abra o Janani para ver uma mensagem privada do seu parceiro.' },
  fr: { title: 'Quelqu’un pense à vous', body: 'Ouvrez Janani pour voir un message privé de votre partenaire.' },
  de: { title: 'Jemand denkt an dich', body: 'Öffne Janani, um eine private Nachricht deines Partners zu sehen.' },
  ar: { title: 'هناك من يفكر بك', body: 'افتحي جاناني لعرض رسالة خاصة من شريكك.' },
  id: { title: 'Seseorang sedang memikirkanmu', body: 'Buka Janani untuk melihat pesan pribadi dari pasanganmu.' },
  vi: { title: 'Có người đang nghĩ đến bạn', body: 'Mở Janani để xem lời nhắn riêng từ người bạn đời của bạn.' },
  th: { title: 'มีใครบางคนกำลังคิดถึงคุณ', body: 'เปิด Janani เพื่อดูข้อความส่วนตัวจากคู่ของคุณ' },
  zh: { title: '有人正在想你', body: '打开 Janani 查看伴侣发来的私人消息。' },
  ja: { title: 'あなたのことを想っている人がいます', body: 'Jananiを開いて、パートナーからの非公開メッセージを確認してください。' },
  ko: { title: '누군가 당신을 생각하고 있어요', body: 'Janani를 열어 파트너의 비공개 메시지를 확인하세요.' },
  ru: { title: 'Кто-то думает о вас', body: 'Откройте Janani, чтобы увидеть личное сообщение от партнёра.' },
};

export function partnerPushCopy(localeCode: string | null | undefined): PushCopy {
  const normalized = (localeCode ?? 'en').trim().toLowerCase();
  if (COPY[normalized]) return COPY[normalized];
  const base = normalized.split('-')[0];
  return COPY[base] ?? COPY.en;
}
