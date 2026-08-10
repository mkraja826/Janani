import type { JananiLanguage } from '@/i18n';

const en = {
  profileEyebrow: 'PRIVATE HEALTH PROFILE',
  profileTitle: 'Your care context, kept together.',
  pregnancyBody: 'Pregnancy & body', currentWeight: 'Current weight (kg)', pregnancy: 'Pregnancy', activityLevel: 'Activity level',
  foodPreferences: 'Food preferences', foodPattern: 'Food pattern', cuisinePreferences: 'Cuisine preferences', foodAllergies: 'Food allergies or intolerances', foodsAvoided: 'Foods you avoid',
  healthConditions: 'Health conditions', clinicianInstructions: 'Clinician instructions', dietaryActivityInstructions: 'Dietary or activity instructions', saveHealthProfile: 'Save health profile',
  oneBaby: 'One baby', twins: 'Twins', threePlusBabies: '3+ babies', notConfirmed: 'Not confirmed',
  vegetarian: 'Vegetarian', vegetarianEggs: 'Vegetarian + eggs', nonVegetarian: 'Non-vegetarian', vegan: 'Vegan', noPreference: 'No preference',
  activityLow: 'Low', activityModerate: 'Moderate', activityHigh: 'High', doctorRestricted: 'Doctor restricted', notSure: 'Not sure',
  trackerEyebrow: 'PRIVATE HEALTH TRACKER', trackerTitle: 'Keep your readings together.', weight: 'Weight', bloodPressure: 'Blood pressure', glucose: 'Glucose', labResult: 'Lab result', symptom: 'Symptom',
  add: 'Add', systolic: 'Systolic', diastolic: 'Diastolic', pulseOptional: 'Pulse (optional)', symptomsOptional: 'Symptoms at the time (optional)', glucoseMgDl: 'Glucose (mg/dL)', minutesAfterMeal: 'Minutes after meal (optional)',
  fasting: 'Fasting', beforeMeal: 'Before meal', afterMeal: 'After meal', random: 'Random', other: 'Other', testName: 'Test name', result: 'Result', unitOptional: 'Unit (optional)', referenceRangeOptional: 'Reference range from report (optional)',
  severity: 'Severity', durationMinutesOptional: 'Duration in minutes (optional)', contactedCareTeam: 'I contacted my care team', noteOptional: 'Note (optional)', saveEntry: 'Save entry', recentEntries: 'Recent entries', noEntries: 'No entries yet.', deleteEntry: 'Delete entry',
} as const;
export type HealthMessageKey = keyof typeof en;

const te: Record<HealthMessageKey, string> = {
  profileEyebrow: 'వ్యక్తిగత ఆరోగ్య ప్రొఫైల్', profileTitle: 'మీ సంరక్షణ వివరాలు ఒకేచోట.',
  pregnancyBody: 'గర్భధారణ & శరీరం', currentWeight: 'ప్రస్తుత బరువు (kg)', pregnancy: 'గర్భధారణ', activityLevel: 'చురుకుదనం స్థాయి',
  foodPreferences: 'ఆహార అభిరుచులు', foodPattern: 'ఆహార విధానం', cuisinePreferences: 'వంటకాల అభిరుచులు', foodAllergies: 'ఆహార అలర్జీలు లేదా అసహనాలు', foodsAvoided: 'మీరు నివారించే ఆహారాలు',
  healthConditions: 'ఆరోగ్య పరిస్థితులు', clinicianInstructions: 'వైద్యుని సూచనలు', dietaryActivityInstructions: 'ఆహారం లేదా చురుకుదనం సూచనలు', saveHealthProfile: 'ఆరోగ్య ప్రొఫైల్ సేవ్ చేయండి',
  oneBaby: 'ఒక బిడ్డ', twins: 'కవలలు', threePlusBabies: '3+ పిల్లలు', notConfirmed: 'ఇంకా నిర్ధారణ కాలేదు',
  vegetarian: 'శాకాహారం', vegetarianEggs: 'శాకాహారం + గుడ్లు', nonVegetarian: 'మాంసాహారం', vegan: 'వీగన్', noPreference: 'ప్రత్యేక అభిరుచి లేదు',
  activityLow: 'తక్కువ', activityModerate: 'మధ్యస్థ', activityHigh: 'ఎక్కువ', doctorRestricted: 'వైద్యుని పరిమితి', notSure: 'తెలియదు',
  trackerEyebrow: 'వ్యక్తిగత ఆరోగ్య ట్రాకర్', trackerTitle: 'మీ రీడింగులను ఒకేచోట ఉంచండి.', weight: 'బరువు', bloodPressure: 'రక్తపోటు', glucose: 'గ్లూకోజ్', labResult: 'ల్యాబ్ ఫలితం', symptom: 'లక్షణం',
  add: 'జోడించండి', systolic: 'సిస్టాలిక్', diastolic: 'డయాస్టాలిక్', pulseOptional: 'పల్స్ (ఐచ్చికం)', symptomsOptional: 'ఆ సమయంలో లక్షణాలు (ఐచ్చికం)', glucoseMgDl: 'గ్లూకోజ్ (mg/dL)', minutesAfterMeal: 'భోజనం తర్వాత నిమిషాలు (ఐచ్చికం)',
  fasting: 'ఉపవాసం', beforeMeal: 'భోజనం ముందు', afterMeal: 'భోజనం తర్వాత', random: 'యాదృచ్ఛికం', other: 'ఇతర', testName: 'పరీక్ష పేరు', result: 'ఫలితం', unitOptional: 'యూనిట్ (ఐచ్చికం)', referenceRangeOptional: 'రిపోర్ట్‌లోని రిఫరెన్స్ రేంజ్ (ఐచ్చికం)',
  severity: 'తీవ్రత', durationMinutesOptional: 'వ్యవధి నిమిషాల్లో (ఐచ్చికం)', contactedCareTeam: 'నేను నా వైద్య బృందాన్ని సంప్రదించాను', noteOptional: 'గమనిక (ఐచ్చికం)', saveEntry: 'ఎంట్రీ సేవ్ చేయండి', recentEntries: 'ఇటీవలి ఎంట్రీలు', noEntries: 'ఇంకా ఎంట్రీలు లేవు.', deleteEntry: 'ఎంట్రీ తొలగించండి',
};

