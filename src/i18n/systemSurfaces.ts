import { type JananiLanguage, readUiLanguage } from '@/i18n';

type SystemCopy = {
  medicineNotificationTitle: string;
  medicineNotificationBody: string;
  careNotificationTitle: string;
  careNotificationBody: string;
  week: string;
  days: string;
  familyFallback: string;
  upcomingReminders: string;
  noMedicine: string;
  noAppointment: string;
  partnerWaiting: string;
  sendWarmth: string;
  babyMessages: string[];
  wellnessMessages: string[];
  dailyJourney: (week: number) => string;
  openJourney: string;
  widgetTodayTitle: string;
  widgetMedicineTitle: string;
  widgetLoveTitle: string;
  widgetAppointmentTitle: string;
  widgetWellnessTitle: string;
  widgetCareFallback: string;
  widgetMedicineFallback: string;
  widgetAppointmentFallback: string;
  widgetBabyFallback: string;
  widgetWellnessFallback: string;
  signedOutFamily: string;
  privateCare: string;
  openMedicines: string;
  openAppointments: string;
  openJanani: string;
  privatePregnancy: string;
  openWellness: string;
};

const copy: Record<JananiLanguage, SystemCopy> = {
  en: {
    medicineNotificationTitle: '💊 Medicine time',
    medicineNotificationBody: 'It’s time for your scheduled medicine. Open Janani to view the private reminder.',
    careNotificationTitle: 'A gentle Janani reminder',
    careNotificationBody: 'Open Janani to view today’s private care reminder.',
    week: 'Week', days: 'days', familyFallback: 'Our little family', upcomingReminders: 'Open Janani for upcoming reminders', noMedicine: 'No medicine due soon', noAppointment: 'No appointment scheduled', partnerWaiting: 'A little heart from your partner is waiting 💗', sendWarmth: 'Send a little warmth 💗',
    babyMessages: ['Your little journey is growing day by day.', 'Tiny changes are happening every day.', 'Another week of growing together.'],
    wellnessMessages: ['Hydrate gently, eat regularly, and make room for rest.', 'A balanced plate and a little movement can support your day.', 'Small meals, enough fluids, and good rest are meaningful care.'],
    dailyJourney: (week) => `You are ${week} weeks into this journey. Be gentle with yourself today.`, openJourney: 'Open Janani for your pregnancy journey.',
    widgetTodayTitle: 'Janani Today', widgetMedicineTitle: 'Next medicine', widgetLoveTitle: 'Thinking of you', widgetAppointmentTitle: 'Next appointment', widgetWellnessTitle: 'Daily wellness 🌿', widgetCareFallback: "Open Janani for today's care", widgetMedicineFallback: 'No medicine due soon', widgetAppointmentFallback: 'No appointment scheduled', widgetBabyFallback: "Open Janani for this week's journey", widgetWellnessFallback: 'Eat gently, hydrate, and rest when your body asks.',
    signedOutFamily: 'Sign in or link a family', privateCare: 'Your care details are private', openMedicines: 'Open Janani to view medicines', openAppointments: 'Open Janani to view appointments', openJanani: 'Open Janani', privatePregnancy: 'Your pregnancy journey stays private', openWellness: 'Open Janani for daily wellness',
  },
  te: {
    medicineNotificationTitle: '💊 మందు సమయం', medicineNotificationBody: 'మీరు షెడ్యూల్ చేసిన మందు సమయం వచ్చింది. వ్యక్తిగత రిమైండర్ చూడటానికి జనని తెరవండి.', careNotificationTitle: 'జనని నుంచి మృదువైన గుర్తు', careNotificationBody: 'ఈ రోజు మీ వ్యక్తిగత సంరక్షణ రిమైండర్ చూడటానికి జనని తెరవండి.',
    week: 'వారం', days: 'రోజులు', familyFallback: 'మన చిన్న కుటుంబం', upcomingReminders: 'రాబోయే రిమైండర్ల కోసం జనని తెరవండి', noMedicine: 'త్వరలో తీసుకోవాల్సిన మందు లేదు', noAppointment: 'అపాయింట్‌మెంట్ షెడ్యూల్ కాలేదు', partnerWaiting: 'మీ భాగస్వామి నుంచి చిన్న హృదయం ఎదురుచూస్తోంది 💗', sendWarmth: 'కొంచెం ప్రేమను పంపండి 💗',
    babyMessages: ['మీ చిన్న ప్రయాణం ప్రతి రోజూ ముందుకు సాగుతోంది.', 'ప్రతి రోజూ చిన్న చిన్న మార్పులు జరుగుతున్నాయి.', 'కలిసి ఎదుగుతున్న మరో వారం.'],
    wellnessMessages: ['మెల్లగా నీరు తాగండి, క్రమంగా తినండి, విశ్రాంతికి సమయం ఇవ్వండి.', 'సమతుల్యమైన ఆహారం మరియు కొద్దిపాటి కదలిక మీ రోజుకు తోడ్పడవచ్చు.', 'చిన్న భోజనాలు, తగినంత ద్రవాలు, మంచి విశ్రాంతి కూడా సంరక్షణే.'],
    dailyJourney: (week) => `ఈ ప్రయాణంలో మీరు ${week} వారాల్లో ఉన్నారు. ఈ రోజు మీపై మీరు మృదువుగా ఉండండి.`, openJourney: 'మీ గర్భధారణ ప్రయాణం కోసం జనని తెరవండి.',
    widgetTodayTitle: 'ఈ రోజు జనని', widgetMedicineTitle: 'తర్వాతి మందు', widgetLoveTitle: 'నిన్ను గుర్తు చేసుకుంటున్నాను', widgetAppointmentTitle: 'తర్వాతి అపాయింట్‌మెంట్', widgetWellnessTitle: 'రోజువారీ వెల్‌నెస్ 🌿', widgetCareFallback: 'ఈ రోజు సంరక్షణ కోసం జనని తెరవండి', widgetMedicineFallback: 'త్వరలో మందు లేదు', widgetAppointmentFallback: 'అపాయింట్‌మెంట్ లేదు', widgetBabyFallback: 'ఈ వారం ప్రయాణం కోసం జనని తెరవండి', widgetWellnessFallback: 'మెల్లగా తినండి, నీరు తాగండి, శరీరం అడిగితే విశ్రాంతి తీసుకోండి.',
    signedOutFamily: 'సైన్ ఇన్ చేయండి లేదా కుటుంబాన్ని లింక్ చేయండి', privateCare: 'మీ సంరక్షణ వివరాలు వ్యక్తిగతం', openMedicines: 'మందులు చూడటానికి జనని తెరవండి', openAppointments: 'అపాయింట్‌మెంట్లు చూడటానికి జనని తెరవండి', openJanani: 'జనని తెరవండి', privatePregnancy: 'మీ గర్భధారణ ప్రయాణం వ్యక్తిగతంగా ఉంటుంది', openWellness: 'రోజువారీ వెల్‌నెస్ కోసం జనని తెరవండి',
  },
  hi: {
    medicineNotificationTitle: '💊 दवा का समय', medicineNotificationBody: 'आपकी तय की गई दवा का समय हो गया है। निजी रिमाइंडर देखने के लिए जननी खोलें।', careNotificationTitle: 'जननी की एक हल्की याद', careNotificationBody: 'आज का निजी केयर रिमाइंडर देखने के लिए जननी खोलें।',
    week: 'सप्ताह', days: 'दिन', familyFallback: 'हमारा छोटा परिवार', upcomingReminders: 'आने वाले रिमाइंडर देखने के लिए जननी खोलें', noMedicine: 'अभी कोई दवा जल्द देय नहीं है', noAppointment: 'कोई अपॉइंटमेंट तय नहीं है', partnerWaiting: 'आपके साथी का एक छोटा-सा दिल आपका इंतज़ार कर रहा है 💗', sendWarmth: 'थोड़ा अपनापन भेजें 💗',
    babyMessages: ['आपकी छोटी-सी यात्रा हर दिन आगे बढ़ रही है।', 'हर दिन छोटे-छोटे बदलाव हो रहे हैं।', 'साथ मिलकर बढ़ने का एक और सप्ताह।'],
    wellnessMessages: ['धीरे-धीरे पानी पिएँ, नियमित खाएँ और आराम के लिए जगह बनाएँ।', 'संतुलित थाली और थोड़ी गतिविधि आपके दिन को सहारा दे सकती है।', 'छोटे भोजन, पर्याप्त तरल और अच्छा आराम भी देखभाल हैं।'],
    dailyJourney: (week) => `इस यात्रा में आप ${week} सप्ताह पर हैं। आज अपने साथ नरमी रखें।`, openJourney: 'अपनी गर्भावस्था यात्रा के लिए जननी खोलें।',
    widgetTodayTitle: 'आज जननी', widgetMedicineTitle: 'अगली दवा', widgetLoveTitle: 'आपकी याद', widgetAppointmentTitle: 'अगला अपॉइंटमेंट', widgetWellnessTitle: 'रोज़ का वेलनेस 🌿', widgetCareFallback: 'आज की देखभाल के लिए जननी खोलें', widgetMedicineFallback: 'अभी कोई दवा जल्द देय नहीं है', widgetAppointmentFallback: 'कोई अपॉइंटमेंट तय नहीं है', widgetBabyFallback: 'इस सप्ताह की यात्रा के लिए जननी खोलें', widgetWellnessFallback: 'हल्का खाएँ, पानी पिएँ और शरीर माँगे तो आराम करें।',
    signedOutFamily: 'साइन इन करें या परिवार लिंक करें', privateCare: 'आपकी देखभाल की जानकारी निजी है', openMedicines: 'दवाइयाँ देखने के लिए जननी खोलें', openAppointments: 'अपॉइंटमेंट देखने के लिए जननी खोलें', openJanani: 'जननी खोलें', privatePregnancy: 'आपकी गर्भावस्था यात्रा निजी रहती है', openWellness: 'रोज़ के वेलनेस के लिए जननी खोलें',
  },
};

export function systemCopy(language: JananiLanguage): SystemCopy {
  return copy[language] ?? copy.en;
}

export async function readSystemCopy(): Promise<SystemCopy> {
  return systemCopy(await readUiLanguage());
}
