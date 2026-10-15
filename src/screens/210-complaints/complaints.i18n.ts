import type { ScreenTranslations } from '@/i18n/types';

/** Screen 210. Complaints and service tracking, in three languages. */
const translations: ScreenTranslations = {
  en: { complaints: {
  "title": "Complaints", "subtitle": "Tell us what went wrong, and follow what is done about it",
  "loading": "Loading complaints", "retry": "Try again",
  "error": { "title": "Complaints could not load", "body": "Check your connection and try again.", "action": "That could not be done." },
  "empty": { "title": "No complaints", "customer": "If something goes wrong with your project, you can raise it here.", "other": "Nothing has been raised." },
  "raiseTitle": "Raise a complaint", "project": "Project", "chooseProject": "Choose a project", "about": "About which order", "aboutAll": "The whole project",
  "category": "What kind of problem", "describe": "What happened", "describeHint": "At least {{min}} letters. Say what, where and since when.",
  "safetyNote": "If anyone is in danger right now, stop using the lift and call the emergency number first. We aim to look at safety complaints within 4 hours.",
  "raise": "Send complaint", "raisedOk": "Complaint sent. You will see its progress here.",
  "categories": { "defect": "A defect", "delay": "A delay", "payment": "Payment", "safety": "Safety", "conduct": "Conduct", "other": "Something else" },
  "status": { "open": "Waiting", "acknowledged": "Being looked at", "resolved": "Resolved" },
  "overdue": "Overdue to acknowledge", "raisedOn": "Raised {{date}}", "dueBy": "To be acknowledged by {{date}}",
  "acknowledge": "Acknowledge", "acknowledgedOk": "Acknowledged.",
  "outcomeLabel": "Outcome", "noteLabel": "What was decided", "noteHint": "The customer reads this. At least {{min}} letters.", "resolve": "Resolve", "resolvedOk": "Resolved.",
  "outcome": { "upheld": "Upheld", "not_upheld": "Not upheld", "settled": "Settled" },
  "partnerRecord": "Partner record", "trustCounts": "{{verified}} verified milestones, {{raised}} complaints, {{upheld}} upheld",
  "trust": { "no_record": "Nothing on record yet.", "clean": "No complaint upheld.", "watch": "At least one complaint upheld." },
  "problem": {
    "category_invalid": "Choose what kind of problem it is.", "text_short": "Say a little more about what happened.", "text_long": "Please keep it under 1000 letters.",
    "not_open": "It has already been acknowledged.", "not_acknowledged": "Acknowledge it first.", "outcome_invalid": "Choose an outcome.", "note_short": "Write what was decided, in a few words.",
    "locked": "A resolved complaint cannot change.", "forbidden": "You cannot do that.", "not_found": "That is not available to you.", "invalid_state": "That cannot be done in this state."
  }
} },
  hi: { complaints: {
  "title": "शिकायतें", "subtitle": "बताइए क्या गड़बड़ हुई, और देखिए उस पर क्या हो रहा है",
  "loading": "शिकायतें लोड हो रही हैं", "retry": "फिर कोशिश करें",
  "error": { "title": "शिकायतें लोड नहीं हो सकीं", "body": "कनेक्शन जाँचें और फिर कोशिश करें।", "action": "यह नहीं हो सका।" },
  "empty": { "title": "कोई शिकायत नहीं", "customer": "आपके प्रोजेक्ट में कुछ गड़बड़ हो तो आप यहाँ बता सकते हैं।", "other": "कुछ दर्ज नहीं हुआ है।" },
  "raiseTitle": "शिकायत दर्ज करें", "project": "प्रोजेक्ट", "chooseProject": "प्रोजेक्ट चुनें", "about": "किस ऑर्डर के बारे में", "aboutAll": "पूरा प्रोजेक्ट",
  "category": "किस तरह की समस्या", "describe": "क्या हुआ", "describeHint": "कम से कम {{min}} अक्षर। क्या, कहाँ और कब से, बताइए।",
  "safetyNote": "अगर अभी किसी को ख़तरा है तो लिफ्ट का इस्तेमाल बंद करें और पहले आपातकालीन नंबर पर कॉल करें। हम सुरक्षा की शिकायतों को 4 घंटे में देखने का लक्ष्य रखते हैं।",
  "raise": "शिकायत भेजें", "raisedOk": "शिकायत भेज दी गई। इसकी प्रगति यहाँ दिखेगी।",
  "categories": { "defect": "ख़राबी", "delay": "देरी", "payment": "भुगतान", "safety": "सुरक्षा", "conduct": "व्यवहार", "other": "कुछ और" },
  "status": { "open": "प्रतीक्षा में", "acknowledged": "देखी जा रही है", "resolved": "सुलझी" },
  "overdue": "स्वीकार करने में देरी", "raisedOn": "{{date}} को दर्ज", "dueBy": "{{date}} तक स्वीकार होनी है",
  "acknowledge": "स्वीकार करें", "acknowledgedOk": "स्वीकार की गई।",
  "outcomeLabel": "नतीजा", "noteLabel": "क्या तय हुआ", "noteHint": "ग्राहक इसे पढ़ेगा। कम से कम {{min}} अक्षर।", "resolve": "सुलझाएँ", "resolvedOk": "सुलझाई गई।",
  "outcome": { "upheld": "सही पाई गई", "not_upheld": "सही नहीं पाई गई", "settled": "आपसी समझौता" },
  "partnerRecord": "पार्टनर का रिकॉर्ड", "trustCounts": "{{verified}} सत्यापित चरण, {{raised}} शिकायतें, {{upheld}} सही पाई गईं",
  "trust": { "no_record": "अभी कुछ दर्ज नहीं।", "clean": "कोई शिकायत सही नहीं पाई गई।", "watch": "कम से कम एक शिकायत सही पाई गई।" },
  "problem": {
    "category_invalid": "समस्या का प्रकार चुनें।", "text_short": "क्या हुआ, थोड़ा और बताइए।", "text_long": "कृपया 1000 अक्षरों से कम रखें।",
    "not_open": "इसे पहले ही स्वीकार किया जा चुका है।", "not_acknowledged": "पहले इसे स्वीकार करें।", "outcome_invalid": "नतीजा चुनें।", "note_short": "कुछ शब्दों में लिखें कि क्या तय हुआ।",
    "locked": "सुलझी हुई शिकायत बदल नहीं सकती।", "forbidden": "आप यह नहीं कर सकते।", "not_found": "यह आपके लिए उपलब्ध नहीं है।", "invalid_state": "इस स्थिति में यह नहीं हो सकता।"
  }
} },
  mr: { complaints: {
  "title": "तक्रारी", "subtitle": "काय चुकले ते सांगा, आणि त्यावर काय होत आहे ते पहा",
  "loading": "तक्रारी लोड होत आहेत", "retry": "पुन्हा प्रयत्न करा",
  "error": { "title": "तक्रारी लोड होऊ शकल्या नाहीत", "body": "कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.", "action": "ते करता आले नाही." },
  "empty": { "title": "तक्रार नाही", "customer": "तुमच्या प्रकल्पात काही बिघडले तर तुम्ही ते येथे कळवू शकता.", "other": "काहीही नोंदवलेले नाही." },
  "raiseTitle": "तक्रार नोंदवा", "project": "प्रकल्प", "chooseProject": "प्रकल्प निवडा", "about": "कोणत्या ऑर्डरबद्दल", "aboutAll": "संपूर्ण प्रकल्प",
  "category": "कोणत्या प्रकारची समस्या", "describe": "काय झाले", "describeHint": "किमान {{min}} अक्षरे. काय, कुठे आणि केव्हापासून ते सांगा.",
  "safetyNote": "आत्ता कोणाला धोका असेल तर लिफ्ट वापरणे थांबवा आणि आधी आपत्कालीन क्रमांकावर कॉल करा. सुरक्षेच्या तक्रारी 4 तासांत पाहण्याचे आमचे लक्ष्य आहे.",
  "raise": "तक्रार पाठवा", "raisedOk": "तक्रार पाठवली. तिची प्रगती येथे दिसेल.",
  "categories": { "defect": "बिघाड", "delay": "उशीर", "payment": "पेमेंट", "safety": "सुरक्षा", "conduct": "वर्तन", "other": "दुसरे काही" },
  "status": { "open": "प्रतीक्षेत", "acknowledged": "पाहिली जात आहे", "resolved": "सुटली" },
  "overdue": "स्वीकारण्यास उशीर", "raisedOn": "{{date}} रोजी नोंदवली", "dueBy": "{{date}} पर्यंत स्वीकारायची आहे",
  "acknowledge": "स्वीकारा", "acknowledgedOk": "स्वीकारली.",
  "outcomeLabel": "निकाल", "noteLabel": "काय ठरले", "noteHint": "ग्राहक हे वाचेल. किमान {{min}} अक्षरे.", "resolve": "सोडवा", "resolvedOk": "सोडवली.",
  "outcome": { "upheld": "योग्य ठरली", "not_upheld": "योग्य ठरली नाही", "settled": "तडजोड झाली" },
  "partnerRecord": "पार्टनरची नोंद", "trustCounts": "{{verified}} पडताळलेले टप्पे, {{raised}} तक्रारी, {{upheld}} योग्य ठरल्या",
  "trust": { "no_record": "अजून काही नोंद नाही.", "clean": "एकही तक्रार योग्य ठरलेली नाही.", "watch": "किमान एक तक्रार योग्य ठरली आहे." },
  "problem": {
    "category_invalid": "समस्येचा प्रकार निवडा.", "text_short": "काय झाले ते थोडे अधिक सांगा.", "text_long": "कृपया 1000 अक्षरांपेक्षा कमी ठेवा.",
    "not_open": "ती आधीच स्वीकारली आहे.", "not_acknowledged": "आधी ती स्वीकारा.", "outcome_invalid": "निकाल निवडा.", "note_short": "काय ठरले ते काही शब्दांत लिहा.",
    "locked": "सुटलेली तक्रार बदलता येत नाही.", "forbidden": "तुम्ही ते करू शकत नाही.", "not_found": "ते तुमच्यासाठी उपलब्ध नाही.", "invalid_state": "या स्थितीत ते करता येत नाही."
  }
} },
};

export default translations;
