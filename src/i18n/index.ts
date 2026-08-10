import AsyncStorage from '@react-native-async-storage/async-storage';

export type JananiLanguage = 'en' | 'te' | 'hi';

const STORAGE_KEY = 'janani-ui-language-v1';

const en = {
  homeGreetingMother: 'How are you feeling today?', homeGreetingPartner: 'A little care goes a long way.', toolsTitle: 'Your Janani tools', toolsCaption: 'Pregnancy, care, food, memories and partner support in one place.',
  todayWithJanani: 'TODAY WITH JANANI', week: 'Week', day: 'day', openPregnancyGuide: 'Open pregnancy guide →', hydrationPrompt: 'Drink a glass of water and take one quiet minute for yourself.', partnerInviteCode: 'Partner invite code', partnerInviteHelp: 'Share this privately with your partner. It links both of you to the same family space.',
  pregnancyGuide: 'Pregnancy guide', healthGuide: 'Health guide', healthProfile: 'Health profile', healthTracker: 'Health tracker', careTimeline: 'Care timeline', careContext: 'Care context', carePlus: 'Janani Care+', reminders: 'Reminders', foodGuide: 'Food guide', journal: 'Journal', thinkingOfYou: 'Thinking of you', safetyPrivacy: 'Safety & privacy', settings: 'Settings',
  pregnancyGuideCaption: 'Trimester care', healthGuideCaption: 'BP, diabetes, thyroid', healthProfileCaption: 'Private health context', healthTrackerCaption: 'Weight, BP, glucose & labs', careTimelineCaption: 'Visits, scans & follow-ups', careContextCaption: 'Medicines, history & sharing', carePlusCaption: 'Personalised AI support', carePlusOfflineCaption: 'Care+ coming online', remindersCaption: 'Medicines and care', foodGuideCaption: 'Pregnancy nutrition', journalCaption: 'Keep every memory', thinkingMotherCaption: 'Share a little warmth', thinkingPartnerCaption: 'Send her some warmth', safetyCaption: 'Know your choices', settingsCaption: 'Export, unlink, account',
  backgroundTitle: 'Working quietly in the background', backgroundNotifications: 'Local medicine and care notifications', backgroundOffline: 'Offline cache and queued changes', backgroundWidget: 'Android home-screen widget sync', backgroundFamily: 'Private mother–partner family linking',
  careContextEyebrow: 'PRIVATE CARE CONTEXT', careContextTitle: 'The details Janani should understand.', careContextNotice: 'This information is mother-only by default. Partner sharing below applies only to the specific categories you choose.',
  languageRegion: 'Language & region', regionPreference: 'Region / food preference', medicalPregnancyHistory: 'Medical & pregnancy history', relevantMedicalHistory: 'Relevant medical history', previousPregnancyHistory: 'Previous pregnancy history', broaderClinicianInstructions: 'Broader clinician instructions', medicationsSupplements: 'Medications & supplements', medicationSafety: 'Janani records what you enter. It does not prescribe or change doses.', medication: 'Medication', supplement: 'Supplement', name: 'Name', strength: 'Strength', schedule: 'Schedule', clinicianInstructions: 'Clinician instructions', addCareContext: 'Add to care context', partnerSharing: 'Partner sharing', sharePregnancyProgress: 'Share pregnancy progress', shareCareTimeline: 'Share care timeline', partnerPrivateNote: 'Health readings, conditions, medications, lab values and clinician instructions remain mother-only in this version.', saveCareContext: 'Save care context', saved: 'Saved', savedBody: 'Your private care context has been updated.',
} as const;

export type MessageKey = keyof typeof en;