const hi: Record<HealthMessageKey, string> = {
  profileEyebrow: 'निजी स्वास्थ्य प्रोफ़ाइल', profileTitle: 'आपकी देखभाल की जानकारी एक ही जगह।',
  pregnancyBody: 'गर्भावस्था और शरीर', currentWeight: 'वर्तमान वज़न (kg)', pregnancy: 'गर्भावस्था', activityLevel: 'गतिविधि स्तर',
  foodPreferences: 'भोजन पसंद', foodPattern: 'भोजन का प्रकार', cuisinePreferences: 'खान-पान की पसंद', foodAllergies: 'भोजन एलर्जी या असहिष्णुता', foodsAvoided: 'जिन खाद्य पदार्थों से आप बचती हैं',
  healthConditions: 'स्वास्थ्य स्थितियाँ', clinicianInstructions: 'डॉक्टर के निर्देश', dietaryActivityInstructions: 'भोजन या गतिविधि के निर्देश', saveHealthProfile: 'स्वास्थ्य प्रोफ़ाइल सेव करें',
  oneBaby: 'एक बच्चा', twins: 'जुड़वाँ', threePlusBabies: '3+ बच्चे', notConfirmed: 'अभी पुष्टि नहीं हुई',
  vegetarian: 'शाकाहारी', vegetarianEggs: 'शाकाहारी + अंडे', nonVegetarian: 'मांसाहारी', vegan: 'वीगन', noPreference: 'कोई विशेष पसंद नहीं',
  activityLow: 'कम', activityModerate: 'मध्यम', activityHigh: 'अधिक', doctorRestricted: 'डॉक्टर द्वारा सीमित', notSure: 'पता नहीं',
  trackerEyebrow: 'निजी स्वास्थ्य ट्रैकर', trackerTitle: 'अपनी रीडिंग एक ही जगह रखें।', weight: 'वज़न', bloodPressure: 'ब्लड प्रेशर', glucose: 'ग्लूकोज़', labResult: 'लैब परिणाम', symptom: 'लक्षण',
  add: 'जोड़ें', systolic: 'सिस्टोलिक', diastolic: 'डायस्टोलिक', pulseOptional: 'पल्स (वैकल्पिक)', symptomsOptional: 'उस समय के लक्षण (वैकल्पिक)', glucoseMgDl: 'ग्लूकोज़ (mg/dL)', minutesAfterMeal: 'भोजन के बाद मिनट (वैकल्पिक)',
  fasting: 'फास्टिंग', beforeMeal: 'भोजन से पहले', afterMeal: 'भोजन के बाद', random: 'रैंडम', other: 'अन्य', testName: 'टेस्ट का नाम', result: 'परिणाम', unitOptional: 'यूनिट (वैकल्पिक)', referenceRangeOptional: 'रिपोर्ट की रेफरेंस रेंज (वैकल्पिक)',
  severity: 'तीव्रता', durationMinutesOptional: 'अवधि मिनटों में (वैकल्पिक)', contactedCareTeam: 'मैंने अपनी केयर टीम से संपर्क किया', noteOptional: 'नोट (वैकल्पिक)', saveEntry: 'एंट्री सेव करें', recentEntries: 'हाल की एंट्री', noEntries: 'अभी कोई एंट्री नहीं है।', deleteEntry: 'एंट्री हटाएँ',
};

const messages: Record<JananiLanguage, Record<HealthMessageKey, string>> = { en, te, hi };
export function healthT(language: JananiLanguage, key: HealthMessageKey): string { return messages[language]?.[key] ?? en[key]; }
