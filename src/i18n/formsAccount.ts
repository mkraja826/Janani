import type { JananiLanguage } from './index';

const copy = {
  en: {
    settingsEyebrow: 'SETTINGS & ACCOUNT', settingsTitle: 'Your choices stay yours', yourData: 'Your data', familyConnection: 'Family connection', safetyPrivacy: 'Safety & privacy', motherAccount: 'Mother account', partnerAccount: 'Partner account', noFamilyLinked: 'No family linked', tryAgain: 'Try again',
    newReminderEyebrow: 'NEW CARE ROUTINE', newReminderTitle: 'What shall I remember?', type: 'Type', medicine: 'Medicine', water: 'Water', appointment: 'Appointment', nutrition: 'Nutrition', other: 'Other', medicineName: 'Medicine name', reminderTitle: 'Reminder title', instructionsOptional: 'Instructions (optional)', preferredDailyTime: 'Preferred daily time', forHowManyDays: 'For how many days', saveDailyReminder: 'Save daily reminder',
    editReminderEyebrow: 'EDIT CARE ROUTINE', editReminderTitle: 'Keep it accurate', instructions: 'Instructions', dailyTime: 'Daily time', saveAndReschedule: 'Save and reschedule',
    newMemoryEyebrow: 'NEW MEMORY', newMemoryTitle: 'What is in your heart today?', memoryDate: 'Memory date', howDayFeels: 'How does that day feel?', title: 'Title', optional: '(optional)', yourWords: 'Your words', sharedWithPartner: 'Shared with partner', privateEntry: 'Private entry', partnerCanRead: 'Your linked partner can read this entry.', onlyYouCanRead: 'Only you can read this entry.', keepMemory: 'Keep this memory',
    moodLow: 'Low', moodHeavy: 'Heavy', moodCalm: 'Calm', moodGood: 'Good', moodJoyful: 'Joyful',
    editMemoryEyebrow: 'EDIT MEMORY', editMemoryTitle: 'Your words, your choice', howDidYouFeel: 'How did you feel?', entry: 'Entry', shareWithPartner: 'Share with partner', makePrivateAgain: 'Turn this off to make the entry private again.', saveChanges: 'Save changes',
  },
  te: {
    settingsEyebrow: 'సెట్టింగ్స్ & ఖాతా', settingsTitle: 'మీ ఎంపికలు మీవే', yourData: 'మీ డేటా', familyConnection: 'కుటుంబ అనుసంధానం', safetyPrivacy: 'భద్రత & గోప్యత', motherAccount: 'తల్లి ఖాతా', partnerAccount: 'భాగస్వామి ఖాతా', noFamilyLinked: 'కుటుంబం అనుసంధానించబడలేదు', tryAgain: 'మళ్లీ ప్రయత్నించండి',
    newReminderEyebrow: 'కొత్త సంరక్షణ రూటీన్', newReminderTitle: 'నేను ఏమి గుర్తుంచుకోవాలి?', type: 'రకం', medicine: 'మందు', water: 'నీరు', appointment: 'అపాయింట్‌మెంట్', nutrition: 'పోషణ', other: 'ఇతర', medicineName: 'మందు పేరు', reminderTitle: 'రిమైండర్ శీర్షిక', instructionsOptional: 'సూచనలు (ఐచ్చికం)', preferredDailyTime: 'ఇష్టమైన రోజువారీ సమయం', forHowManyDays: 'ఎన్ని రోజులు', saveDailyReminder: 'రోజువారీ రిమైండర్ సేవ్ చేయండి',
    editReminderEyebrow: 'సంరక్షణ రూటీన్ సవరించండి', editReminderTitle: 'వివరాలను ఖచ్చితంగా ఉంచండి', instructions: 'సూచనలు', dailyTime: 'రోజువారీ సమయం', saveAndReschedule: 'సేవ్ చేసి మళ్లీ షెడ్యూల్ చేయండి',
    newMemoryEyebrow: 'కొత్త జ్ఞాపకం', newMemoryTitle: 'ఈ రోజు మీ మనసులో ఏముంది?', memoryDate: 'జ్ఞాపక తేదీ', howDayFeels: 'ఆ రోజు ఎలా అనిపించింది?', title: 'శీర్షిక', optional: '(ఐచ్చికం)', yourWords: 'మీ మాటలు', sharedWithPartner: 'భాగస్వామితో పంచుకున్నారు', privateEntry: 'వ్యక్తిగత నమోదు', partnerCanRead: 'మీ అనుసంధానిత భాగస్వామి ఈ నమోదును చదవగలరు.', onlyYouCanRead: 'ఈ నమోదును మీరు మాత్రమే చదవగలరు.', keepMemory: 'ఈ జ్ఞాపకాన్ని దాచుకోండి',
    moodLow: 'తక్కువ', moodHeavy: 'భారం', moodCalm: 'ప్రశాంతం', moodGood: 'బాగుంది', moodJoyful: 'ఆనందం',
    editMemoryEyebrow: 'జ్ఞాపకాన్ని సవరించండి', editMemoryTitle: 'మీ మాటలు, మీ ఎంపిక', howDidYouFeel: 'మీకు ఎలా అనిపించింది?', entry: 'నమోదు', shareWithPartner: 'భాగస్వామితో పంచుకోండి', makePrivateAgain: 'ఈ నమోదును మళ్లీ వ్యక్తిగతంగా చేయడానికి దీన్ని ఆఫ్ చేయండి.', saveChanges: 'మార్పులను సేవ్ చేయండి',
  },
  hi: {
    settingsEyebrow: 'सेटिंग्स और खाता', settingsTitle: 'आपकी पसंद आपकी है', yourData: 'आपका डेटा', familyConnection: 'परिवार कनेक्शन', safetyPrivacy: 'सुरक्षा और गोपनीयता', motherAccount: 'माँ का खाता', partnerAccount: 'साथी का खाता', noFamilyLinked: 'कोई परिवार लिंक नहीं है', tryAgain: 'फिर कोशिश करें',
    newReminderEyebrow: 'नई देखभाल दिनचर्या', newReminderTitle: 'मैं क्या याद रखूँ?', type: 'प्रकार', medicine: 'दवा', water: 'पानी', appointment: 'अपॉइंटमेंट', nutrition: 'पोषण', other: 'अन्य', medicineName: 'दवा का नाम', reminderTitle: 'रिमाइंडर शीर्षक', instructionsOptional: 'निर्देश (वैकल्पिक)', preferredDailyTime: 'पसंदीदा रोज़ का समय', forHowManyDays: 'कितने दिनों के लिए', saveDailyReminder: 'दैनिक रिमाइंडर सेव करें',
    editReminderEyebrow: 'देखभाल दिनचर्या संपादित करें', editReminderTitle: 'इसे सही रखें', instructions: 'निर्देश', dailyTime: 'रोज़ का समय', saveAndReschedule: 'सेव करें और फिर शेड्यूल करें',
    newMemoryEyebrow: 'नई याद', newMemoryTitle: 'आज आपके मन में क्या है?', memoryDate: 'याद की तारीख', howDayFeels: 'उस दिन कैसा महसूस हुआ?', title: 'शीर्षक', optional: '(वैकल्पिक)', yourWords: 'आपके शब्द', sharedWithPartner: 'साथी के साथ साझा', privateEntry: 'निजी प्रविष्टि', partnerCanRead: 'आपका जुड़ा साथी यह प्रविष्टि पढ़ सकता है।', onlyYouCanRead: 'यह प्रविष्टि केवल आप पढ़ सकती हैं।', keepMemory: 'इस याद को सँजोएँ',
    moodLow: 'कम', moodHeavy: 'भारी', moodCalm: 'शांत', moodGood: 'अच्छा', moodJoyful: 'खुश',
    editMemoryEyebrow: 'याद संपादित करें', editMemoryTitle: 'आपके शब्द, आपकी पसंद', howDidYouFeel: 'आपको कैसा लगा?', entry: 'प्रविष्टि', shareWithPartner: 'साथी के साथ साझा करें', makePrivateAgain: 'इसे बंद करके प्रविष्टि को फिर निजी बनाएँ।', saveChanges: 'बदलाव सेव करें',
  },
} as const;

export type FormsAccountCopy = (typeof copy)['en'];
export function formsAccountCopy(language: JananiLanguage): FormsAccountCopy {
  return copy[language] as FormsAccountCopy;
}