const messages: Record<JananiLanguage, Record<MessageKey, string>> = {
  en,
  te: {
    homeGreetingMother: 'ఈ రోజు మీరు ఎలా అనుభవిస్తున్నారు?', homeGreetingPartner: 'చిన్న శ్రద్ధ కూడా ఎంతో ప్రేమను తెలియజేస్తుంది.', toolsTitle: 'మీ జనని సాధనాలు', toolsCaption: 'గర్భధారణ, సంరక్షణ, ఆహారం, జ్ఞాపకాలు మరియు భాగస్వామి సహాయం ఒకేచోట.',
    todayWithJanani: 'ఈ రోజు జననితో', week: 'వారం', day: 'రోజు', openPregnancyGuide: 'గర్భధారణ మార్గదర్శి తెరవండి →', hydrationPrompt: 'ఒక గ్లాసు నీరు తాగి, మీ కోసం ఒక ప్రశాంతమైన నిమిషం తీసుకోండి.', partnerInviteCode: 'భాగస్వామి ఆహ్వాన కోడ్', partnerInviteHelp: 'ఈ కోడ్‌ను మీ భాగస్వామితో వ్యక్తిగతంగా పంచుకోండి. ఇది మీ ఇద్దరినీ ఒకే కుటుంబ స్థలానికి కలుపుతుంది.',
    pregnancyGuide: 'గర్భధారణ మార్గదర్శి', healthGuide: 'ఆరోగ్య మార్గదర్శి', healthProfile: 'ఆరోగ్య ప్రొఫైల్', healthTracker: 'ఆరోగ్య ట్రాకర్', careTimeline: 'సంరక్షణ టైమ్‌లైన్', careContext: 'సంరక్షణ వివరాలు', carePlus: 'జనని కేర్+', reminders: 'రిమైండర్లు', foodGuide: 'ఆహార మార్గదర్శి', journal: 'జర్నల్', thinkingOfYou: 'నిన్ను గుర్తు చేసుకుంటున్నాను', safetyPrivacy: 'భద్రత & గోప్యత', settings: 'సెట్టింగ్స్',
    pregnancyGuideCaption: 'త్రైమాసిక సంరక్షణ', healthGuideCaption: 'బీపీ, డయాబెటిస్, థైరాయిడ్', healthProfileCaption: 'వ్యక్తిగత ఆరోగ్య వివరాలు', healthTrackerCaption: 'బరువు, బీపీ, గ్లూకోజ్ & ల్యాబ్స్', careTimelineCaption: 'విజిట్లు, స్కాన్లు & ఫాలో-అప్స్', careContextCaption: 'మందులు, చరిత్ర & పంచుకోవడం', carePlusCaption: 'వ్యక్తిగతీకరించిన AI సహాయం', carePlusOfflineCaption: 'కేర్+ త్వరలో అందుబాటులోకి వస్తుంది', remindersCaption: 'మందులు మరియు సంరక్షణ', foodGuideCaption: 'గర్భధారణ పోషణ', journalCaption: 'ప్రతి జ్ఞాపకాన్ని దాచుకోండి', thinkingMotherCaption: 'కొంచెం ప్రేమను పంచుకోండి', thinkingPartnerCaption: 'ఆమెకు కొంచెం ప్రేమను పంపండి', safetyCaption: 'మీ ఎంపికలను తెలుసుకోండి', settingsCaption: 'ఎక్స్‌పోర్ట్, అన్‌లింక్, ఖాతా',
    backgroundTitle: 'నిశ్శబ్దంగా పనిచేస్తున్నవి', backgroundNotifications: 'స్థానిక మందులు మరియు సంరక్షణ నోటిఫికేషన్లు', backgroundOffline: 'ఆఫ్‌లైన్ క్యాష్ మరియు క్యూలో ఉన్న మార్పులు', backgroundWidget: 'ఆండ్రాయిడ్ హోమ్-స్క్రీన్ విడ్జెట్ సింక్', backgroundFamily: 'వ్యక్తిగత తల్లి–భాగస్వామి కుటుంబ లింకింగ్',
    careContextEyebrow: 'వ్యక్తిగత సంరక్షణ వివరాలు', careContextTitle: 'జనని అర్థం చేసుకోవాల్సిన మీ వివరాలు.', careContextNotice: 'ఈ సమాచారం సాధారణంగా తల్లికే పరిమితం. మీరు ఎంచుకున్న విభాగాలు మాత్రమే భాగస్వామితో పంచబడతాయి.',
    languageRegion: 'భాష & ప్రాంతం', regionPreference: 'ప్రాంతం / ఆహార అభిరుచి', medicalPregnancyHistory: 'వైద్య & గత గర్భధారణ చరిత్ర', relevantMedicalHistory: 'సంబంధిత వైద్య చరిత్ర', previousPregnancyHistory: 'గత గర్భధారణ చరిత్ర', broaderClinicianInstructions: 'వైద్యుని సూచనలు', medicationsSupplements: 'మందులు & సప్లిమెంట్లు', medicationSafety: 'మీరు నమోదు చేసిన వివరాలను మాత్రమే జనని భద్రపరుస్తుంది. మందుల మోతాదులను సూచించదు లేదా మార్చదు.', medication: 'మందు', supplement: 'సప్లిమెంట్', name: 'పేరు', strength: 'బలం / మోతాదు వివరాలు', schedule: 'షెడ్యూల్', clinicianInstructions: 'వైద్యుని సూచనలు', addCareContext: 'సంరక్షణ వివరాలకు జోడించండి', partnerSharing: 'భాగస్వామితో పంచుకోవడం', sharePregnancyProgress: 'గర్భధారణ పురోగతిని పంచుకోండి', shareCareTimeline: 'సంరక్షణ టైమ్‌లైన్ పంచుకోండి', partnerPrivateNote: 'ఆరోగ్య రీడింగులు, పరిస్థితులు, మందులు, ల్యాబ్ విలువలు మరియు వైద్యుని సూచనలు ఈ వెర్షన్‌లో తల్లికే పరిమితం.', saveCareContext: 'సంరక్షణ వివరాలు సేవ్ చేయండి', saved: 'సేవ్ అయింది', savedBody: 'మీ వ్యక్తిగత సంరక్షణ వివరాలు నవీకరించబడ్డాయి.',
  },
  hi: {
    homeGreetingMother: 'आज आप कैसा महसूस कर रही हैं?', homeGreetingPartner: 'थोड़ी-सी देखभाल भी बहुत मायने रखती है।', toolsTitle: 'आपके जननी टूल्स', toolsCaption: 'गर्भावस्था, देखभाल, भोजन, यादें और साथी का सहयोग एक ही जगह।',
    todayWithJanani: 'आज जननी के साथ', week: 'सप्ताह', day: 'दिन', openPregnancyGuide: 'गर्भावस्था मार्गदर्शिका खोलें →', hydrationPrompt: 'एक गिलास पानी पिएँ और अपने लिए एक शांत मिनट निकालें।', partnerInviteCode: 'साथी आमंत्रण कोड', partnerInviteHelp: 'इसे अपने साथी के साथ निजी रूप से साझा करें। यह आप दोनों को एक ही परिवार स्पेस से जोड़ता है।',
    pregnancyGuide: 'गर्भावस्था मार्गदर्शिका', healthGuide: 'स्वास्थ्य मार्गदर्शिका', healthProfile: 'स्वास्थ्य प्रोफ़ाइल', healthTracker: 'स्वास्थ्य ट्रैकर', careTimeline: 'केयर टाइमलाइन', careContext: 'केयर संदर्भ', carePlus: 'जननी केयर+', reminders: 'रिमाइंडर', foodGuide: 'भोजन मार्गदर्शिका', journal: 'जर्नल', thinkingOfYou: 'आपकी याद', safetyPrivacy: 'सुरक्षा और गोपनीयता', settings: 'सेटिंग्स',
    pregnancyGuideCaption: 'त्रैमासिक देखभाल', healthGuideCaption: 'बीपी, डायबिटीज़, थायरॉयड', healthProfileCaption: 'निजी स्वास्थ्य संदर्भ', healthTrackerCaption: 'वज़न, बीपी, ग्लूकोज़ और लैब', careTimelineCaption: 'विज़िट, स्कैन और फॉलो-अप', careContextCaption: 'दवाइयाँ, इतिहास और साझा करना', carePlusCaption: 'व्यक्तिगत AI सहायता', carePlusOfflineCaption: 'केयर+ जल्द उपलब्ध होगा', remindersCaption: 'दवाइयाँ और देखभाल', foodGuideCaption: 'गर्भावस्था पोषण', journalCaption: 'हर याद को सँजोएँ', thinkingMotherCaption: 'थोड़ा अपनापन साझा करें', thinkingPartnerCaption: 'उन्हें थोड़ा अपनापन भेजें', safetyCaption: 'अपने विकल्प जानें', settingsCaption: 'एक्सपोर्ट, अनलिंक, खाता',
    backgroundTitle: 'पृष्ठभूमि में काम कर रहा है', backgroundNotifications: 'स्थानीय दवा और देखभाल सूचनाएँ', backgroundOffline: 'ऑफ़लाइन कैश और कतारबद्ध बदलाव', backgroundWidget: 'एंड्रॉइड होम-स्क्रीन विजेट सिंक', backgroundFamily: 'निजी माँ–साथी परिवार लिंकिंग',
    careContextEyebrow: 'निजी केयर संदर्भ', careContextTitle: 'वे बातें जिन्हें जननी को समझना चाहिए।', careContextNotice: 'यह जानकारी डिफ़ॉल्ट रूप से केवल माँ के लिए है। नीचे केवल वही श्रेणियाँ साथी के साथ साझा होंगी जिन्हें आप चुनेंगी।',
    languageRegion: 'भाषा और क्षेत्र', regionPreference: 'क्षेत्र / भोजन पसंद', medicalPregnancyHistory: 'चिकित्सा और पिछली गर्भावस्था का इतिहास', relevantMedicalHistory: 'संबंधित चिकित्सा इतिहास', previousPregnancyHistory: 'पिछली गर्भावस्था का इतिहास', broaderClinicianInstructions: 'डॉक्टर के व्यापक निर्देश', medicationsSupplements: 'दवाइयाँ और सप्लीमेंट', medicationSafety: 'जननी केवल आपकी दर्ज की गई जानकारी रखता है। यह दवा की खुराक निर्धारित या बदलता नहीं है।', medication: 'दवा', supplement: 'सप्लीमेंट', name: 'नाम', strength: 'स्ट्रेंथ', schedule: 'समय-सारणी', clinicianInstructions: 'डॉक्टर के निर्देश', addCareContext: 'केयर संदर्भ में जोड़ें', partnerSharing: 'साथी के साथ साझा करना', sharePregnancyProgress: 'गर्भावस्था प्रगति साझा करें', shareCareTimeline: 'केयर टाइमलाइन साझा करें', partnerPrivateNote: 'स्वास्थ्य रीडिंग, स्थितियाँ, दवाइयाँ, लैब मान और डॉक्टर के निर्देश इस संस्करण में केवल माँ के लिए रहते हैं।', saveCareContext: 'केयर संदर्भ सेव करें', saved: 'सेव हो गया', savedBody: 'आपका निजी केयर संदर्भ अपडेट हो गया है।',
  },
};

export type MessageKey = keyof typeof en;

export function t(language: JananiLanguage, key: MessageKey): string {
  return messages[language]?.[key] ?? en[key];
}

export async function readUiLanguage(): Promise<JananiLanguage> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  return value === 'te' || value === 'hi' ? value : 'en';
}

export async function writeUiLanguage(language: JananiLanguage): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, language);
}
