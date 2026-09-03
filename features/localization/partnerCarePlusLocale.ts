import { readGlobalUiLocale } from '@/i18n/uiLocale';

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
  ta: { connectionTitle:'உங்களை நினைக்கிறேன்', thinking:'உங்களை நினைக்கிறேன்', notAlone:'நீங்கள் தனியாக இல்லை', rest:'சிறிது ஓய்வு எடுத்துக்கொள்ளுங்கள்', proud:'உங்களைப் பற்றி நான் பெருமைப்படுகிறேன்', carePlusTitle:'நீங்கள் சேமிக்கும் தகவலின் அடிப்படையில் தனிப்பட்ட ஆதரவு', today:'இன்று', appointment:'நேர்காணல்', trends:'என் போக்குகள்', mealIdeas:'உணவு யோசனைகள்', askCarePlus:'ஜனனி கேர்+ ஐ கேளுங்கள்', ask:'கேர்+ ஐ கேளுங்கள்', preparing:'தயாராகிறது…' },
  kn: { connectionTitle:'ನಿನ್ನ ನೆನಪು', thinking:'ನಿನ್ನ ನೆನಪು', notAlone:'ನೀವು ಒಬ್ಬರಲ್ಲ', rest:'ಸ್ವಲ್ಪ ವಿಶ್ರಾಂತಿ ತೆಗೆದುಕೊಳ್ಳಿ', proud:'ನಿಮ್ಮ ಬಗ್ಗೆ ನನಗೆ ಹೆಮ್ಮೆ ಇದೆ', carePlusTitle:'ನೀವು ಉಳಿಸುವ ಮಾಹಿತಿಯಿಂದ ವೈಯಕ್ತಿಕ ಬೆಂಬಲ', today:'ಇಂದು', appointment:'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್', trends:'ನನ್ನ ಟ್ರೆಂಡ್‌ಗಳು', mealIdeas:'ಆಹಾರ ಕಲ್ಪನೆಗಳು', askCarePlus:'ಜನನಿ ಕೇರ್+ ಅನ್ನು ಕೇಳಿ', ask:'ಕೇರ್+ ಕೇಳಿ', preparing:'ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ…' },
  ml: { connectionTitle:'നിന്നെ ഓർക്കുന്നു', thinking:'നിന്നെ ഓർക്കുന്നു', notAlone:'നിങ്ങൾ ഒറ്റയ്ക്കല്ല', rest:'കുറച്ച് വിശ്രമിക്കൂ', proud:'നിങ്ങളെ കുറിച്ച് എനിക്ക് അഭിമാനമുണ്ട്', carePlusTitle:'നിങ്ങൾ സേവ് ചെയ്യുന്ന വിവരങ്ങളിൽ നിന്ന് വ്യക്തിഗത പിന്തുണ', today:'ഇന്ന്', appointment:'അപ്പോയിന്റ്മെന്റ്', trends:'എന്റെ ട്രെൻഡുകൾ', mealIdeas:'ഭക്ഷണ ആശയങ്ങൾ', askCarePlus:'ജനനി കെയർ+നോട് ചോദിക്കുക', ask:'കെയർ+നോട് ചോദിക്കുക', preparing:'തയ്യാറാക്കുന്നു…' },
  mr: { connectionTitle:'तुझी आठवण येते', thinking:'तुझी आठवण येते', notAlone:'तुम्ही एकटे नाही', rest:'कृपया थोडा आराम करा', proud:'मला तुमचा अभिमान आहे', carePlusTitle:'तुम्ही जतन केलेल्या माहितीतून वैयक्तिक मदत', today:'आज', appointment:'अपॉइंटमेंट', trends:'माझे ट्रेंड', mealIdeas:'आहार कल्पना', askCarePlus:'जननी केअर+ ला विचारा', ask:'केअर+ ला विचारा', preparing:'तयार करत आहे…' },
  bn: { connectionTitle:'তোমার কথা ভাবছি', thinking:'তোমার কথা ভাবছি', notAlone:'আপনি একা নন', rest:'একটু বিশ্রাম নিন', proud:'আমি আপনাকে নিয়ে গর্বিত', carePlusTitle:'আপনার সংরক্ষিত তথ্য থেকে ব্যক্তিগত সহায়তা', today:'আজ', appointment:'অ্যাপয়েন্টমেন্ট', trends:'আমার ট্রেন্ড', mealIdeas:'খাবারের ধারণা', askCarePlus:'জননী কেয়ার+কে জিজ্ঞাসা করুন', ask:'কেয়ার+কে জিজ্ঞাসা করুন', preparing:'প্রস্তুত হচ্ছে…' },
  gu: { connectionTitle:'તમારી યાદ આવે છે', thinking:'તમારી યાદ આવે છે', notAlone:'તમે એકલા નથી', rest:'થોડો આરામ કરો', proud:'મને તમારો ગર્વ છે', carePlusTitle:'તમે સાચવેલી માહિતી પરથી વ્યક્તિગત સહાય', today:'આજે', appointment:'અપોઇન્ટમેન્ટ', trends:'મારા ટ્રેન્ડ્સ', mealIdeas:'ભોજન વિચારો', askCarePlus:'જનની કેર+ ને પૂછો', ask:'કેર+ ને પૂછો', preparing:'તૈયાર થઈ રહ્યું છે…' },
  pa: { connectionTitle:'ਤੇਰੀ ਯਾਦ ਆ ਰਹੀ ਹੈ', thinking:'ਤੇਰੀ ਯਾਦ ਆ ਰਹੀ ਹੈ', notAlone:'ਤੁਸੀਂ ਇਕੱਲੇ ਨਹੀਂ ਹੋ', rest:'ਕਿਰਪਾ ਕਰਕੇ ਥੋੜ੍ਹਾ ਆਰਾਮ ਕਰੋ', proud:'ਮੈਨੂੰ ਤੁਹਾਡੇ ਉੱਤੇ ਮਾਣ ਹੈ', carePlusTitle:'ਤੁਹਾਡੇ ਵੱਲੋਂ ਸੰਭਾਲੀ ਜਾਣਕਾਰੀ ਤੋਂ ਨਿੱਜੀ ਸਹਾਇਤਾ', today:'ਅੱਜ', appointment:'ਅਪਾਇੰਟਮੈਂਟ', trends:'ਮੇਰੇ ਰੁਝਾਨ', mealIdeas:'ਭੋਜਨ ਵਿਚਾਰ', askCarePlus:'ਜਨਨੀ ਕੇਅਰ+ ਨੂੰ ਪੁੱਛੋ', ask:'ਕੇਅਰ+ ਨੂੰ ਪੁੱਛੋ', preparing:'ਤਿਆਰ ਕੀਤਾ ਜਾ ਰਿਹਾ ਹੈ…' },
  ur: { connectionTitle:'آپ کی یاد آ رہی ہے', thinking:'آپ کی یاد آ رہی ہے', notAlone:'آپ اکیلی نہیں ہیں', rest:'براہ کرم تھوڑا آرام کریں', proud:'مجھے آپ پر فخر ہے', carePlusTitle:'آپ کی محفوظ کی گئی معلومات سے ذاتی معاونت', today:'آج', appointment:'اپائنٹمنٹ', trends:'میرے رجحانات', mealIdeas:'کھانے کے خیالات', askCarePlus:'جننی کیئر+ سے پوچھیں', ask:'کیئر+ سے پوچھیں', preparing:'تیار ہو رہا ہے…' },
  ne: { connectionTitle:'तपाईंको सम्झना आइरहेको छ', thinking:'तपाईंको सम्झना आइरहेको छ', notAlone:'तपाईं एक्लै हुनुहुन्न', rest:'कृपया केही आराम गर्नुहोस्', proud:'म तपाईंमा गर्व गर्छु', carePlusTitle:'तपाईंले सुरक्षित गर्नुभएको जानकारीबाट व्यक्तिगत सहयोग', today:'आज', appointment:'अपोइन्टमेन्ट', trends:'मेरा ट्रेन्डहरू', mealIdeas:'खानाका विचारहरू', askCarePlus:'जननी केयर+ लाई सोध्नुहोस्', ask:'केयर+ लाई सोध्नुहोस्', preparing:'तयार गर्दै…' },
} as const;

