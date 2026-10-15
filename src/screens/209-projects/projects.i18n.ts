import type { ScreenTranslations } from '@/i18n/types';

/** Screen 209. Projects: overall progress and the handover and completion record, in three languages. */
const translations: ScreenTranslations = {
  en: { projects: {
  "title": "Projects", "subtitle": "How far each project has come, and the handover record",
  "loading": "Loading projects", "retry": "Try again",
  "error": { "title": "Projects could not load", "body": "Check your connection and try again.", "action": "That could not be done." },
  "empty": { "title": "No projects yet", "body": "A project appears here once work orders are issued for an accepted quote." },
  "progressLabel": "Verified progress",
  "amounts": "{{verified}} verified, {{paid}} paid, of {{total}}",
  "status": { "issued": "Issued", "in_progress": "In progress", "completed": "Completed" },
  "handoverTitle": "Handover and completion record",
  "role": { "customer": "Customer", "installer": "Installer", "qc": "Quality inspector" },
  "you": "you", "signed": "Acknowledged", "waiting": "Waiting",
  "complete": "Handover record complete",
  "notReady": "Handover opens when every earlier milestone has been verified.",
  "qcMissing": "A quality inspector has not been named for the handover milestone yet. The Owner names one on the work order.",
  "acknowledge": "Acknowledge handover",
  "acknowledgedOk": "Handover acknowledged.",
  "notNoc": "This record is acknowledged in the app. It is not an electronic signature and it is not a statutory approval or NOC; those come from the competent authority.",
  "problem": {
    "not_a_party": "You are not one of the parties to this handover.",
    "handover_not_ready": "Earlier milestones must be verified before the handover.",
    "qc_missing": "A quality inspector must be named first.",
    "already_acknowledged": "You have already acknowledged this handover.",
    "handover_unsigned": "The final milestone waits until everyone has acknowledged the handover.",
    "forbidden": "You cannot do that.", "not_found": "That project is not available to you."
  }
} },
  hi: { projects: {
  "title": "प्रोजेक्ट", "subtitle": "हर प्रोजेक्ट कितना आगे बढ़ा, और हैंडओवर रिकॉर्ड",
  "loading": "प्रोजेक्ट लोड हो रहे हैं", "retry": "फिर कोशिश करें",
  "error": { "title": "प्रोजेक्ट लोड नहीं हो सके", "body": "कनेक्शन जाँचें और फिर कोशिश करें।", "action": "यह नहीं हो सका।" },
  "empty": { "title": "अभी कोई प्रोजेक्ट नहीं", "body": "स्वीकृत कोट के लिए वर्क ऑर्डर जारी होने पर प्रोजेक्ट यहाँ दिखेगा।" },
  "progressLabel": "सत्यापित प्रगति",
  "amounts": "{{total}} में से {{verified}} सत्यापित, {{paid}} भुगतान",
  "status": { "issued": "जारी", "in_progress": "जारी है", "completed": "पूरा" },
  "handoverTitle": "हैंडओवर और पूर्णता रिकॉर्ड",
  "role": { "customer": "ग्राहक", "installer": "इंस्टॉलर", "qc": "गुणवत्ता निरीक्षक" },
  "you": "आप", "signed": "स्वीकार किया", "waiting": "प्रतीक्षा",
  "complete": "हैंडओवर रिकॉर्ड पूरा",
  "notReady": "हैंडओवर तब खुलता है जब पहले के सभी चरण सत्यापित हो जाएँ।",
  "qcMissing": "हैंडओवर चरण के लिए अभी गुणवत्ता निरीक्षक नामित नहीं है। मालिक वर्क ऑर्डर पर एक नामित करते हैं।",
  "acknowledge": "हैंडओवर स्वीकार करें",
  "acknowledgedOk": "हैंडओवर स्वीकार किया गया।",
  "notNoc": "यह रिकॉर्ड ऐप में स्वीकार किया जाता है। यह इलेक्ट्रॉनिक हस्ताक्षर नहीं है और न ही कोई वैधानिक अनुमोदन या एनओसी; वे सक्षम प्राधिकरण से आते हैं।",
  "problem": {
    "not_a_party": "आप इस हैंडओवर के पक्षकार नहीं हैं।",
    "handover_not_ready": "हैंडओवर से पहले पिछले चरण सत्यापित होने चाहिए।",
    "qc_missing": "पहले एक गुणवत्ता निरीक्षक नामित होना चाहिए।",
    "already_acknowledged": "आप यह हैंडओवर पहले ही स्वीकार कर चुके हैं।",
    "handover_unsigned": "अंतिम चरण तब तक रुका है जब तक सब हैंडओवर स्वीकार न कर लें।",
    "forbidden": "आप यह नहीं कर सकते।", "not_found": "वह प्रोजेक्ट आपके लिए उपलब्ध नहीं है।"
  }
} },
  mr: { projects: {
  "title": "प्रकल्प", "subtitle": "प्रत्येक प्रकल्प किती पुढे गेला आणि हँडओव्हर नोंद",
  "loading": "प्रकल्प लोड होत आहेत", "retry": "पुन्हा प्रयत्न करा",
  "error": { "title": "प्रकल्प लोड होऊ शकले नाहीत", "body": "कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.", "action": "ते करता आले नाही." },
  "empty": { "title": "अजून प्रकल्प नाही", "body": "मंजूर कोटसाठी वर्क ऑर्डर दिल्यावर प्रकल्प येथे दिसेल." },
  "progressLabel": "पडताळलेली प्रगती",
  "amounts": "{{total}} पैकी {{verified}} पडताळले, {{paid}} भरले",
  "status": { "issued": "दिली", "in_progress": "सुरू आहे", "completed": "पूर्ण" },
  "handoverTitle": "हँडओव्हर आणि पूर्णत्व नोंद",
  "role": { "customer": "ग्राहक", "installer": "इन्स्टॉलर", "qc": "गुणवत्ता निरीक्षक" },
  "you": "तुम्ही", "signed": "स्वीकारले", "waiting": "प्रतीक्षा",
  "complete": "हँडओव्हर नोंद पूर्ण",
  "notReady": "आधीचे सर्व टप्पे पडताळले की हँडओव्हर सुरू होतो.",
  "qcMissing": "हँडओव्हर टप्प्यासाठी अजून गुणवत्ता निरीक्षक नेमलेला नाही. मालक वर्क ऑर्डरवर एक नेमतात.",
  "acknowledge": "हँडओव्हर स्वीकारा",
  "acknowledgedOk": "हँडओव्हर स्वीकारला.",
  "notNoc": "ही नोंद ॲपमध्ये स्वीकारली जाते. ही इलेक्ट्रॉनिक स्वाक्षरी नाही आणि वैधानिक मंजुरी किंवा एनओसीही नाही; त्या सक्षम प्राधिकरणाकडून येतात.",
  "problem": {
    "not_a_party": "तुम्ही या हँडओव्हरचे पक्षकार नाही.",
    "handover_not_ready": "हँडओव्हरपूर्वी आधीचे टप्पे पडताळले पाहिजेत.",
    "qc_missing": "आधी गुणवत्ता निरीक्षक नेमला पाहिजे.",
    "already_acknowledged": "तुम्ही हा हँडओव्हर आधीच स्वीकारला आहे.",
    "handover_unsigned": "सर्वांनी हँडओव्हर स्वीकारेपर्यंत अंतिम टप्पा थांबलेला आहे.",
    "forbidden": "तुम्ही ते करू शकत नाही.", "not_found": "तो प्रकल्प तुमच्यासाठी उपलब्ध नाही."
  }
} },
};

export default translations;
