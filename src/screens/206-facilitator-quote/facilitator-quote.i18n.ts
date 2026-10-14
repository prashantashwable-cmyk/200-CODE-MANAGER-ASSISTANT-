import type { ScreenTranslations } from '@/i18n/types';

/** Screen 206. Facilitator quote builder and fee settings, in three languages. */
const translations: ScreenTranslations = {
  en: { facQuote: {
  "title": "Quotes",
  "subtitle": "Each partner's own price, plus the platform's fee shown on its own line.",
  "disclosure": "The contract is between the customer and each named partner. The platform facilitates, and its fee is shown separately. Partner prices change only with that partner's consent.",
  "tab": {
    "build": "Build a quote",
    "quotes": "Saved quotes",
    "fee": "Fee settings"
  },
  "loading": "Loading quotes…",
  "retry": "Try again",
  "error": {
    "title": "Quotes did not load",
    "body": "Check your connection and try again.",
    "save": "Could not save ({{code}}).",
    "send": "Could not send the quote."
  },
  "site": "Site",
  "lead": "Which site is this for?",
  "partnerPrices": "Partner prices",
  "partnerPricesNote": "Enter what each partner charges. These are passed through unchanged.",
  "partner": "Partner",
  "kind": "Type",
  "what": "What it covers",
  "price": "Partner price (₹)",
  "addLine": "Add a line",
  "removeLine": "Remove last line",
  "kinds": {
    "material": "Material",
    "installation": "Installation",
    "logistics": "Logistics",
    "amc": "AMC",
    "statutory": "Statutory fee (pass-through)"
  },
  "discount": "Bundle discount",
  "discountNote": "A discount comes out of the platform fee only. Partner prices are never reduced here.",
  "discountAmount": "Discount (₹)",
  "discountMax": "You may give up to {{max}}.",
  "empty": {
    "title": "Add a partner price",
    "body": "The fee and the customer total appear here as you type."
  },
  "summary": "What the customer sees",
  "partnerTotal": "Partners' prices",
  "feeLine": "Platform facilitation fee",
  "feePct": "{{pct}}% on partner cost",
  "gstOnFee": "GST on the fee ({{pct}}%)",
  "total": "Total",
  "token": "Booking token",
  "tokenNote": "Paid to the platform and credited against the fee.",
  "band": {
    "target": "At target",
    "assistant_ok": "Assistant may offer",
    "human_only": "A person must offer",
    "owner_approval": "Owner approval needed"
  },
  "mayOffer": "You may offer this",
  "needsOwner": "This goes to the Owner",
  "feeShare": "The fee is {{pct}}% of what the customer pays in total.",
  "waterfall": "Platform P&L for this quote",
  "waterfallNote": "Only the fee is platform revenue. Partner prices are pass-through.",
  "wf": {
    "feeInr": "Facilitation fee",
    "scoutInr": "Scout commission",
    "salesInr": "Sales commission",
    "qcInr": "QC fee",
    "mentorInr": "Mentor bonus",
    "providersInr": "Payment, e-sign, WhatsApp and map costs",
    "infrastructureInr": "Infrastructure",
    "reserveInr": "Dispute and assurance reserve",
    "marginInr": "Platform margin",
    "marginPct": "{{pct}}% of the fee",
    "gstNote": "GST on the fee ({{gst}}) is collected and passed to the government; it is not margin."
  },
  "alternatives": "Ways to charge the same quote",
  "alt": {
    "markup": "Percentage markup",
    "fixed": "Fixed fee",
    "tiered": "Tiered by size",
    "split": "Fee split with partners"
  },
  "altSub": "{{pct}}% on cost · partners carry {{partner}}",
  "save": "Save quote",
  "askOwner": "Ask the Owner",
  "saved": "Quote saved.",
  "sentToOwner": "Sent to the Owner to decide.",
  "sent": "Quote sent to the customer.",
  "none": {
    "title": "No quotes yet",
    "body": "Build one in the first tab."
  },
  "send": "Send",
  "row": "Fee {{fee}} · customer total {{total}} · fee settings v{{v}}",
  "status": {
    "draft": "Draft",
    "sent": "Sent",
    "partly_accepted": "Partly accepted",
    "accepted": "Accepted",
    "rejected": "Declined"
  },
  "fee": {
    "target": "Target fee",
    "assistant": "Assistant floor",
    "human": "Person floor",
    "version": "Version",
    "edit": "Fee band",
    "gst": "GST on the fee (%)",
    "tokenInr": "Booking token (₹)",
    "ownerNote": "Only you change the fee. Every change is kept with your reason, and saved quotes keep the fee they were priced on.",
    "adminNote": "Only the Owner changes the fee. You can ask for a change through the Decision Desk.",
    "placeholder": "These starting values are placeholders for the Owner to replace. GST treatment needs the accountant's confirmation.",
    "why": "Reason for the change",
    "save": "Save new fee settings",
    "saved": "Fee settings saved.",
    "history": "History",
    "err": {
      "owner_only": "Only the Owner can change the fee.",
      "reason_short": "Please give a reason of at least 10 letters.",
      "floors_order": "The floors must be in order: person ≤ assistant ≤ target.",
      "gst_range": "GST must be between 0 and 40.",
      "target_too_high": "The target is too high.",
      "token_negative": "The token cannot be negative."
    }
  }
} },
  hi: { facQuote: {
  "title": "कोटेशन",
  "subtitle": "हर पार्टनर की अपनी कीमत, और प्लैटफ़ॉर्म की फ़ीस अलग पंक्ति में।",
  "disclosure": "अनुबंध ग्राहक और हर नामित पार्टनर के बीच होता है। प्लैटफ़ॉर्म सुविधा देता है और उसकी फ़ीस अलग दिखाई जाती है। पार्टनर की कीमत केवल उस पार्टनर की सहमति से बदलती है।",
  "tab": {
    "build": "कोटेशन बनाएँ",
    "quotes": "सहेजे कोटेशन",
    "fee": "फ़ीस सेटिंग"
  },
  "loading": "कोटेशन लोड हो रहे हैं…",
  "retry": "फिर कोशिश करें",
  "error": {
    "title": "कोटेशन लोड नहीं हुए",
    "body": "कनेक्शन जाँचें और फिर कोशिश करें।",
    "save": "सहेज नहीं सके ({{code}})।",
    "send": "कोटेशन भेज नहीं सके।"
  },
  "site": "साइट",
  "lead": "यह किस साइट के लिए है?",
  "partnerPrices": "पार्टनर की कीमतें",
  "partnerPricesNote": "हर पार्टनर जो लेता है वह भरें। ये बिना बदले आगे जाती हैं।",
  "partner": "पार्टनर",
  "kind": "प्रकार",
  "what": "क्या शामिल है",
  "price": "पार्टनर की कीमत (₹)",
  "addLine": "पंक्ति जोड़ें",
  "removeLine": "आख़िरी पंक्ति हटाएँ",
  "kinds": {
    "material": "सामग्री",
    "installation": "इंस्टॉलेशन",
    "logistics": "लॉजिस्टिक्स",
    "amc": "AMC",
    "statutory": "सरकारी शुल्क (सीधा आगे)"
  },
  "discount": "बंडल छूट",
  "discountNote": "छूट केवल प्लैटफ़ॉर्म की फ़ीस में से दी जाती है। पार्टनर की कीमतें यहाँ कभी कम नहीं होतीं।",
  "discountAmount": "छूट (₹)",
  "discountMax": "आप {{max}} तक दे सकते हैं।",
  "empty": {
    "title": "पार्टनर की कीमत जोड़ें",
    "body": "टाइप करते ही फ़ीस और ग्राहक का कुल यहाँ दिखेगा।"
  },
  "summary": "ग्राहक को क्या दिखता है",
  "partnerTotal": "पार्टनरों की कीमतें",
  "feeLine": "प्लैटफ़ॉर्म सुविधा फ़ीस",
  "feePct": "पार्टनर लागत पर {{pct}}%",
  "gstOnFee": "फ़ीस पर GST ({{pct}}%)",
  "total": "कुल",
  "token": "बुकिंग टोकन",
  "tokenNote": "प्लैटफ़ॉर्म को दिया जाता है और फ़ीस में समायोजित होता है।",
  "band": {
    "target": "लक्ष्य पर",
    "assistant_ok": "असिस्टेंट दे सकता है",
    "human_only": "व्यक्ति को देना होगा",
    "owner_approval": "मालिक की मंज़ूरी चाहिए"
  },
  "mayOffer": "आप यह दे सकते हैं",
  "needsOwner": "यह मालिक के पास जाएगा",
  "feeShare": "ग्राहक के कुल भुगतान में फ़ीस {{pct}}% है।",
  "waterfall": "इस कोटेशन का प्लैटफ़ॉर्म लाभ-हानि",
  "waterfallNote": "केवल फ़ीस प्लैटफ़ॉर्म की आय है। पार्टनर की कीमतें सीधी आगे जाती हैं।",
  "wf": {
    "feeInr": "सुविधा फ़ीस",
    "scoutInr": "स्काउट कमीशन",
    "salesInr": "सेल्स कमीशन",
    "qcInr": "QC फ़ीस",
    "mentorInr": "मेंटर बोनस",
    "providersInr": "भुगतान, ई-साइन, WhatsApp और मैप खर्च",
    "infrastructureInr": "इन्फ्रास्ट्रक्चर",
    "reserveInr": "विवाद और आश्वासन रिज़र्व",
    "marginInr": "प्लैटफ़ॉर्म मार्जिन",
    "marginPct": "फ़ीस का {{pct}}%",
    "gstNote": "फ़ीस पर GST ({{gst}}) वसूल कर सरकार को दिया जाता है; यह मार्जिन नहीं है।"
  },
  "alternatives": "इसी कोटेशन को लेने के तरीके",
  "alt": {
    "markup": "प्रतिशत मार्कअप",
    "fixed": "तय फ़ीस",
    "tiered": "आकार के अनुसार स्तर",
    "split": "पार्टनरों के साथ बँटी फ़ीस"
  },
  "altSub": "लागत पर {{pct}}% · पार्टनर {{partner}} उठाते हैं",
  "save": "कोटेशन सहेजें",
  "askOwner": "मालिक से पूछें",
  "saved": "कोटेशन सहेजा गया।",
  "sentToOwner": "फ़ैसले के लिए मालिक को भेजा गया।",
  "sent": "कोटेशन ग्राहक को भेजा गया।",
  "none": {
    "title": "अभी कोई कोटेशन नहीं",
    "body": "पहले टैब में एक बनाएँ।"
  },
  "send": "भेजें",
  "row": "फ़ीस {{fee}} · ग्राहक का कुल {{total}} · फ़ीस सेटिंग v{{v}}",
  "status": {
    "draft": "मसौदा",
    "sent": "भेजा गया",
    "partly_accepted": "आंशिक स्वीकार",
    "accepted": "स्वीकार",
    "rejected": "अस्वीकार"
  },
  "fee": {
    "target": "लक्ष्य फ़ीस",
    "assistant": "असिस्टेंट की न्यूनतम",
    "human": "व्यक्ति की न्यूनतम",
    "version": "संस्करण",
    "edit": "फ़ीस सीमा",
    "gst": "फ़ीस पर GST (%)",
    "tokenInr": "बुकिंग टोकन (₹)",
    "ownerNote": "फ़ीस केवल आप बदलते हैं। हर बदलाव आपके कारण के साथ रखा जाता है, और सहेजे कोटेशन उसी फ़ीस पर रहते हैं जिस पर बने थे।",
    "adminNote": "फ़ीस केवल मालिक बदलते हैं। आप निर्णय डेस्क से बदलाव का अनुरोध कर सकते हैं।",
    "placeholder": "ये शुरुआती मान मालिक के बदलने के लिए अस्थायी हैं। GST के व्यवहार की पुष्टि अकाउंटेंट से करनी होगी।",
    "why": "बदलाव का कारण",
    "save": "नई फ़ीस सेटिंग सहेजें",
    "saved": "फ़ीस सेटिंग सहेजी गई।",
    "history": "इतिहास",
    "err": {
      "owner_only": "फ़ीस केवल मालिक बदल सकते हैं।",
      "reason_short": "कृपया कम से कम 10 अक्षरों का कारण दें।",
      "floors_order": "न्यूनतम क्रम में होने चाहिए: व्यक्ति ≤ असिस्टेंट ≤ लक्ष्य।",
      "gst_range": "GST 0 से 40 के बीच होना चाहिए।",
      "target_too_high": "लक्ष्य बहुत ज़्यादा है।",
      "token_negative": "टोकन ऋणात्मक नहीं हो सकता।"
    }
  }
} },
  mr: { facQuote: {
  "title": "कोटेशन",
  "subtitle": "प्रत्येक पार्टनरची स्वतःची किंमत, आणि प्लॅटफॉर्मची फी वेगळ्या ओळीत.",
  "disclosure": "करार ग्राहक आणि प्रत्येक नाव दिलेल्या पार्टनर यांच्यात होतो. प्लॅटफॉर्म सुविधा देते आणि तिची फी वेगळी दाखवली जाते. पार्टनरची किंमत फक्त त्या पार्टनरच्या संमतीनेच बदलते.",
  "tab": {
    "build": "कोटेशन बनवा",
    "quotes": "जतन केलेली कोटेशन",
    "fee": "फी सेटिंग"
  },
  "loading": "कोटेशन लोड होत आहेत…",
  "retry": "पुन्हा प्रयत्न करा",
  "error": {
    "title": "कोटेशन लोड झाली नाहीत",
    "body": "कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.",
    "save": "जतन करता आले नाही ({{code}}).",
    "send": "कोटेशन पाठवता आले नाही."
  },
  "site": "साइट",
  "lead": "ही कोणत्या साइटसाठी आहे?",
  "partnerPrices": "पार्टनरच्या किंमती",
  "partnerPricesNote": "प्रत्येक पार्टनर जे घेतो ते भरा. या न बदलता पुढे जातात.",
  "partner": "पार्टनर",
  "kind": "प्रकार",
  "what": "काय समाविष्ट आहे",
  "price": "पार्टनरची किंमत (₹)",
  "addLine": "ओळ जोडा",
  "removeLine": "शेवटची ओळ काढा",
  "kinds": {
    "material": "साहित्य",
    "installation": "इन्स्टॉलेशन",
    "logistics": "लॉजिस्टिक्स",
    "amc": "AMC",
    "statutory": "सरकारी शुल्क (थेट पुढे)"
  },
  "discount": "बंडल सवलत",
  "discountNote": "सवलत फक्त प्लॅटफॉर्मच्या फीमधून दिली जाते. पार्टनरच्या किंमती येथे कधीही कमी होत नाहीत.",
  "discountAmount": "सवलत (₹)",
  "discountMax": "तुम्ही {{max}} पर्यंत देऊ शकता.",
  "empty": {
    "title": "पार्टनरची किंमत जोडा",
    "body": "टाइप करताच फी आणि ग्राहकाची एकूण रक्कम येथे दिसेल."
  },
  "summary": "ग्राहकाला काय दिसते",
  "partnerTotal": "पार्टनरांच्या किंमती",
  "feeLine": "प्लॅटफॉर्म सुविधा फी",
  "feePct": "पार्टनर खर्चावर {{pct}}%",
  "gstOnFee": "फीवर GST ({{pct}}%)",
  "total": "एकूण",
  "token": "बुकिंग टोकन",
  "tokenNote": "प्लॅटफॉर्मला दिले जाते आणि फीमध्ये समायोजित होते.",
  "band": {
    "target": "लक्ष्यावर",
    "assistant_ok": "असिस्टंट देऊ शकतो",
    "human_only": "व्यक्तीने द्यावी लागेल",
    "owner_approval": "मालकाची मंजुरी हवी"
  },
  "mayOffer": "तुम्ही हे देऊ शकता",
  "needsOwner": "हे मालकाकडे जाईल",
  "feeShare": "ग्राहकाच्या एकूण देयकात फी {{pct}}% आहे.",
  "waterfall": "या कोटेशनचा प्लॅटफॉर्म नफा-तोटा",
  "waterfallNote": "फक्त फी हे प्लॅटफॉर्मचे उत्पन्न आहे. पार्टनरच्या किंमती थेट पुढे जातात.",
  "wf": {
    "feeInr": "सुविधा फी",
    "scoutInr": "स्काउट कमिशन",
    "salesInr": "सेल्स कमिशन",
    "qcInr": "QC फी",
    "mentorInr": "मेंटॉर बोनस",
    "providersInr": "पेमेंट, ई-साइन, WhatsApp आणि नकाशा खर्च",
    "infrastructureInr": "इन्फ्रास्ट्रक्चर",
    "reserveInr": "वाद आणि हमी राखीव",
    "marginInr": "प्लॅटफॉर्म मार्जिन",
    "marginPct": "फीच्या {{pct}}%",
    "gstNote": "फीवरील GST ({{gst}}) जमा करून सरकारला दिला जातो; तो मार्जिन नाही."
  },
  "alternatives": "हेच कोटेशन आकारण्याचे मार्ग",
  "alt": {
    "markup": "टक्केवारी मार्कअप",
    "fixed": "निश्चित फी",
    "tiered": "आकारानुसार टप्पे",
    "split": "पार्टनरांसोबत विभागलेली फी"
  },
  "altSub": "खर्चावर {{pct}}% · पार्टनर {{partner}} उचलतात",
  "save": "कोटेशन जतन करा",
  "askOwner": "मालकाला विचारा",
  "saved": "कोटेशन जतन केले.",
  "sentToOwner": "निर्णयासाठी मालकाकडे पाठवले.",
  "sent": "कोटेशन ग्राहकाला पाठवले.",
  "none": {
    "title": "अजून कोटेशन नाही",
    "body": "पहिल्या टॅबमध्ये एक बनवा."
  },
  "send": "पाठवा",
  "row": "फी {{fee}} · ग्राहकाची एकूण {{total}} · फी सेटिंग v{{v}}",
  "status": {
    "draft": "मसुदा",
    "sent": "पाठवले",
    "partly_accepted": "अंशतः स्वीकारले",
    "accepted": "स्वीकारले",
    "rejected": "नाकारले"
  },
  "fee": {
    "target": "लक्ष्य फी",
    "assistant": "असिस्टंटची किमान",
    "human": "व्यक्तीची किमान",
    "version": "आवृत्ती",
    "edit": "फी मर्यादा",
    "gst": "फीवर GST (%)",
    "tokenInr": "बुकिंग टोकन (₹)",
    "ownerNote": "फी फक्त तुम्ही बदलता. प्रत्येक बदल तुमच्या कारणासह जतन होतो, आणि जतन केलेली कोटेशन ज्या फीवर बनली त्याच फीवर राहतात.",
    "adminNote": "फी फक्त मालक बदलतात. तुम्ही निर्णय डेस्कद्वारे बदलाची विनंती करू शकता.",
    "placeholder": "ही सुरुवातीची मूल्ये मालकाने बदलण्यासाठी तात्पुरती आहेत. GST च्या हाताळणीची खात्री अकाउंटंटकडून करावी लागेल.",
    "why": "बदलाचे कारण",
    "save": "नवीन फी सेटिंग जतन करा",
    "saved": "फी सेटिंग जतन केले.",
    "history": "इतिहास",
    "err": {
      "owner_only": "फी फक्त मालक बदलू शकतात.",
      "reason_short": "कृपया किमान 10 अक्षरांचे कारण द्या.",
      "floors_order": "किमान मर्यादा क्रमाने हव्यात: व्यक्ती ≤ असिस्टंट ≤ लक्ष्य.",
      "gst_range": "GST 0 ते 40 दरम्यान हवा.",
      "target_too_high": "लक्ष्य खूप जास्त आहे.",
      "token_negative": "टोकन ऋण असू शकत नाही."
    }
  }
} },
};

export default translations;
