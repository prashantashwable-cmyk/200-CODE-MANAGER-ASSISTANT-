import type { ScreenTranslations } from '@/i18n/types';

/** Screen 202. The Owner's home, in three languages. */
const translations: ScreenTranslations = {
  en: { ownerHome: {
  "title": "Owner home",
  "subtitle": "Welcome, {{name}}. Here is what needs you.",
  "openDesk": "Open Decision Desk",
  "loading": "Loading…",
  "needs": "Needs your decision",
  "stat": {
    "pending": "Waiting for you",
    "waiting": "Waiting for information",
    "chain": "Decision record",
    "chainNote": "Checked each time you open this page"
  },
  "chain": {
    "ok": "Intact · {{n}} entries",
    "broken": "Broken: review needed"
  },
  "empty": {
    "title": "Nothing needs you",
    "body": "You are up to date."
  },
  "error": {
    "title": "We could not open your home",
    "body": "Nothing was changed. Try again.",
    "retry": "Try again"
  }
} },
  hi: { ownerHome: {
  "title": "मालिक होम",
  "subtitle": "स्वागत है, {{name}}। यह है जिसमें आपकी ज़रूरत है।",
  "openDesk": "निर्णय डेस्क खोलें",
  "loading": "लोड हो रहा है…",
  "needs": "आपके निर्णय की प्रतीक्षा",
  "stat": {
    "pending": "आपका इंतज़ार",
    "waiting": "जानकारी का इंतज़ार",
    "chain": "निर्णय रिकॉर्ड",
    "chainNote": "हर बार इस पेज को खोलने पर जाँचा जाता है"
  },
  "chain": {
    "ok": "सुरक्षित · {{n}} प्रविष्टियाँ",
    "broken": "टूटा हुआ: समीक्षा आवश्यक"
  },
  "empty": {
    "title": "आपकी ज़रूरत नहीं है",
    "body": "आप अद्यतन हैं।"
  },
  "error": {
    "title": "हम आपका होम नहीं खोल सके",
    "body": "कुछ नहीं बदला। फिर कोशिश करें।",
    "retry": "फिर कोशिश करें"
  }
} },
  mr: { ownerHome: {
  "title": "मालक होम",
  "subtitle": "स्वागत, {{name}}. येथे तुमची गरज असलेल्या गोष्टी आहेत.",
  "openDesk": "निर्णय डेस्क उघडा",
  "loading": "लोड होत आहे…",
  "needs": "तुमच्या निर्णयाची प्रतीक्षा",
  "stat": {
    "pending": "तुमची प्रतीक्षा",
    "waiting": "माहितीची प्रतीक्षा",
    "chain": "निर्णय नोंद",
    "chainNote": "हे पान उघडताना प्रत्येक वेळी तपासले जाते"
  },
  "chain": {
    "ok": "सुरक्षित · {{n}} नोंदी",
    "broken": "तुटलेले: पुनरावलोकन आवश्यक"
  },
  "empty": {
    "title": "तुमची गरज नाही",
    "body": "तुम्ही अद्ययावत आहात."
  },
  "error": {
    "title": "आम्ही तुमचे होम उघडू शकलो नाही",
    "body": "काहीही बदलले नाही. पुन्हा प्रयत्न करा.",
    "retry": "पुन्हा प्रयत्न करा"
  }
} },
};

export default translations;
