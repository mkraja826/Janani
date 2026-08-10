import AsyncStorage from '@react-native-async-storage/async-storage';

export type JananiLanguage = 'en' | 'te' | 'hi';

const STORAGE_KEY = 'janani-ui-language-v1';

const messages = {
  en: {
    homeGreetingMother: 'How are you feeling today?',
    homeGreetingPartner: 'A little care goes a long way.',
    toolsTitle: 'Your Janani tools',
    toolsCaption: 'Pregnancy, care, food, memories and partner support in one place.',
    pregnancyGuide: 'Pregnancy guide', healthGuide: 'Health guide', healthProfile: 'Health profile', healthTracker: 'Health tracker', careTimeline: 'Care timeline', careContext: 'Care context', carePlus: 'Janani Care+', reminders: 'Reminders', foodGuide: 'Food guide', journal: 'Journal', thinkingOfYou: 'Thinking of you', safetyPrivacy: 'Safety & privacy', settings: 'Settings',
    careContextEyebrow: 'PRIVATE CARE CONTEXT', careContextTitle: 'The details Janani should understand.', careContextNotice: 'This information is mother-only by default. Partner sharing below applies only to the specific categories you choose.',
    languageRegion: 'Language & region', regionPreference: 'Region / food preference', medicalPregnancyHistory: 'Medical & pregnancy history', relevantMedicalHistory: 'Relevant medical history', previousPregnancyHistory: 'Previous pregnancy history', broaderClinicianInstructions: 'Broader clinician instructions', medicationsSupplements: 'Medications & supplements', medicationSafety: 'Janani records what you enter. It does not prescribe or change doses.', medication: 'Medication', supplement: 'Supplement', name: 'Name', strength: 'Strength', schedule: 'Schedule', clinicianInstructions: 'Clinician instructions', addCareContext: 'Add to care context', partnerSharing: 'Partner sharing', sharePregnancyProgress: 'Share pregnancy progress', shareCareTimeline: 'Share care timeline', partnerPrivateNote: 'Health readings, conditions, medications, lab values and clinician instructions remain mother-only in this version.', saveCareContext: 'Save care context', saved: 'Saved', savedBody: 'Your private care context has been updated.',
  },
  te: {
    homeGreetingMother: 'ఈ రోజు మీరు ఎలా అనుభవిస్తున్నారు?',
    homeGreetingPartner: 'చిన్న శ్రద్ధ కూడా ఎంతో ప్రేమను తెలియజేస్తుంది.',
    toolsTitle: 'మీ జనని సాధనాలు',
    toolsCaption: 'గర్భధారణ, సంరక్షణ, ఆహారం, జ్ఞాపకాలు మరియు భాగస్వామి సహాయం ఒకేచోట.',
    pregnancyGuide: 'గర్భధారణ మార్గదర్శి', healthGuide: 'ఆరోగ్య మార్గదర్శి', healthProfile: 'ఆరోగ్య ప్రొఫైల్', healthTracker: 'ఆరోగ్య ట్రాకర్', careTimeline: 'సంరక్షణ టైమ్‌లైన్', careContext: 'సంరక్షణ వివరాలు', carePlus: 'జనని కేర్+', reminders: 'రిమైండర్లు', foodGuide: 'ఆహార మార్గదర్శి', journal: 'జర్నల్', thinkingOfYou: 'నిన్ను గుర్తు చేసుకుంటున్నాను', safetyPrivacy: 'భద్రత & గోప్యత', settings: 'సెట్టింగ్స్',
    careContextEyebrow: 'వ్యక్తిగత సంరక్షణ వివరాలు', careContextTitle: 'జనని అర్థం చేసుకోవాల్సిన మీ వివరాలు.', careContextNotice: 'ఈ సమాచారం సాధారణంగా తల్లికే పరిమితం. మీరు ఎంచుకున్న విభాగాలు మాత్రమే భాగస్వామితో పంచబడతాయి.',
    languageRegion: 'భాష & ప్రాంతం', regionPreference: 'ప్రాంతం / ఆహార అభిరుచి', medicalPregnancyHistory: 'వైద్య & గత గర్భధారణ చరిత్ర', relevantMedicalHistory: 'సంబంధిత వైద్య చరిత్ర', previousPregnancyHistory: 'గత గర్భధారణ చరిత్ర', broaderClinicianInstructions: 'వైద్యుని సూచనలు', medicationsSupplements: 'మందులు & సప్లిమెంట్లు', medicationSafety: 'మీరు నమోదు చేసిన వివరాలను మాత్రమే జనని భద్రపరుస్తుంది. మందుల మోతాదులను సూచించదు లేదా మార్చదు.', medication: 'మందు', supplement: 'సప్లిమెంట్', name: 'పేరు', strength: 'బలం / మోతాదు వివరాలు', schedule: 'షెడ్యూల్', clinicianInstructions: 'వైద్యుని సూచనలు', addCareContext: 'సంరక్షణ వివరాలకు జోడించండి', partnerSharing: 'భాగస్వామితో పంచుకోవడం', sharePregnancyProgress: 'గర్భధారణ పురోగతిని పంచుకోండి', shareCareTimeline: 'సంరక్షణ టైమ్‌లైన్ పంచుకోండి', partnerPrivateNote: 'ఆరోగ్య రీడింగులు, పరిస్థితులు, మందులు, ల్యాబ్ విలువలు మరియు వైద్యుని సూచనలు ఈ వెర్షన్‌లో తల్లికే పరిమితం.', saveCareContext: 'సంరక్షణ వివరాలు సేవ్ చేయండి', saved: 'సేవ్ అయింది', savedBody: 'మీ వ్యక్తిగత సంరక్షణ వివరాలు నవీకరించబడ్డాయి.',
  },
  hi: {
    homeGreetingMother: 'आज आप कैसा महसूस कर रही हैं?',
    homeGreetingPartner: 'थोड़ी-सी देखभाल भी बहुत मायने रखती है।',
    toolsTitle: 'आपके जननी टूल्स',
    toolsCaption: 'गर्भावस्था, देखभाल, भोजन, यादें और साथी का सहयोग एक ही जगह।',
    pregnancyGuide: 'गर्भावस्था मार्गदर्शिका', healthGuide: 'स्वास्थ्य मार्गदर्शिका', healthProfile: 'स्वास्थ्य प्रोफ़ाइल', healthTracker: 'स्वास्थ्य ट्रैकर', careTimeline: 'केयर टाइमलाइन', careContext: 'केयर संदर्भ', carePlus: 'जननी केयर+', reminders: 'रिमाइंडर', foodGuide: 'भोजन मार्गदर्शिका', journal: 'जर्नल', thinkingOfYou: 'आपकी याद', safetyPrivacy: 'सुरक्षा और गोपनीयता', settings: 'सेटिंग्स',
    careContextEyebrow: 'निजी केयर संदर्भ', careContextTitle: 'वे बातें जिन्हें जननी को समझना चाहिए।', careContextNotice: 'यह जानकारी डिफ़ॉल्ट रूप से केवल माँ के लिए है। नीचे केवल वही श्रेणियाँ साथी के साथ साझा होंगी जिन्हें आप चुनेंगी।',
    languageRegion: 'भाषा और क्षेत्र', regionPreference: 'क्षेत्र / भोजन पसंद', medicalPregnancyHistory: 'चिकित्सा और पिछली गर्भावस्था का इतिहास', relevantMedicalHistory: 'संबंधित चिकित्सा इतिहास', previousPregnancyHistory: 'पिछली गर्भावस्था का इतिहास', broaderClinicianInstructions: 'डॉक्टर के व्यापक निर्देश', medicationsSupplements: 'दवाइयाँ और सप्लीमेंट', medicationSafety: 'जननी केवल आपकी दर्ज की गई जानकारी रखता है। यह दवा की खुराक निर्धारित या बदलता नहीं है।', medication: 'दवा', supplement: 'सप्लीमेंट', name: 'नाम', strength: 'स्ट्रेंथ', schedule: 'समय-सारणी', clinicianInstructions: 'डॉक्टर के निर्देश', addCareContext: 'केयर संदर्भ में जोड़ें', partnerSharing: 'साथी के साथ साझा करना', sharePregnancyProgress: 'गर्भावस्था प्रगति साझा करें', shareCareTimeline: 'केयर टाइमलाइन साझा करें', partnerPrivateNote: 'स्वास्थ्य रीडिंग, स्थितियाँ, दवाइयाँ, लैब मान और डॉक्टर के निर्देश इस संस्करण में केवल माँ के लिए रहते हैं।', saveCareContext: 'केयर संदर्भ सेव करें', saved: 'सेव हो गया', savedBody: 'आपका निजी केयर संदर्भ अपडेट हो गया है।',
  },
} as const;

export type MessageKey = keyof typeof messages.en;

export function t(language: JananiLanguage, key: MessageKey): string {
  return messages[language]?.[key] ?? messages.en[key];
}

export async function readUiLanguage(): Promise<JananiLanguage> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  return value === 'te' || value === 'hi' ? value : 'en';
}

export async function writeUiLanguage(language: JananiLanguage): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, language);
}