type EnglishCopy = (typeof copy)['en'];
export type PartnerCarePlusCopy = { [K in keyof EnglishCopy]: string };
type CopyKey = keyof PartnerCarePlusCopy;

function brandize(value: string): string {
  return value
    .replace(/JANANI/g, 'PREGALOVE')
    .replace(/Janani/g, 'PregaLove')
    .replace(/janani/g, 'PregaLove')
    .replace(/జనని/g, 'PregaLove')
    .replace(/जननी/g, 'PregaLove')
    .replace(/ஜனனி/g, 'PregaLove')
    .replace(/ಜನನಿ/g, 'PregaLove')
    .replace(/ജനനി/g, 'PregaLove')
    .replace(/জননী/g, 'PregaLove')
    .replace(/જનની/g, 'PregaLove')
    .replace(/ਜਨਨੀ/g, 'PregaLove')
    .replace(/ଜନନୀ/g, 'PregaLove')
    .replace(/جاناني|جانانی|جننی/g, 'PregaLove');
}

export async function loadPartnerCarePlusCopy(): Promise<PartnerCarePlusCopy> {
  const locale = await readGlobalUiLocale();
  const base = locale.split('-')[0].toLowerCase() as keyof typeof copy;
  const selected = copy[base] as Partial<PartnerCarePlusCopy> | undefined;
  const merged: Record<CopyKey, string> = { ...copy.en };
  if (selected) {
    for (const key of Object.keys(selected) as CopyKey[]) {
      const value = selected[key];
      if (value) merged[key] = value;
    }
  }
  for (const key of Object.keys(merged) as CopyKey[]) merged[key] = brandize(merged[key]);
  return merged as PartnerCarePlusCopy;
}
