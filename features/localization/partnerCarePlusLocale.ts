import { loadUiLanguage, type JananiLanguage } from '@/features/localization/i18n';

const copy = {
  en: {
    connectionEyebrow: 'A SMALL CONNECTION', connectionTitle: 'Thinking of you', connectionHeroTitle: 'Sometimes one little tap says enough.', connectionHeroText: 'Send a gentle note to your partner without needing to start a conversation.', recentWarmth: 'Recent warmth', noWarmth: 'Your shared moments will appear here.', fromPartner: 'From your partner', sentByYou: 'Sent by you', heartBack: 'Send a heart back', savedMessages: 'Showing the last saved messages. New updates will appear when you reconnect.',
    thinking: 'Thinking of you', notAlone: 'You are not alone', rest: 'Please take a little rest', proud: 'I am proud of you',
    carePlusTitle: 'Personalised support from the information you choose to save', today: 'Today', appointment: 'Appointment', trends: 'My trends', mealIdeas: 'Meal ideas', askCarePlus: 'Ask Janani Care+', ask: 'Ask Care+', preparing: 'Preparing…', placeholder: 'Example: Help me prepare questions for my next appointment.',
  },
  te: {
    connectionEyebrow: 'చిన్న అనుబంధం', connectionTitle: 'నిన్ను గుర్తు చేసుకుంటున్నాను', connectionHeroTitle: 'కొన్నిసార్లు ఒక చిన్న ట్యాప్ చాలుతుంది.', connectionHeroText: 'మాట్లాడటం ప్రారంభించాల్సిన అవసరం లేకుండా మీ భాగస్వామికి ఒక మృదువైన సందేశం పంపండి.', recentWarmth: 'ఇటీవలి ప్రేమ సందేశాలు', noWarmth: 'మీరు పంచుకున్న క్షణాలు ఇక్కడ కనిపిస్తాయి.', fromPartner: 'మీ భాగస్వామి నుంచి', sentByYou: 'మీరు పంపింది', heartBack: 'హృదయం తిరిగి పంపండి', savedMessages: 'చివరిగా సేవ్ చేసిన సందేశాలు చూపిస్తున్నాం. మళ్లీ కనెక్ట్ అయినప్పుడు కొత్తవి కనిపిస్తాయి.',
    thinking: 'నిన్ను గుర్తు చేసుకుంటున్నాను', notAlone: 'నీవు ఒంటరిగా లేవు', rest: 'కొంచెం విశ్రాంతి తీసుకో', proud: 'నీపై నాకు గర్వంగా ఉంది',
    carePlusTitle: 'మీరు సేవ్ చేయాలని ఎంచుకున్న సమాచారంతో వ్యక్తిగత సహాయం', today: 'ఈ రోజు', appointment: 'అపాయింట్మెంట్', trends: 'నా ట్రెండ్స్', mealIdeas: 'ఆహార ఆలోచనలు', askCarePlus: 'జనని కేర్+ ను అడగండి', ask: 'కేర్+ ను అడగండి', preparing: 'సిద్ధం చేస్తోంది…', placeholder: 'ఉదాహరణ: నా తదుపరి అపాయింట్మెంట్ కోసం ప్రశ్నలు సిద్ధం చేయడంలో సహాయం చేయండి.',
  },
  hi: {
    connectionEyebrow: 'एक छोटा जुड़ाव', connectionTitle: 'तुम्हारी याद आ रही है', connectionHeroTitle: 'कभी-कभी एक छोटा-सा टैप ही काफी होता है।', connectionHeroText: 'बात शुरू किए बिना अपने साथी को एक प्यारा संदेश भेजें।', recentWarmth: 'हाल के स्नेह संदेश', noWarmth: 'आपके साझा पल यहाँ दिखाई देंगे।', fromPartner: 'आपके साथी से', sentByYou: 'आपके द्वारा भेजा गया', heartBack: 'दिल वापस भेजें', savedMessages: 'अंतिम सहेजे गए संदेश दिख रहे हैं। दोबारा कनेक्ट होने पर नए अपडेट दिखाई देंगे।',
    thinking: 'तुम्हारी याद आ रही है', notAlone: 'तुम अकेली नहीं हो', rest: 'कृपया थोड़ा आराम करो', proud: 'मुझे तुम पर गर्व है',
    carePlusTitle: 'आपके द्वारा सहेजी गई जानकारी से व्यक्तिगत सहायता', today: 'आज', appointment: 'अपॉइंटमेंट', trends: 'मेरे रुझान', mealIdeas: 'भोजन सुझाव', askCarePlus: 'जननी केयर+ से पूछें', ask: 'केयर+ से पूछें', preparing: 'तैयार किया जा रहा है…', placeholder: 'उदाहरण: मेरी अगली अपॉइंटमेंट के लिए सवाल तैयार करने में मदद करें।',
  },
} as const;

export type PartnerCarePlusCopy = (typeof copy)['en'];

export async function loadPartnerCarePlusCopy(): Promise<PartnerCarePlusCopy> {
  const language: JananiLanguage = await loadUiLanguage();
  return copy[language] as PartnerCarePlusCopy;
}
