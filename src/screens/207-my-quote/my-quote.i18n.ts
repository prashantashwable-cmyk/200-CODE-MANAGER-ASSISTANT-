import type { ScreenTranslations } from '@/i18n/types';

/** Screen 207. The customer's own quote, in three languages. */
const translations: ScreenTranslations = {
  en: { myQuote: {
  "title": "Your quote",
  "disclosure": "Your contract is with each named partner below. The platform facilitates and charges its own fee, shown separately. You accept each part on its own.",
  "loading": "Loading your quote…",
  "retry": "Try again",
  "error": {
    "title": "Your quote did not load",
    "body": "Check your connection and try again.",
    "accept": "Could not record your choice. Please try again."
  },
  "empty": {
    "title": "No quote yet",
    "body": "When we send you a quote, it will appear here."
  },
  "parts": "What each partner will do",
  "partsNote": "Each price is the partner's own. Tick the parts you accept.",
  "kinds": {
    "material": "Material",
    "installation": "Installation",
    "logistics": "Logistics",
    "amc": "AMC",
    "statutory": "Statutory fee (passed on as is)"
  },
  "accept": "I accept {{partner}}",
  "acceptedOn": "Accepted {{date}}",
  "accepted": "Your choice is recorded.",
  "acceptSelected": "Accept selected ({{count}})",
  "allAccepted": "You have accepted every part.",
  "platformFee": "Platform fee",
  "feeLine": "Facilitation fee",
  "feeNote": "What the platform charges for introducing, standardising and checking the work.",
  "discountApplied": "A discount of {{amount}} is already taken off this fee.",
  "gst": "GST on the fee",
  "total": "Your total",
  "partnersTotal": "Partners' prices",
  "grand": "Total to pay",
  "token": "Booking token",
  "tokenNote": "Paid to the platform to book, and credited against the fee."
} },
  hi: { myQuote: {
  "title": "आपका कोटेशन",
  "disclosure": "आपका अनुबंध नीचे दिए हर नामित पार्टनर के साथ है। प्लैटफ़ॉर्म सुविधा देता है और अपनी फ़ीस अलग से लेता है। आप हर हिस्सा अलग से स्वीकार करते हैं।",
  "loading": "आपका कोटेशन लोड हो रहा है…",
  "retry": "फिर कोशिश करें",
  "error": {
    "title": "आपका कोटेशन लोड नहीं हुआ",
    "body": "कनेक्शन जाँचें और फिर कोशिश करें।",
    "accept": "आपकी पसंद दर्ज नहीं हो सकी। कृपया फिर कोशिश करें।"
  },
  "empty": {
    "title": "अभी कोई कोटेशन नहीं",
    "body": "जब हम आपको कोटेशन भेजेंगे, वह यहाँ दिखेगा।"
  },
  "parts": "हर पार्टनर क्या करेगा",
  "partsNote": "हर कीमत पार्टनर की अपनी है। जो हिस्से स्वीकार हैं उन पर निशान लगाएँ।",
  "kinds": {
    "material": "सामग्री",
    "installation": "इंस्टॉलेशन",
    "logistics": "लॉजिस्टिक्स",
    "amc": "AMC",
    "statutory": "सरकारी शुल्क (जैसा है वैसा आगे)"
  },
  "accept": "मैं {{partner}} स्वीकार करता/करती हूँ",
  "acceptedOn": "{{date}} को स्वीकार",
  "accepted": "आपकी पसंद दर्ज हो गई।",
  "acceptSelected": "चुने हुए स्वीकार करें ({{count}})",
  "allAccepted": "आपने हर हिस्सा स्वीकार कर लिया है।",
  "platformFee": "प्लैटफ़ॉर्म फ़ीस",
  "feeLine": "सुविधा फ़ीस",
  "feeNote": "काम को जोड़ने, मानक बनाने और जाँचने के लिए प्लैटफ़ॉर्म जो लेता है।",
  "discountApplied": "इस फ़ीस में से {{amount}} की छूट पहले ही घटाई जा चुकी है।",
  "gst": "फ़ीस पर GST",
  "total": "आपका कुल",
  "partnersTotal": "पार्टनरों की कीमतें",
  "grand": "कुल देय",
  "token": "बुकिंग टोकन",
  "tokenNote": "बुकिंग के लिए प्लैटफ़ॉर्म को दिया जाता है और फ़ीस में समायोजित होता है।"
} },
  mr: { myQuote: {
  "title": "तुमचे कोटेशन",
  "disclosure": "तुमचा करार खाली दिलेल्या प्रत्येक नाव असलेल्या पार्टनरसोबत आहे. प्लॅटफॉर्म सुविधा देते आणि स्वतःची फी वेगळी आकारते. तुम्ही प्रत्येक भाग वेगळा स्वीकारता.",
  "loading": "तुमचे कोटेशन लोड होत आहे…",
  "retry": "पुन्हा प्रयत्न करा",
  "error": {
    "title": "तुमचे कोटेशन लोड झाले नाही",
    "body": "कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.",
    "accept": "तुमची निवड नोंदवता आली नाही. कृपया पुन्हा प्रयत्न करा."
  },
  "empty": {
    "title": "अजून कोटेशन नाही",
    "body": "आम्ही तुम्हाला कोटेशन पाठवले की ते येथे दिसेल."
  },
  "parts": "प्रत्येक पार्टनर काय करेल",
  "partsNote": "प्रत्येक किंमत पार्टनरची स्वतःची आहे. तुम्हाला मान्य असलेल्या भागांवर खूण करा.",
  "kinds": {
    "material": "साहित्य",
    "installation": "इन्स्टॉलेशन",
    "logistics": "लॉजिस्टिक्स",
    "amc": "AMC",
    "statutory": "सरकारी शुल्क (जसे आहे तसे पुढे)"
  },
  "accept": "मी {{partner}} स्वीकारतो/स्वीकारते",
  "acceptedOn": "{{date}} रोजी स्वीकारले",
  "accepted": "तुमची निवड नोंदवली गेली.",
  "acceptSelected": "निवडलेले स्वीकारा ({{count}})",
  "allAccepted": "तुम्ही प्रत्येक भाग स्वीकारला आहे.",
  "platformFee": "प्लॅटफॉर्म फी",
  "feeLine": "सुविधा फी",
  "feeNote": "काम जोडणे, प्रमाणित करणे आणि तपासणे यासाठी प्लॅटफॉर्म जे आकारते.",
  "discountApplied": "या फीमधून {{amount}} ची सवलत आधीच वजा केली आहे.",
  "gst": "फीवर GST",
  "total": "तुमची एकूण रक्कम",
  "partnersTotal": "पार्टनरांच्या किंमती",
  "grand": "एकूण देय",
  "token": "बुकिंग टोकन",
  "tokenNote": "बुकिंगसाठी प्लॅटफॉर्मला दिले जाते आणि फीमध्ये समायोजित होते."
} },
};

export default translations;
