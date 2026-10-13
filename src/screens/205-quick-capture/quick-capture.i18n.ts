import type { ScreenTranslations } from '@/i18n/types';

/** Screen 205. Quick capture with the offline queue, in three languages. */
const translations: ScreenTranslations = {
  en: { quickCapture: {
    "pinByHand": "Pin placed by hand. GPS accuracy is not recorded.",
  "title": "Capture a site",
  "subtitle": "Drop a pin, name the site, save. It works without signal and sends itself later.",
  "offline": "No signal: captures wait on this phone",
  "waiting": "{{count}} waiting to send",
  "mapLabel": "Map to place the site pin",
  "pinLabel": "New site",
  "useMyLocation": "Use my location",
  "pinSet": "Pin set. GPS accuracy about {{acc}} m.",
  "tapMap": "Tap the map to place the pin, or use your location.",
  "locationDenied": "We could not get your location. Tap the map instead.",
  "poorFix": "GPS is weak here ({{m}} m). You can still save it; it is marked for a check.",
  "formTitle": "Site details",
  "siteName": "Site or project name",
  "contactName": "Contact person",
  "contactPhone": "Contact mobile number",
  "phoneHint": "10 digits, starting with 6 to 9",
  "city": "City",
  "save": "Save capture",
  "results": "Result",
  "onPhone": "On this phone",
  "clearSent": "Clear sent",
  "capturedAt": "Captured {{when}}",
  "retry": "Try again",
  "discard": "Discard",
  "status": {
    "pending": "Waiting",
    "synced": "Sent",
    "failed": "Needs you",
    "conflict": "Needs a decision"
  },
  "outcome": {
    "claimed": "Saved as a new lead, {{code}}. It is yours.",
    "supporting": "This site was already captured ({{code}}). Yours is kept as supporting evidence, so nothing is lost.",
    "review": "Two captures of this site were too close to tell who was first. The Owner will decide. Yours is saved as {{code}}."
  },
  "error": {
    "site": "Give the site a name.",
    "phone": "Enter a 10-digit mobile number, or leave it empty.",
    "point": "Place the pin first.",
    "generic": "It could not be sent yet. It stays on the phone.",
    "offline": "No signal",
    "forbidden": "You cannot capture for this account.",
    "location_invalid": "The pin is not a real place. Move it.",
    "site_name_required": "Give the site a name.",
    "timeout": "Timed out. It will try again.",
    "network": "Network problem. It will try again."
  }
} },
  hi: { quickCapture: {
    "pinByHand": "पिन हाथ से लगाया गया। GPS सटीकता दर्ज नहीं हुई।",
  "title": "साइट दर्ज करें",
  "subtitle": "पिन लगाएँ, साइट का नाम लिखें, सहेजें। यह बिना सिग्नल के भी चलता है और बाद में खुद भेज देता है।",
  "offline": "सिग्नल नहीं: दर्ज की गई साइटें इस फ़ोन पर रुकी हैं",
  "waiting": "{{count}} भेजने के लिए रुकी हैं",
  "mapLabel": "साइट का पिन लगाने के लिए नक्शा",
  "pinLabel": "नई साइट",
  "useMyLocation": "मेरी लोकेशन इस्तेमाल करें",
  "pinSet": "पिन लग गया। GPS सटीकता लगभग {{acc}} मीटर।",
  "tapMap": "पिन लगाने के लिए नक्शे पर टैप करें, या अपनी लोकेशन इस्तेमाल करें।",
  "locationDenied": "हम आपकी लोकेशन नहीं ले सके। इसके बजाय नक्शे पर टैप करें।",
  "poorFix": "यहाँ GPS कमज़ोर है ({{m}} मीटर)। आप फिर भी सहेज सकते हैं; इसे जाँच के लिए चिह्नित किया जाएगा।",
  "formTitle": "साइट का विवरण",
  "siteName": "साइट या प्रोजेक्ट का नाम",
  "contactName": "संपर्क व्यक्ति",
  "contactPhone": "संपर्क मोबाइल नंबर",
  "phoneHint": "10 अंक, 6 से 9 से शुरू",
  "city": "शहर",
  "save": "दर्ज सहेजें",
  "results": "परिणाम",
  "onPhone": "इस फ़ोन पर",
  "clearSent": "भेजे गए हटाएँ",
  "capturedAt": "दर्ज किया {{when}}",
  "retry": "फिर कोशिश करें",
  "discard": "हटाएँ",
  "status": {
    "pending": "प्रतीक्षा में",
    "synced": "भेजा गया",
    "failed": "आपकी ज़रूरत है",
    "conflict": "निर्णय चाहिए"
  },
  "outcome": {
    "claimed": "नई लीड {{code}} के रूप में सहेजा गया। यह आपकी है।",
    "supporting": "यह साइट पहले ही दर्ज हो चुकी है ({{code}})। आपकी प्रविष्टि सहायक प्रमाण के रूप में रखी गई है, कुछ नहीं खोया।",
    "review": "इस साइट की दो प्रविष्टियाँ इतनी पास थीं कि पहले कौन था यह नहीं कहा जा सकता। मालिक निर्णय लेंगे। आपकी {{code}} के रूप में सहेजी गई है।"
  },
  "error": {
    "site": "साइट का नाम दें।",
    "phone": "10 अंकों का मोबाइल नंबर लिखें, या खाली छोड़ दें।",
    "point": "पहले पिन लगाएँ।",
    "generic": "अभी भेजा नहीं जा सका। यह फ़ोन पर रहता है।",
    "offline": "सिग्नल नहीं",
    "forbidden": "आप इस खाते के लिए दर्ज नहीं कर सकते।",
    "location_invalid": "पिन असली जगह नहीं है। इसे हटाएँ।",
    "site_name_required": "साइट का नाम दें।",
    "timeout": "समय समाप्त। यह फिर कोशिश करेगा।",
    "network": "नेटवर्क में समस्या। यह फिर कोशिश करेगा।"
  }
} },
  mr: { quickCapture: {
    "pinByHand": "पिन हाताने लावला. GPS अचूकता नोंदवली नाही.",
  "title": "साइट नोंदवा",
  "subtitle": "पिन लावा, साइटचे नाव लिहा, जतन करा. सिग्नलशिवायही चालते आणि नंतर आपोआप पाठवते.",
  "offline": "सिग्नल नाही: नोंदवलेल्या साइट्स या फोनवर थांबल्या आहेत",
  "waiting": "{{count}} पाठवण्यासाठी थांबल्या आहेत",
  "mapLabel": "साइटचा पिन लावण्यासाठी नकाशा",
  "pinLabel": "नवीन साइट",
  "useMyLocation": "माझे स्थान वापरा",
  "pinSet": "पिन लावला. GPS अचूकता सुमारे {{acc}} मीटर.",
  "tapMap": "पिन लावण्यासाठी नकाशावर टॅप करा किंवा तुमचे स्थान वापरा.",
  "locationDenied": "आम्हाला तुमचे स्थान मिळाले नाही. त्याऐवजी नकाशावर टॅप करा.",
  "poorFix": "येथे GPS कमकुवत आहे ({{m}} मीटर). तरीही जतन करता येईल; तपासणीसाठी चिन्हांकित केले जाईल.",
  "formTitle": "साइटचा तपशील",
  "siteName": "साइट किंवा प्रकल्पाचे नाव",
  "contactName": "संपर्क व्यक्ती",
  "contactPhone": "संपर्क मोबाइल क्रमांक",
  "phoneHint": "10 अंक, 6 ते 9 ने सुरू",
  "city": "शहर",
  "save": "नोंद जतन करा",
  "results": "निकाल",
  "onPhone": "या फोनवर",
  "clearSent": "पाठवलेले काढा",
  "capturedAt": "नोंदवले {{when}}",
  "retry": "पुन्हा प्रयत्न करा",
  "discard": "काढून टाका",
  "status": {
    "pending": "प्रतीक्षेत",
    "synced": "पाठवले",
    "failed": "तुमची गरज आहे",
    "conflict": "निर्णय हवा"
  },
  "outcome": {
    "claimed": "नवीन लीड {{code}} म्हणून जतन केले. ही तुमची आहे.",
    "supporting": "ही साइट आधीच नोंदवली आहे ({{code}}). तुमची नोंद पूरक पुरावा म्हणून ठेवली आहे, काहीही गमावले नाही.",
    "review": "या साइटच्या दोन नोंदी इतक्या जवळ होत्या की आधी कोण ते सांगता येत नाही. मालक निर्णय घेतील. तुमची {{code}} म्हणून जतन केली आहे."
  },
  "error": {
    "site": "साइटला नाव द्या.",
    "phone": "10 अंकी मोबाइल क्रमांक टाका किंवा रिकामा सोडा.",
    "point": "आधी पिन लावा.",
    "generic": "अजून पाठवता आले नाही. ते फोनवर राहते.",
    "offline": "सिग्नल नाही",
    "forbidden": "तुम्ही या खात्यासाठी नोंद करू शकत नाही.",
    "location_invalid": "पिन खरे ठिकाण नाही. तो हलवा.",
    "site_name_required": "साइटला नाव द्या.",
    "timeout": "वेळ संपली. पुन्हा प्रयत्न करेल.",
    "network": "नेटवर्क समस्या. पुन्हा प्रयत्न करेल."
  }
} },
};

export default translations;
