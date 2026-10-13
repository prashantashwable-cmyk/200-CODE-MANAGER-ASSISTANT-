import type { ScreenTranslations } from '@/i18n/types';

/** Screen 201. The Owner's Decision Desk, in three languages. */
const translations: ScreenTranslations = {
  en: { decisionDesk: {
  "title": "Decision Desk",
  "subtitle": "Approve, reject, edit, ask for more, or hand over. Every decision is recorded and cannot be changed.",
  "subtitleAdmin": "You can see where each decision stands and prepare a packet. Only the Owner decides.",
  "loading": "Loading decisions…",
  "offline": "Showing the last view. We could not update just now.",
  "close": "Close",
  "record": "Record decision",
  "recorded": "Decision recorded.",
  "decide": "Your decision",
  "actionLabel": "What do you want to do?",
  "editsLabel": "What should change?",
  "delegateLabel": "Hand over to",
  "delegateChoose": "Choose a person",
  "reasonLabel": "Reason",
  "reasonHint": "At least {{n}} letters. It is kept with the decision.",
  "proposedBy": "Proposed by {{name}} · {{when}}",
  "evidence": "Evidence",
  "impact": "What this would change",
  "ai": "Assistant’s view",
  "aiBody": "Suggests: {{action}} ({{pct}}% sure, {{model}}). This is a suggestion only.",
  "history": "Decision history",
  "asDelegate": "as delegate",
  "status": {
    "pending": "Waiting for you",
    "approved": "Approved",
    "rejected": "Rejected",
    "info_requested": "More information asked",
    "delegated": "Handed over"
  },
  "action": {
    "approve": "Approve",
    "reject": "Reject",
    "edit": "Approve with changes",
    "ask_info": "Ask for more information",
    "delegate": "Hand over to someone"
  },
  "filter": {
    "label": "Filter decisions",
    "open": "Open",
    "approved": "Approved",
    "rejected": "Rejected",
    "delegated": "Handed over",
    "all": "All"
  },
  "empty": {
    "title": "Nothing here",
    "body": "No decisions match this filter."
  },
  "evidenceKind": {
    "photo": "photo",
    "document": "document",
    "map": "map",
    "log": "log",
    "note": "note"
  },
  "error": {
    "title": "We could not open the decisions",
    "body": "Nothing was changed. Try again.",
    "retry": "Try again",
    "generic": "That did not work. Nothing was changed.",
    "forbidden": "You cannot do that.",
    "admin_cannot_decide": "Admin cannot decide. Prepare a packet for the Owner instead.",
    "not_found": "That decision could not be found.",
    "already_decided": "This decision is already closed.",
    "reason_short": "Give a reason of at least 10 letters.",
    "edits_missing": "Say what should change.",
    "delegate_missing": "Choose who to hand it to.",
    "title_short": "Give a title of at least 8 letters.",
    "summary_short": "Describe it in at least 20 letters.",
    "amount_invalid": "Enter a valid amount in rupees."
  },
  "prepare": {
    "open": "Prepare a packet",
    "title": "Prepare a decision packet",
    "note": "The Owner decides this. Nothing takes effect until then.",
    "kind": "Kind of decision",
    "titleLabel": "Title",
    "summary": "What is being asked and why",
    "amount": "Amount in rupees (if any)",
    "recommendation": "Your recommendation (optional)",
    "send": "Send to Owner",
    "done": "Packet sent to the Owner."
  },
  "kind": {
    "fee_change": "Platform fee change",
    "guardrail_change": "Price guardrail change",
    "rate_card_change": "Contractor rate card change",
    "partner_admission": "Partner admission",
    "access_suspension": "Platform access suspension",
    "tier_change": "Tier change",
    "verification_outcome": "Verification outcome",
    "dispute": "Dispute",
    "event_correction": "Event correction",
    "payout_release": "Payout release",
    "rule_change": "Rule change",
    "exception": "Exception",
    "lead_ownership_dispute": "Lead ownership dispute"
  }
} },
  hi: { decisionDesk: {
  "title": "निर्णय डेस्क",
  "subtitle": "मंज़ूर करें, अस्वीकार करें, बदलें, और जानकारी माँगें या सौंपें। हर निर्णय दर्ज होता है और बदला नहीं जा सकता।",
  "subtitleAdmin": "आप हर निर्णय की स्थिति देख सकते हैं और पैकेट तैयार कर सकते हैं। निर्णय केवल मालिक लेते हैं।",
  "loading": "निर्णय लोड हो रहे हैं…",
  "offline": "पिछला दृश्य दिख रहा है। अभी अपडेट नहीं हो सका।",
  "close": "बंद करें",
  "record": "निर्णय दर्ज करें",
  "recorded": "निर्णय दर्ज हो गया।",
  "decide": "आपका निर्णय",
  "actionLabel": "आप क्या करना चाहते हैं?",
  "editsLabel": "क्या बदलना चाहिए?",
  "delegateLabel": "इन्हें सौंपें",
  "delegateChoose": "व्यक्ति चुनें",
  "reasonLabel": "कारण",
  "reasonHint": "कम से कम {{n}} अक्षर। यह निर्णय के साथ रखा जाता है।",
  "proposedBy": "{{name}} द्वारा प्रस्तावित · {{when}}",
  "evidence": "प्रमाण",
  "impact": "इससे क्या बदलेगा",
  "ai": "सहायक की राय",
  "aiBody": "सुझाव: {{action}} ({{pct}}% विश्वास, {{model}})। यह केवल सुझाव है।",
  "history": "निर्णय इतिहास",
  "asDelegate": "प्रतिनिधि के रूप में",
  "status": {
    "pending": "आपका इंतज़ार",
    "approved": "मंज़ूर",
    "rejected": "अस्वीकृत",
    "info_requested": "और जानकारी माँगी",
    "delegated": "सौंपा गया"
  },
  "action": {
    "approve": "मंज़ूर करें",
    "reject": "अस्वीकार करें",
    "edit": "बदलाव के साथ मंज़ूर करें",
    "ask_info": "और जानकारी माँगें",
    "delegate": "किसी को सौंपें"
  },
  "filter": {
    "label": "निर्णय छाँटें",
    "open": "खुले",
    "approved": "मंज़ूर",
    "rejected": "अस्वीकृत",
    "delegated": "सौंपे गए",
    "all": "सभी"
  },
  "empty": {
    "title": "यहाँ कुछ नहीं",
    "body": "इस फ़िल्टर से कोई निर्णय मेल नहीं खाता।"
  },
  "evidenceKind": {
    "photo": "फ़ोटो",
    "document": "दस्तावेज़",
    "map": "नक्शा",
    "log": "लॉग",
    "note": "नोट"
  },
  "error": {
    "title": "हम निर्णय नहीं खोल सके",
    "body": "कुछ नहीं बदला। फिर कोशिश करें।",
    "retry": "फिर कोशिश करें",
    "generic": "यह नहीं हो सका। कुछ नहीं बदला।",
    "forbidden": "आप यह नहीं कर सकते।",
    "admin_cannot_decide": "एडमिन निर्णय नहीं ले सकता। इसके बजाय मालिक के लिए पैकेट तैयार करें।",
    "not_found": "वह निर्णय नहीं मिला।",
    "already_decided": "यह निर्णय पहले ही बंद हो चुका है।",
    "reason_short": "कम से कम 10 अक्षरों का कारण दें।",
    "edits_missing": "बताएँ कि क्या बदलना चाहिए।",
    "delegate_missing": "चुनें किसे सौंपना है।",
    "title_short": "कम से कम 8 अक्षरों का शीर्षक दें।",
    "summary_short": "कम से कम 20 अक्षरों में बताएँ।",
    "amount_invalid": "रुपयों में सही राशि दर्ज करें।"
  },
  "prepare": {
    "open": "पैकेट तैयार करें",
    "title": "निर्णय पैकेट तैयार करें",
    "note": "यह निर्णय मालिक लेते हैं। तब तक कुछ लागू नहीं होता।",
    "kind": "निर्णय का प्रकार",
    "titleLabel": "शीर्षक",
    "summary": "क्या माँगा गया है और क्यों",
    "amount": "राशि रुपयों में (यदि हो)",
    "recommendation": "आपकी सिफ़ारिश (वैकल्पिक)",
    "send": "मालिक को भेजें",
    "done": "पैकेट मालिक को भेजा गया।"
  },
  "kind": {
    "fee_change": "प्लॅटफ़ॉर्म शुल्क बदलाव",
    "guardrail_change": "मूल्य सीमा बदलाव",
    "rate_card_change": "ठेकेदार दर-सूची बदलाव",
    "partner_admission": "पार्टनर प्रवेश",
    "access_suspension": "प्लॅटफ़ॉर्म पहुँच निलंबन",
    "tier_change": "टियर बदलाव",
    "verification_outcome": "सत्यापन परिणाम",
    "dispute": "विवाद",
    "event_correction": "घटना सुधार",
    "payout_release": "भुगतान जारी करना",
    "rule_change": "नियम बदलाव",
    "exception": "अपवाद",
    "lead_ownership_dispute": "लीड स्वामित्व विवाद"
  }
} },
  mr: { decisionDesk: {
  "title": "निर्णय डेस्क",
  "subtitle": "मंजूर करा, नाकारा, बदला, अधिक माहिती मागा किंवा सोपवा. प्रत्येक निर्णय नोंदवला जातो आणि बदलता येत नाही.",
  "subtitleAdmin": "तुम्ही प्रत्येक निर्णयाची स्थिती पाहू शकता आणि पॅकेट तयार करू शकता. निर्णय फक्त मालक घेतात.",
  "loading": "निर्णय लोड होत आहेत…",
  "offline": "मागील दृश्य दिसत आहे. आत्ता अपडेट करता आले नाही.",
  "close": "बंद करा",
  "record": "निर्णय नोंदवा",
  "recorded": "निर्णय नोंदवला गेला.",
  "decide": "तुमचा निर्णय",
  "actionLabel": "तुम्हाला काय करायचे आहे?",
  "editsLabel": "काय बदलले पाहिजे?",
  "delegateLabel": "यांना सोपवा",
  "delegateChoose": "व्यक्ती निवडा",
  "reasonLabel": "कारण",
  "reasonHint": "किमान {{n}} अक्षरे. हे निर्णयासोबत ठेवले जाते.",
  "proposedBy": "{{name}} यांनी प्रस्तावित · {{when}}",
  "evidence": "पुरावा",
  "impact": "यामुळे काय बदलेल",
  "ai": "सहाय्यकाचे मत",
  "aiBody": "सूचना: {{action}} ({{pct}}% खात्री, {{model}}). ही फक्त सूचना आहे.",
  "history": "निर्णय इतिहास",
  "asDelegate": "प्रतिनिधी म्हणून",
  "status": {
    "pending": "तुमची प्रतीक्षा",
    "approved": "मंजूर",
    "rejected": "नाकारले",
    "info_requested": "अधिक माहिती मागितली",
    "delegated": "सोपवले"
  },
  "action": {
    "approve": "मंजूर करा",
    "reject": "नाकारा",
    "edit": "बदलांसह मंजूर करा",
    "ask_info": "अधिक माहिती मागा",
    "delegate": "कोणाला तरी सोपवा"
  },
  "filter": {
    "label": "निर्णय गाळा",
    "open": "खुले",
    "approved": "मंजूर",
    "rejected": "नाकारलेले",
    "delegated": "सोपवलेले",
    "all": "सर्व"
  },
  "empty": {
    "title": "येथे काही नाही",
    "body": "या फिल्टरशी कोणताही निर्णय जुळत नाही."
  },
  "evidenceKind": {
    "photo": "फोटो",
    "document": "दस्तऐवज",
    "map": "नकाशा",
    "log": "नोंद",
    "note": "टीप"
  },
  "error": {
    "title": "आम्ही निर्णय उघडू शकलो नाही",
    "body": "काहीही बदलले नाही. पुन्हा प्रयत्न करा.",
    "retry": "पुन्हा प्रयत्न करा",
    "generic": "हे झाले नाही. काहीही बदलले नाही.",
    "forbidden": "तुम्ही हे करू शकत नाही.",
    "admin_cannot_decide": "अ‍ॅडमिन निर्णय घेऊ शकत नाही. त्याऐवजी मालकासाठी पॅकेट तयार करा.",
    "not_found": "तो निर्णय सापडला नाही.",
    "already_decided": "हा निर्णय आधीच बंद झाला आहे.",
    "reason_short": "किमान 10 अक्षरांचे कारण द्या.",
    "edits_missing": "काय बदलावे ते सांगा.",
    "delegate_missing": "कोणाला सोपवायचे ते निवडा.",
    "title_short": "किमान 8 अक्षरांचे शीर्षक द्या.",
    "summary_short": "किमान 20 अक्षरांत वर्णन करा.",
    "amount_invalid": "रुपयांमध्ये योग्य रक्कम टाका."
  },
  "prepare": {
    "open": "पॅकेट तयार करा",
    "title": "निर्णय पॅकेट तयार करा",
    "note": "हा निर्णय मालक घेतात. तोपर्यंत काहीही लागू होत नाही.",
    "kind": "निर्णयाचा प्रकार",
    "titleLabel": "शीर्षक",
    "summary": "काय मागितले आहे आणि का",
    "amount": "रक्कम रुपयांत (असल्यास)",
    "recommendation": "तुमची शिफारस (ऐच्छिक)",
    "send": "मालकाला पाठवा",
    "done": "पॅकेट मालकाला पाठवले."
  },
  "kind": {
    "fee_change": "प्लॅटफॉर्म शुल्क बदल",
    "guardrail_change": "किंमत मर्यादा बदल",
    "rate_card_change": "कंत्राटदार दरपत्रक बदल",
    "partner_admission": "पार्टनर प्रवेश मंजुरी",
    "access_suspension": "प्लॅटफॉर्म प्रवेश निलंबन",
    "tier_change": "टियर बदल",
    "verification_outcome": "पडताळणी निकाल",
    "dispute": "वाद",
    "event_correction": "घटना दुरुस्ती",
    "payout_release": "देयक मंजुरी",
    "rule_change": "नियम बदल",
    "exception": "अपवाद मंजुरी",
    "lead_ownership_dispute": "लीड मालकी वाद"
  }
} },
};

export default translations;
