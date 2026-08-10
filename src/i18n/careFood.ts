import type { JananiLanguage } from '@/i18n';

const copy = {
  en: {
    careEyebrow: 'PRIVATE CARE TIMELINE', careTitle: 'Visits, scans and follow-ups in one place.', addCareEntry: 'Add care entry', editCareEntry: 'Edit care entry', type: 'Type', date: 'Date', time: 'Time', doctorProvider: 'Doctor / provider', facility: 'Hospital / clinic / lab', purpose: 'Purpose', questionsToAsk: 'Questions to ask', onePerLine: 'One per line', status: 'Status', notesAfterVisit: 'Notes after visit', testsPrescribed: 'Tests / scans prescribed', cancel: 'Cancel', save: 'Save', timeline: 'Timeline', noEntries: 'No entries yet.', scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled',
    foodEyebrow: 'JANANI FOOD GUIDE', foodTitle: 'Simple nourishment for pregnancy', balancedTitle: 'Build every plate gently', hydrationTitle: 'Hydration matters', foodSafetyTitle: 'Food safety first', carePlusMealTitle: 'Care+ meal support', openCarePlus: 'Open Care+',
  },
  te: {
    careEyebrow: 'వ్యక్తిగత సంరక్షణ టైమ్‌లైన్', careTitle: 'విజిట్లు, స్కాన్లు మరియు ఫాలో-అప్స్ ఒకేచోట.', addCareEntry: 'సంరక్షణ నమోదు జోడించండి', editCareEntry: 'సంరక్షణ నమోదు మార్చండి', type: 'రకం', date: 'తేదీ', time: 'సమయం', doctorProvider: 'డాక్టర్ / సేవాదారు', facility: 'హాస్పిటల్ / క్లినిక్ / ల్యాబ్', purpose: 'ఉద్దేశ్యం', questionsToAsk: 'అడగాల్సిన ప్రశ్నలు', onePerLine: 'ప్రతి లైనులో ఒకటి', status: 'స్థితి', notesAfterVisit: 'విజిట్ తర్వాత గమనికలు', testsPrescribed: 'సూచించిన పరీక్షలు / స్కాన్లు', cancel: 'రద్దు', save: 'సేవ్', timeline: 'టైమ్‌లైన్', noEntries: 'ఇంకా నమోదులు లేవు.', scheduled: 'షెడ్యూల్ చేయబడింది', completed: 'పూర్తైంది', cancelled: 'రద్దైంది',
    foodEyebrow: 'జనని ఆహార మార్గదర్శి', foodTitle: 'గర్భధారణకు సరళమైన పోషణ', balancedTitle: 'ప్రతి పళ్లెంను సమతుల్యంగా నిర్మించండి', hydrationTitle: 'తగినంత నీరు ముఖ్యం', foodSafetyTitle: 'ఆహార భద్రత ముందుగా', carePlusMealTitle: 'కేర్+ భోజన సహాయం', openCarePlus: 'కేర్+ తెరవండి',
  },
  hi: {
    careEyebrow: 'निजी केयर टाइमलाइन', careTitle: 'विज़िट, स्कैन और फॉलो-अप एक ही जगह।', addCareEntry: 'केयर एंट्री जोड़ें', editCareEntry: 'केयर एंट्री संपादित करें', type: 'प्रकार', date: 'तारीख', time: 'समय', doctorProvider: 'डॉक्टर / प्रदाता', facility: 'अस्पताल / क्लिनिक / लैब', purpose: 'उद्देश्य', questionsToAsk: 'पूछने के प्रश्न', onePerLine: 'हर पंक्ति में एक', status: 'स्थिति', notesAfterVisit: 'विज़िट के बाद नोट्स', testsPrescribed: 'बताए गए टेस्ट / स्कैन', cancel: 'रद्द करें', save: 'सेव करें', timeline: 'टाइमलाइन', noEntries: 'अभी कोई एंट्री नहीं है।', scheduled: 'निर्धारित', completed: 'पूरा हुआ', cancelled: 'रद्द हुआ',
    foodEyebrow: 'जननी फ़ूड गाइड', foodTitle: 'गर्भावस्था के लिए सरल पोषण', balancedTitle: 'हर प्लेट को संतुलित रखें', hydrationTitle: 'पर्याप्त पानी ज़रूरी है', foodSafetyTitle: 'खाद्य सुरक्षा पहले', carePlusMealTitle: 'केयर+ भोजन सहायता', openCarePlus: 'केयर+ खोलें',
  },
} as const;

export type CareFoodKey = keyof typeof copy.en;

export function careFoodT(language: JananiLanguage, key: CareFoodKey): string {
  return copy[language]?.[key] ?? copy.en[key];
}
