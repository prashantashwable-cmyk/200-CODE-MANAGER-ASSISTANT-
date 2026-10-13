import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    walkthrough: {
      "title": "Customer handover walkthrough",
      "loading": "Loading the walkthrough",
      "back": "Back",
      "next": "Next",
      "error": {
        "title": "Could not load the walkthrough",
        "body": "Check your connection and try again."
      },
      "notFound": {
        "title": "This handover is not available to you",
        "body": "Only Admin, the people on the job and the customer can open it.",
        "action": "Go to the handover list"
      },
      "locked": {
        "title": "Not ready for the customer yet",
        "body": "The walkthrough opens only once the final handover checklist has been confirmed as ready for handover.",
        "customerBody": "Your lift is not ready to be handed over yet. We will tell you as soon as it is.",
        "action": "Open the final checklist"
      },
      "board": {
        "heading": "Customer handovers",
        "emptyTitle": "Nothing to hand over yet",
        "emptyBody": "A handover appears here once a job is confirmed ready for handover.",
        "open": "Open"
      },
      "problem": {
        "mode_required": "Choose how the walkthrough will be done.",
        "conductor_required": "Choose who will conduct it.",
        "representative_required": "Give the name and a phone number of the person who will receive the handover on site.",
        "script_open": "Everything required has to be shown first.",
        "documents_open": "Every document has to be handed over first, and each has to be ready.",
        "not_unlocked": "The job is not confirmed ready for handover yet.",
        "invalid_state": "That cannot be done now.",
        "not_conducted": "The walkthrough has not been completed yet.",
        "understood_required": "Please confirm that you understood.",
        "signature_required": "The customer’s signature is needed.",
        "signer_required": "Write the customer’s name.",
        "already_signed": "This has already been signed.",
        "score_invalid": "Choose a score from 1 to 5.",
        "tier_required": "Choose a plan.",
        "question_required": "Write your question in a few words.",
        "answer_required": "Write an answer.",
        "not_found": "This could not be found.",
        "forbidden": "You cannot do this.",
        "date_required": "Choose today or a later date.",
        "offline": "You need to be online to do this.",
        "generic": "That did not work. Try again."
      },
      "status": {
        "locked": "Not ready",
        "not_started": "Not arranged",
        "arranged": "Arranged",
        "conducted": "Walkthrough done",
        "signed_off": "Signed off"
      },
      "step": {
        "arrange": "Arrange",
        "demonstrate": "Show the lift",
        "documents": "Documents",
        "signoff": "Sign-off",
        "amc": "AMC",
        "feedback": "Feedback",
        "review": "Review"
      },
      "mode": {
        "in_person": "In person",
        "video_call": "Video call",
        "site_representative": "Through a site representative"
      },
      "modeHint": {
        "in_person": "The best way. Someone walks through the lift with the customer on site.",
        "video_call": "For a customer who cannot be there. The documents are shared digitally. The customer signs off for themselves afterwards.",
        "site_representative": "Someone the customer trusts receives the handover on site. The customer still signs off for themselves soon after."
      },
      "arrange": {
        "heading": "How and when",
        "intro": "This is the moment the customer is handed their lift. Decide how it will be done and who will do it.",
        "mode": "How",
        "date": "Day (optional)",
        "dateHint": "Today or a later day.",
        "window": "Time of day",
        "morning": "Morning",
        "afternoon": "Afternoon",
        "conductor": "Who conducts it",
        "choose": "Choose a person",
        "repHeading": "Who receives it on site",
        "repHint": "The customer is not on site, so someone receives the handover for them. The customer’s own sign-off is still collected.",
        "repName": "Name",
        "repPhone": "Phone number",
        "repRelation": "Their relationship to the customer",
        "save": "Save the arrangement",
        "saved": "The walkthrough is arranged.",
        "summary": "How: {{mode}}",
        "with": "Conducted by {{name}}",
        "when": "On {{date}}, {{window}}",
        "notArranged": "Nobody has arranged the walkthrough yet.",
        "draftRestored": "Your unsaved choices were restored.",
        "remoteNote": "Because the customer is not there in person, they sign off for themselves separately, within three days."
      },
      "demo": {
        "heading": "Show the customer their lift",
        "intro": "Go through each point with the customer and tick it once it has been shown. Take your time: this is the moment they remember.",
        "customerIntro": "This is what your handover covers. Each point is ticked once it has been shown to you.",
        "group": {
          "operation": "Using the lift",
          "emergency": "In an emergency",
          "care": "Looking after it"
        },
        "item": {
          "call_and_ride": "Calling the lift and riding it",
          "doors_and_sensors": "The doors and the door safety sensors",
          "car_controls": "The controls inside the cabin",
          "power_cut": "What happens in a power cut",
          "ard_rescue": "The automatic rescue device",
          "alarm_intercom": "The alarm and the intercom",
          "stuck_in_lift": "If someone is stuck in the lift",
          "cleaning": "Cleaning the lift",
          "what_not_to_do": "What not to do",
          "servicing": "Regular servicing"
        },
        "hint": {
          "call_and_ride": "Press the landing button, wait for the doors, choose a floor from the cabin panel and ride to it.",
          "doors_and_sensors": "How the doors open and close, and how they reverse if something is in the way. Show it with a hand or an object.",
          "car_controls": "The floor buttons, door open and close, alarm, fan and light.",
          "power_cut": "The car stops at the nearest safe point. Stay calm, use the alarm, and do not try to open the doors.",
          "ard_rescue": "With power backup the car moves to the nearest landing by itself and opens its doors. Explain what they will see and hear.",
          "alarm_intercom": "Press and hold the alarm button to call for help. The intercom reaches the contact on the emergency card.",
          "stuck_in_lift": "Stay calm, press the alarm, never force the doors or climb out, and wait for help. Explain who to call from outside.",
          "cleaning": "What may be used to clean the cabin and the doors, and what must never be used: no water jets and no harsh chemicals on the panel.",
          "what_not_to_do": "Do not overload the car, hold the doors with force, use it in a fire, or let children play in it.",
          "servicing": "Why a lift needs regular servicing, what a visit covers, and how the AMC options work."
        },
        "required": "required",
        "optional": "optional",
        "progress": "{{done}} of {{total}} required points shown",
        "shown": "Shown by {{name}}, {{when}}",
        "arrangeFirst": "Arrange the walkthrough first."
      },
      "docs": {
        "heading": "Documents handed over",
        "intro": "Everything the customer needs to keep, handed over together.",
        "name": {
          "warranty_terms": "Warranty terms",
          "amc_options": "AMC options",
          "user_manual": "User manual",
          "emergency_contacts": "Emergency contact card"
        },
        "notReady": "This document is not ready. It has to be put right on the final checklist first.",
        "fix": "Open the final checklist",
        "printed": "Handed over, printed",
        "digital": "Shared digitally",
        "given": "Not handed over yet.",
        "givenPrinted": "Handed over in print by {{name}}, {{when}}",
        "givenDigital": "Shared digitally by {{name}}, {{when}}",
        "emergencyAbout": "Who to call, day and night, for an emergency or a fault.",
        "arrangeFirst": "Arrange the walkthrough first."
      },
      "sign": {
        "heading": "The customer’s sign-off",
        "intro": "The customer confirms for themselves that they were shown their lift and understand the basics.",
        "conduct": "The walkthrough is done",
        "conductHint": "Say this once everything has been shown and every document handed over. It is not the customer’s sign-off.",
        "conductToast": "Walkthrough done. The customer can now sign off.",
        "blocked": {
          "mode_required": "Arrange the walkthrough first.",
          "script_open": "Everything required has to be shown first.",
          "documents_open": "Every document has to be handed over first."
        },
        "waiting": "The walkthrough has not been done yet. You can sign off once it has.",
        "conducted": "Walkthrough done by {{name}}, {{when}}",
        "due": "The customer’s sign-off is expected by {{when}}.",
        "understood": "I was shown my lift and I understand the basics of using it and what to do in an emergency.",
        "note": "Anything you would like to add (optional)",
        "confirm": "Confirm and sign off",
        "toast": "Thank you. Your sign-off is recorded.",
        "signed": "Signed off by {{name}}, {{when}}",
        "signedDevice": "Signed on the conductor’s device by {{name}}, {{when}}. Recorded by {{by}}.",
        "deviceHeading": "The customer signs here, in person",
        "deviceHint": "Hand the device to the customer. Only the customer signs.",
        "signer": "Customer’s name",
        "signature": "Signature",
        "clear": "Clear",
        "record": "Record the customer’s signature",
        "remote": "The customer was not there in person, so they sign off for themselves from their own account.",
        "distinct": "This is separate from the technical checks and the compliance certificate. It confirms the customer’s own understanding and acceptance."
      },
      "amc": {
        "heading": "Keeping the lift in good hands",
        "intro": "An annual maintenance contract keeps the lift safe and reliable. These are the plans and what they cost a year.",
        "tier": {
          "basic": "Basic",
          "standard": "Standard",
          "comprehensive": "Comprehensive"
        },
        "tierLine": "We respond within {{hours}} hours",
        "choice": {
          "enrol": "I would like to enrol",
          "later": "Ask me again later",
          "declined": "Not now, thank you"
        },
        "choiceHint": {
          "enrol": "Choose a plan. The registration is completed with the warranty and AMC details.",
          "later": "We will check in again after a while. Nothing is lost.",
          "declined": "No problem. You can change your mind at any time."
        },
        "note": "Anything you would like to add (optional)",
        "save": "Save my choice",
        "toast": "Your choice is saved.",
        "saved": "Saved: {{choice}}.",
        "savedTier": "Saved: {{choice}}, {{tier}} plan.",
        "after": "Nothing is charged here. The AMC is registered on the warranty and AMC step.",
        "waiting": "The AMC offer comes once the walkthrough is done."
      },
      "feedback": {
        "heading": "How did it go?",
        "intro": "A moment while it is fresh: how was the handover?",
        "score": {
          "1": "Poor",
          "2": "Not good",
          "3": "Fine",
          "4": "Good",
          "5": "Excellent"
        },
        "comment": "Anything you want to tell us (optional)",
        "send": "Send feedback",
        "toast": "Thank you for telling us.",
        "thanks": "Thank you.",
        "waiting": "Feedback opens once the sign-off is done.",
        "signal": "A low score: worth understanding",
        "given": "Score: {{score}} of 5"
      },
      "review": {
        "heading": "Everything at a glance",
        "intro": "Check this before you finish. Nothing here can be missed.",
        "arranged": "Arrangement",
        "shown": "What was shown",
        "docs": "Documents handed over",
        "conducted": "Walkthrough done",
        "signed": "Customer’s sign-off",
        "amc": "AMC choice",
        "feedback": "Feedback",
        "none": "Not given",
        "warranty": "Warranty and AMC registration",
        "notYet": "Not yet",
        "questions": "Questions"
      },
      "ask": {
        "heading": "Questions beyond the script",
        "intro": "Anything else you would like to know can be asked here. It goes to AIEC to answer, so nobody has to know everything on the spot.",
        "label": "Your question",
        "hint": "At least {{count}} letters.",
        "send": "Send the question",
        "toast": "Your question was sent.",
        "waiting": "Waiting for an answer.",
        "answer": "Answer",
        "answerGo": "Send the answer",
        "answerToast": "Answered.",
        "answered": "Answered by {{name}}",
        "none": "No questions yet."
      },
      "alert": {
        "negative": "A low handover score after every check passed"
      },
      "cancel": "Cancel"
    },
  },
  hi: {
    walkthrough: {
      "title": "ग्राहक हैंडओवर वॉकथ्रू",
      "loading": "वॉकथ्रू लोड हो रहा है",
      "back": "वापस",
      "next": "आगे",
      "error": {
        "title": "वॉकथ्रू लोड नहीं हो सका",
        "body": "अपना कनेक्शन जाँचें और फिर कोशिश करें।"
      },
      "notFound": {
        "title": "यह हैंडओवर आपके लिए उपलब्ध नहीं है",
        "body": "इसे केवल Admin, जॉब पर लगे लोग और ग्राहक खोल सकते हैं।",
        "action": "हैंडओवर सूची पर जाएँ"
      },
      "locked": {
        "title": "ग्राहक के लिए अभी तैयार नहीं",
        "body": "वॉकथ्रू तभी खुलता है जब अंतिम हैंडओवर चेकलिस्ट हैंडओवर के लिए तैयार के रूप में पुष्ट हो जाए।",
        "customerBody": "आपकी लिफ़्ट अभी हैंडओवर के लिए तैयार नहीं है। तैयार होते ही हम आपको बता देंगे।",
        "action": "अंतिम चेकलिस्ट खोलें"
      },
      "board": {
        "heading": "ग्राहक हैंडओवर",
        "emptyTitle": "अभी हैंडओवर करने को कुछ नहीं",
        "emptyBody": "जॉब के हैंडओवर के लिए तैयार पुष्ट होते ही हैंडओवर यहाँ दिखता है।",
        "open": "खोलें"
      },
      "problem": {
        "mode_required": "चुनें कि वॉकथ्रू कैसे होगा।",
        "conductor_required": "चुनें कि इसे कौन कराएगा।",
        "representative_required": "साइट पर हैंडओवर पाने वाले व्यक्ति का नाम और फ़ोन नंबर दें।",
        "script_open": "पहले हर ज़रूरी बात दिखाई जानी चाहिए।",
        "documents_open": "पहले हर दस्तावेज़ सौंपा जाना चाहिए, और हर एक तैयार होना चाहिए।",
        "not_unlocked": "जॉब अभी हैंडओवर के लिए तैयार पुष्ट नहीं हुआ है।",
        "invalid_state": "यह अभी नहीं हो सकता।",
        "not_conducted": "वॉकथ्रू अभी पूरा नहीं हुआ है।",
        "understood_required": "कृपया पुष्टि करें कि आप समझ गए।",
        "signature_required": "ग्राहक के हस्ताक्षर चाहिए।",
        "signer_required": "ग्राहक का नाम लिखें।",
        "already_signed": "इस पर पहले ही हस्ताक्षर हो चुके हैं।",
        "score_invalid": "1 से 5 के बीच अंक चुनें।",
        "tier_required": "कोई योजना चुनें।",
        "question_required": "अपना सवाल कुछ शब्दों में लिखें।",
        "answer_required": "जवाब लिखें।",
        "not_found": "यह नहीं मिला।",
        "forbidden": "आप यह नहीं कर सकते।",
        "date_required": "आज या बाद की कोई तारीख़ चुनें।",
        "offline": "यह करने के लिए आपको ऑनलाइन होना होगा।",
        "generic": "यह नहीं हो पाया। फिर कोशिश करें।"
      },
      "status": {
        "locked": "तैयार नहीं",
        "not_started": "तय नहीं हुआ",
        "arranged": "तय हो गया",
        "conducted": "वॉकथ्रू पूरा",
        "signed_off": "हस्ताक्षर हो गए"
      },
      "step": {
        "arrange": "तय करें",
        "demonstrate": "लिफ़्ट दिखाएँ",
        "documents": "दस्तावेज़",
        "signoff": "हस्ताक्षर",
        "amc": "AMC",
        "feedback": "प्रतिक्रिया",
        "review": "समीक्षा"
      },
      "mode": {
        "in_person": "आमने-सामने",
        "video_call": "वीडियो कॉल",
        "site_representative": "साइट प्रतिनिधि के ज़रिए"
      },
      "modeHint": {
        "in_person": "सबसे अच्छा तरीक़ा। कोई साइट पर ग्राहक के साथ लिफ़्ट समझाता है।",
        "video_call": "उस ग्राहक के लिए जो मौजूद नहीं हो सकता। दस्तावेज़ डिजिटल रूप से दिए जाते हैं। ग्राहक बाद में अपने हस्ताक्षर ख़ुद करता है।",
        "site_representative": "ग्राहक का भरोसेमंद कोई व्यक्ति साइट पर हैंडओवर लेता है। ग्राहक फिर भी जल्द अपने हस्ताक्षर ख़ुद करता है।"
      },
      "arrange": {
        "heading": "कैसे और कब",
        "intro": "यही वह पल है जब ग्राहक को उसकी लिफ़्ट सौंपी जाती है। तय करें कि यह कैसे होगा और कौन करेगा।",
        "mode": "कैसे",
        "date": "दिन (वैकल्पिक)",
        "dateHint": "आज या बाद का कोई दिन।",
        "window": "दिन का समय",
        "morning": "सुबह",
        "afternoon": "दोपहर बाद",
        "conductor": "कौन कराएगा",
        "choose": "कोई व्यक्ति चुनें",
        "repHeading": "साइट पर कौन लेगा",
        "repHint": "ग्राहक साइट पर नहीं है, इसलिए कोई और उसकी ओर से हैंडओवर लेता है। ग्राहक के अपने हस्ताक्षर फिर भी लिए जाते हैं।",
        "repName": "नाम",
        "repPhone": "फ़ोन नंबर",
        "repRelation": "ग्राहक से उनका संबंध",
        "save": "व्यवस्था सहेजें",
        "saved": "वॉकथ्रू तय हो गया।",
        "summary": "कैसे: {{mode}}",
        "with": "{{name}} कराएँगे",
        "when": "{{date}} को, {{window}}",
        "notArranged": "वॉकथ्रू अभी किसी ने तय नहीं किया।",
        "draftRestored": "आपकी न सहेजी पसंद वापस आ गई।",
        "remoteNote": "ग्राहक मौजूद नहीं है, इसलिए वह तीन दिन के भीतर अलग से अपने हस्ताक्षर ख़ुद करता है।"
      },
      "demo": {
        "heading": "ग्राहक को उसकी लिफ़्ट दिखाएँ",
        "intro": "हर बात ग्राहक के साथ देखें और दिखा देने पर टिक करें। जल्दबाज़ी न करें: यही वह पल है जो उन्हें याद रहता है।",
        "customerIntro": "आपके हैंडओवर में यह सब शामिल है। हर बात आपको दिखा दिए जाने पर टिक होती है।",
        "group": {
          "operation": "लिफ़्ट चलाना",
          "emergency": "आपात स्थिति में",
          "care": "देखभाल"
        },
        "item": {
          "call_and_ride": "लिफ़्ट बुलाना और उसमें चलना",
          "doors_and_sensors": "दरवाज़े और दरवाज़े के सुरक्षा सेंसर",
          "car_controls": "कैबिन के अंदर के नियंत्रण",
          "power_cut": "बिजली जाने पर क्या होता है",
          "ard_rescue": "ऑटोमैटिक रेस्क्यू डिवाइस",
          "alarm_intercom": "अलार्म और इंटरकॉम",
          "stuck_in_lift": "अगर कोई लिफ़्ट में फँस जाए",
          "cleaning": "लिफ़्ट की सफ़ाई",
          "what_not_to_do": "क्या नहीं करना है",
          "servicing": "नियमित सर्विसिंग"
        },
        "hint": {
          "call_and_ride": "मंज़िल का बटन दबाएँ, दरवाज़े खुलने तक रुकें, कैबिन पैनल से मंज़िल चुनें और वहाँ तक चलें।",
          "doors_and_sensors": "दरवाज़े कैसे खुलते-बंद होते हैं, और रास्ते में कुछ आने पर कैसे पलट जाते हैं। हाथ या किसी चीज़ से दिखाएँ।",
          "car_controls": "मंज़िल के बटन, दरवाज़ा खोलना-बंद करना, अलार्म, पंखा और लाइट।",
          "power_cut": "कार सबसे पास की सुरक्षित जगह रुक जाती है। शांत रहें, अलार्म का इस्तेमाल करें और दरवाज़े खोलने की कोशिश न करें।",
          "ard_rescue": "पावर बैकअप के साथ कार अपने आप सबसे पास की मंज़िल तक जाकर दरवाज़े खोल देती है। समझाएँ कि उन्हें क्या दिखेगा और सुनाई देगा।",
          "alarm_intercom": "मदद बुलाने के लिए अलार्म बटन दबाकर रखें। इंटरकॉम आपातकालीन कार्ड के संपर्क तक पहुँचता है।",
          "stuck_in_lift": "शांत रहें, अलार्म दबाएँ, दरवाज़े कभी ज़बरदस्ती न खोलें और न बाहर चढ़ें, और मदद का इंतज़ार करें। बाहर से किसे फ़ोन करना है यह समझाएँ।",
          "cleaning": "कैबिन और दरवाज़ों की सफ़ाई में क्या इस्तेमाल हो सकता है और क्या कभी नहीं: पानी की धार नहीं और पैनल पर कड़े रसायन नहीं।",
          "what_not_to_do": "कार में ज़्यादा भार न लादें, दरवाज़ों को ज़ोर से न रोकें, आग लगने पर इसका इस्तेमाल न करें, और बच्चों को इसमें खेलने न दें।",
          "servicing": "लिफ़्ट को नियमित सर्विसिंग क्यों चाहिए, एक विज़िट में क्या होता है, और AMC के विकल्प कैसे काम करते हैं।"
        },
        "required": "ज़रूरी",
        "optional": "वैकल्पिक",
        "progress": "{{total}} में से {{done}} ज़रूरी बातें दिखाई गईं",
        "shown": "{{name}} ने {{when}} को दिखाया",
        "arrangeFirst": "पहले वॉकथ्रू तय करें।"
      },
      "docs": {
        "heading": "सौंपे गए दस्तावेज़",
        "intro": "ग्राहक को जो कुछ रखना है, सब एक साथ सौंपा जाता है।",
        "name": {
          "warranty_terms": "वारंटी की शर्तें",
          "amc_options": "AMC के विकल्प",
          "user_manual": "यूज़र मैनुअल",
          "emergency_contacts": "आपातकालीन संपर्क कार्ड"
        },
        "notReady": "यह दस्तावेज़ तैयार नहीं है। पहले इसे अंतिम चेकलिस्ट पर ठीक करना होगा।",
        "fix": "अंतिम चेकलिस्ट खोलें",
        "printed": "छपा हुआ सौंपा",
        "digital": "डिजिटल रूप से भेजा",
        "given": "अभी सौंपा नहीं गया।",
        "givenPrinted": "{{name}} ने {{when}} को छपा हुआ सौंपा",
        "givenDigital": "{{name}} ने {{when}} को डिजिटल रूप से भेजा",
        "emergencyAbout": "आपात स्थिति या ख़राबी में, दिन-रात किसे फ़ोन करना है।",
        "arrangeFirst": "पहले वॉकथ्रू तय करें।"
      },
      "sign": {
        "heading": "ग्राहक के हस्ताक्षर",
        "intro": "ग्राहक ख़ुद पुष्टि करता है कि उसे उसकी लिफ़्ट दिखाई गई और वह बुनियादी बातें समझता है।",
        "conduct": "वॉकथ्रू पूरा हुआ",
        "conductHint": "यह तब कहें जब सब कुछ दिखा दिया गया हो और हर दस्तावेज़ सौंप दिया गया हो। यह ग्राहक के हस्ताक्षर नहीं है।",
        "conductToast": "वॉकथ्रू पूरा हुआ। अब ग्राहक हस्ताक्षर कर सकता है।",
        "blocked": {
          "mode_required": "पहले वॉकथ्रू तय करें।",
          "script_open": "पहले हर ज़रूरी बात दिखाई जानी चाहिए।",
          "documents_open": "पहले हर दस्तावेज़ सौंपा जाना चाहिए।"
        },
        "waiting": "वॉकथ्रू अभी पूरा नहीं हुआ। पूरा होने पर आप हस्ताक्षर कर सकते हैं।",
        "conducted": "वॉकथ्रू {{name}} ने {{when}} को पूरा किया",
        "due": "ग्राहक के हस्ताक्षर {{when}} तक अपेक्षित हैं।",
        "understood": "मुझे मेरी लिफ़्ट दिखाई गई और मैं उसके इस्तेमाल की बुनियादी बातें और आपात स्थिति में क्या करना है, समझता/समझती हूँ।",
        "note": "कुछ जोड़ना चाहें तो (वैकल्पिक)",
        "confirm": "पुष्टि करें और हस्ताक्षर करें",
        "toast": "धन्यवाद। आपके हस्ताक्षर दर्ज हुए।",
        "signed": "{{name}} ने {{when}} को हस्ताक्षर किए",
        "signedDevice": "{{name}} ने {{when}} को कराने वाले के डिवाइस पर हस्ताक्षर किए। {{by}} ने दर्ज किया।",
        "deviceHeading": "ग्राहक यहाँ आमने-सामने हस्ताक्षर करता है",
        "deviceHint": "डिवाइस ग्राहक को दें। केवल ग्राहक हस्ताक्षर करता है।",
        "signer": "ग्राहक का नाम",
        "signature": "हस्ताक्षर",
        "clear": "मिटाएँ",
        "record": "ग्राहक के हस्ताक्षर दर्ज करें",
        "remote": "ग्राहक आमने-सामने मौजूद नहीं था, इसलिए वह अपने खाते से ख़ुद हस्ताक्षर करता है।",
        "distinct": "यह तकनीकी जाँचों और अनुपालन प्रमाणपत्र से अलग है। यह ग्राहक की अपनी समझ और स्वीकृति की पुष्टि है।"
      },
      "amc": {
        "heading": "लिफ़्ट को अच्छे हाथों में रखना",
        "intro": "वार्षिक रखरखाव अनुबंध लिफ़्ट को सुरक्षित और भरोसेमंद रखता है। ये योजनाएँ हैं और साल का ख़र्च।",
        "tier": {
          "basic": "बेसिक",
          "standard": "स्टैंडर्ड",
          "comprehensive": "कॉम्प्रिहेंसिव"
        },
        "tierLine": "हम {{hours}} घंटों के भीतर जवाब देते हैं",
        "choice": {
          "enrol": "मैं जुड़ना चाहता/चाहती हूँ",
          "later": "बाद में फिर पूछें",
          "declined": "अभी नहीं, धन्यवाद"
        },
        "choiceHint": {
          "enrol": "कोई योजना चुनें। पंजीकरण वारंटी और AMC के विवरण के साथ पूरा होता है।",
          "later": "हम कुछ समय बाद फिर पूछेंगे। कुछ नहीं खोता।",
          "declined": "कोई बात नहीं। आप कभी भी मन बदल सकते हैं।"
        },
        "note": "कुछ जोड़ना चाहें तो (वैकल्पिक)",
        "save": "मेरी पसंद सहेजें",
        "toast": "आपकी पसंद सहेजी गई।",
        "saved": "सहेजा गया: {{choice}}।",
        "savedTier": "सहेजा गया: {{choice}}, {{tier}} योजना।",
        "after": "यहाँ कुछ नहीं कटता। AMC वारंटी और AMC चरण में पंजीकृत होता है।",
        "waiting": "वॉकथ्रू पूरा होने पर AMC का प्रस्ताव आता है।"
      },
      "feedback": {
        "heading": "कैसा रहा?",
        "intro": "ताज़ा रहते एक पल: हैंडओवर कैसा रहा?",
        "score": {
          "1": "ख़राब",
          "2": "अच्छा नहीं",
          "3": "ठीक",
          "4": "अच्छा",
          "5": "बहुत बढ़िया"
        },
        "comment": "कुछ बताना चाहें तो (वैकल्पिक)",
        "send": "प्रतिक्रिया भेजें",
        "toast": "बताने के लिए धन्यवाद।",
        "thanks": "धन्यवाद।",
        "waiting": "हस्ताक्षर होने के बाद प्रतिक्रिया खुलती है।",
        "signal": "कम अंक: समझने लायक",
        "given": "अंक: 5 में से {{score}}"
      },
      "review": {
        "heading": "सब कुछ एक नज़र में",
        "intro": "पूरा करने से पहले इसे देख लें। यहाँ कुछ छूट नहीं सकता।",
        "arranged": "व्यवस्था",
        "shown": "क्या दिखाया गया",
        "docs": "सौंपे गए दस्तावेज़",
        "conducted": "वॉकथ्रू पूरा",
        "signed": "ग्राहक के हस्ताक्षर",
        "amc": "AMC की पसंद",
        "feedback": "प्रतिक्रिया",
        "none": "नहीं दी गई",
        "warranty": "वारंटी और AMC पंजीकरण",
        "notYet": "अभी नहीं",
        "questions": "सवाल"
      },
      "ask": {
        "heading": "स्क्रिप्ट से परे सवाल",
        "intro": "और कुछ जानना हो तो यहाँ पूछें। यह AIEC को जवाब देने के लिए जाता है, ताकि किसी को सब कुछ उसी पल पता होना ज़रूरी न हो।",
        "label": "आपका सवाल",
        "hint": "कम से कम {{count}} अक्षर।",
        "send": "सवाल भेजें",
        "toast": "आपका सवाल भेजा गया।",
        "waiting": "जवाब की प्रतीक्षा है।",
        "answer": "जवाब",
        "answerGo": "जवाब भेजें",
        "answerToast": "जवाब दिया गया।",
        "answered": "{{name}} ने जवाब दिया",
        "none": "अभी कोई सवाल नहीं।"
      },
      "alert": {
        "negative": "सारी जाँचें पास होने के बाद हैंडओवर पर कम अंक"
      },
      "cancel": "रद्द करें"
    },
  },
  mr: {
    walkthrough: {
      "title": "ग्राहक हस्तांतरण वॉकथ्रू",
      "loading": "वॉकथ्रू लोड होत आहे",
      "back": "मागे",
      "next": "पुढे",
      "error": {
        "title": "वॉकथ्रू लोड करता आला नाही",
        "body": "तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा."
      },
      "notFound": {
        "title": "हे हस्तांतरण तुमच्यासाठी उपलब्ध नाही",
        "body": "ते फक्त Admin, जॉबवरील लोक आणि ग्राहक उघडू शकतात.",
        "action": "हस्तांतरण यादीकडे जा"
      },
      "locked": {
        "title": "ग्राहकासाठी अजून तयार नाही",
        "body": "अंतिम हस्तांतरण चेकलिस्ट हस्तांतरणास तयार म्हणून पक्की झाल्यावरच वॉकथ्रू उघडतो.",
        "customerBody": "तुमची लिफ्ट अजून हस्तांतरणासाठी तयार नाही. तयार होताच आम्ही तुम्हाला कळवू.",
        "action": "अंतिम चेकलिस्ट उघडा"
      },
      "board": {
        "heading": "ग्राहक हस्तांतरणे",
        "emptyTitle": "अजून हस्तांतरित करण्यासारखे काही नाही",
        "emptyBody": "जॉब हस्तांतरणास तयार म्हणून पक्का झाला की हस्तांतरण येथे दिसते.",
        "open": "उघडा"
      },
      "problem": {
        "mode_required": "वॉकथ्रू कसा होणार ते निवडा.",
        "conductor_required": "तो कोण घेणार ते निवडा.",
        "representative_required": "साइटवर हस्तांतरण स्वीकारणाऱ्या व्यक्तीचे नाव आणि फोन नंबर द्या.",
        "script_open": "आधी प्रत्येक आवश्यक गोष्ट दाखवली गेली पाहिजे.",
        "documents_open": "आधी प्रत्येक दस्तऐवज सोपवला गेला पाहिजे, आणि प्रत्येक तयार असला पाहिजे.",
        "not_unlocked": "जॉब अजून हस्तांतरणास तयार म्हणून पक्का झालेला नाही.",
        "invalid_state": "हे आत्ता करता येत नाही.",
        "not_conducted": "वॉकथ्रू अजून पूर्ण झालेला नाही.",
        "understood_required": "कृपया तुम्हाला समजले याची पुष्टी करा.",
        "signature_required": "ग्राहकाची सही हवी.",
        "signer_required": "ग्राहकाचे नाव लिहा.",
        "already_signed": "यावर आधीच सही झाली आहे.",
        "score_invalid": "1 ते 5 दरम्यान गुण निवडा.",
        "tier_required": "एक योजना निवडा.",
        "question_required": "तुमचा प्रश्न काही शब्दांत लिहा.",
        "answer_required": "उत्तर लिहा.",
        "not_found": "हे सापडले नाही.",
        "forbidden": "तुम्ही हे करू शकत नाही.",
        "date_required": "आज किंवा पुढील एक दिवस निवडा.",
        "offline": "हे करण्यासाठी तुम्ही ऑनलाइन असले पाहिजे.",
        "generic": "हे झाले नाही. पुन्हा प्रयत्न करा."
      },
      "status": {
        "locked": "तयार नाही",
        "not_started": "ठरलेले नाही",
        "arranged": "ठरले",
        "conducted": "वॉकथ्रू पूर्ण",
        "signed_off": "सही झाली"
      },
      "step": {
        "arrange": "ठरवा",
        "demonstrate": "लिफ्ट दाखवा",
        "documents": "दस्तऐवज",
        "signoff": "सही",
        "amc": "AMC",
        "feedback": "अभिप्राय",
        "review": "पुनरावलोकन"
      },
      "mode": {
        "in_person": "प्रत्यक्ष भेटीत",
        "video_call": "व्हिडिओ कॉल",
        "site_representative": "साइट प्रतिनिधीमार्फत"
      },
      "modeHint": {
        "in_person": "सर्वोत्तम मार्ग. कोणीतरी साइटवर ग्राहकासोबत लिफ्ट समजावून सांगतो.",
        "video_call": "जो ग्राहक हजर राहू शकत नाही त्याच्यासाठी. दस्तऐवज डिजिटल पद्धतीने दिले जातात. ग्राहक नंतर स्वतः सही करतो.",
        "site_representative": "ग्राहकाचा विश्वासू कोणीतरी साइटवर हस्तांतरण स्वीकारतो. ग्राहक तरीही लवकरच स्वतः सही करतो."
      },
      "arrange": {
        "heading": "कसे आणि केव्हा",
        "intro": "हाच तो क्षण आहे जेव्हा ग्राहकाला त्याची लिफ्ट सोपवली जाते. ते कसे होणार आणि कोण करणार ते ठरवा.",
        "mode": "कसे",
        "date": "दिवस (ऐच्छिक)",
        "dateHint": "आज किंवा पुढील एक दिवस.",
        "window": "दिवसाची वेळ",
        "morning": "सकाळ",
        "afternoon": "दुपार",
        "conductor": "कोण घेणार",
        "choose": "एक व्यक्ती निवडा",
        "repHeading": "साइटवर कोण स्वीकारणार",
        "repHint": "ग्राहक साइटवर नाही, म्हणून कोणीतरी त्याच्यावतीने हस्तांतरण स्वीकारतो. ग्राहकाची स्वतःची सही तरीही घेतली जाते.",
        "repName": "नाव",
        "repPhone": "फोन नंबर",
        "repRelation": "ग्राहकाशी त्यांचे नाते",
        "save": "व्यवस्था जतन करा",
        "saved": "वॉकथ्रू ठरला.",
        "summary": "कसे: {{mode}}",
        "with": "{{name}} घेतील",
        "when": "{{date}} रोजी, {{window}}",
        "notArranged": "वॉकथ्रू अजून कोणीही ठरवलेला नाही.",
        "draftRestored": "तुमच्या न जतन केलेल्या निवडी परत आल्या.",
        "remoteNote": "ग्राहक प्रत्यक्ष हजर नाही, म्हणून तो तीन दिवसांत वेगळी स्वतः सही करतो."
      },
      "demo": {
        "heading": "ग्राहकाला त्याची लिफ्ट दाखवा",
        "intro": "प्रत्येक मुद्दा ग्राहकासोबत पहा आणि दाखवून झाला की टिक करा. घाई करू नका: हाच क्षण त्यांच्या लक्षात राहतो.",
        "customerIntro": "तुमच्या हस्तांतरणात हे सर्व येते. प्रत्येक मुद्दा तुम्हाला दाखवून झाला की टिक होतो.",
        "group": {
          "operation": "लिफ्ट वापरणे",
          "emergency": "आणीबाणीत",
          "care": "देखभाल"
        },
        "item": {
          "call_and_ride": "लिफ्ट बोलावणे आणि तिने जाणे",
          "doors_and_sensors": "दरवाजे आणि दरवाजाचे सुरक्षा सेन्सर",
          "car_controls": "केबिनमधील नियंत्रणे",
          "power_cut": "वीज गेल्यावर काय होते",
          "ard_rescue": "ऑटोमॅटिक रेस्क्यू डिव्हाइस",
          "alarm_intercom": "अलार्म आणि इंटरकॉम",
          "stuck_in_lift": "कोणी लिफ्टमध्ये अडकल्यास",
          "cleaning": "लिफ्टची स्वच्छता",
          "what_not_to_do": "काय करू नये",
          "servicing": "नियमित सर्व्हिसिंग"
        },
        "hint": {
          "call_and_ride": "मजल्यावरचे बटण दाबा, दरवाजे उघडेपर्यंत थांबा, केबिन पॅनेलवरून मजला निवडा आणि तेथे जा.",
          "doors_and_sensors": "दरवाजे कसे उघडतात-बंद होतात, आणि मार्गात काही आले तर कसे उलटतात. हात किंवा एखाद्या वस्तूने दाखवा.",
          "car_controls": "मजल्यांची बटणे, दरवाजा उघडणे-बंद करणे, अलार्म, पंखा आणि दिवा.",
          "power_cut": "कार जवळच्या सुरक्षित जागी थांबते. शांत राहा, अलार्म वापरा आणि दरवाजे उघडण्याचा प्रयत्न करू नका.",
          "ard_rescue": "पॉवर बॅकअपसह कार आपोआप जवळच्या मजल्यावर जाऊन दरवाजे उघडते. त्यांना काय दिसेल आणि ऐकू येईल ते समजावून सांगा.",
          "alarm_intercom": "मदत बोलावण्यासाठी अलार्मचे बटण दाबून ठेवा. इंटरकॉम आणीबाणी कार्डावरील संपर्कापर्यंत पोहोचतो.",
          "stuck_in_lift": "शांत राहा, अलार्म दाबा, दरवाजे कधीही जबरदस्तीने उघडू नका किंवा बाहेर चढू नका, आणि मदतीची वाट पाहा. बाहेरून कोणाला फोन करायचा ते समजावून सांगा.",
          "cleaning": "केबिन आणि दरवाजे साफ करायला काय वापरता येते आणि काय कधीही नाही: पाण्याचे फवारे नाहीत आणि पॅनेलवर कडक रसायने नाहीत.",
          "what_not_to_do": "कारमध्ये जास्त भार टाकू नका, दरवाजे जोराने धरू नका, आगीत ती वापरू नका, आणि मुलांना त्यात खेळू देऊ नका.",
          "servicing": "लिफ्टला नियमित सर्व्हिसिंग का हवी, एका भेटीत काय होते, आणि AMC चे पर्याय कसे चालतात."
        },
        "required": "आवश्यक",
        "optional": "ऐच्छिक",
        "progress": "{{total}} पैकी {{done}} आवश्यक मुद्दे दाखवले",
        "shown": "{{name}} यांनी {{when}} रोजी दाखवले",
        "arrangeFirst": "आधी वॉकथ्रू ठरवा."
      },
      "docs": {
        "heading": "सोपवलेले दस्तऐवज",
        "intro": "ग्राहकाला जे काही ठेवायचे आहे ते सर्व एकत्र सोपवले जाते.",
        "name": {
          "warranty_terms": "वॉरंटीच्या अटी",
          "amc_options": "AMC चे पर्याय",
          "user_manual": "यूजर मॅन्युअल",
          "emergency_contacts": "आणीबाणी संपर्क कार्ड"
        },
        "notReady": "हा दस्तऐवज तयार नाही. आधी तो अंतिम चेकलिस्टवर दुरुस्त करावा लागेल.",
        "fix": "अंतिम चेकलिस्ट उघडा",
        "printed": "छापील सोपवले",
        "digital": "डिजिटल पाठवले",
        "given": "अजून सोपवलेले नाही.",
        "givenPrinted": "{{name}} यांनी {{when}} रोजी छापील सोपवले",
        "givenDigital": "{{name}} यांनी {{when}} रोजी डिजिटल पाठवले",
        "emergencyAbout": "आणीबाणीत किंवा बिघाडात, रात्रंदिवस कोणाला फोन करायचा.",
        "arrangeFirst": "आधी वॉकथ्रू ठरवा."
      },
      "sign": {
        "heading": "ग्राहकाची सही",
        "intro": "ग्राहक स्वतः पुष्टी करतो की त्याला त्याची लिफ्ट दाखवली गेली आणि त्याला मूलभूत गोष्टी समजल्या.",
        "conduct": "वॉकथ्रू पूर्ण झाला",
        "conductHint": "सर्व काही दाखवून झाल्यावर आणि प्रत्येक दस्तऐवज सोपवून झाल्यावर हे म्हणा. ही ग्राहकाची सही नाही.",
        "conductToast": "वॉकथ्रू पूर्ण झाला. आता ग्राहक सही करू शकतो.",
        "blocked": {
          "mode_required": "आधी वॉकथ्रू ठरवा.",
          "script_open": "आधी प्रत्येक आवश्यक गोष्ट दाखवली गेली पाहिजे.",
          "documents_open": "आधी प्रत्येक दस्तऐवज सोपवला गेला पाहिजे."
        },
        "waiting": "वॉकथ्रू अजून पूर्ण झालेला नाही. तो झाल्यावर तुम्ही सही करू शकता.",
        "conducted": "वॉकथ्रू {{name}} यांनी {{when}} रोजी पूर्ण केला",
        "due": "ग्राहकाची सही {{when}} पर्यंत अपेक्षित आहे.",
        "understood": "मला माझी लिफ्ट दाखवली गेली आणि ती वापरण्याच्या मूलभूत गोष्टी आणि आणीबाणीत काय करायचे ते मला समजले आहे.",
        "note": "काही जोडायचे असेल तर (ऐच्छिक)",
        "confirm": "पुष्टी करा आणि सही करा",
        "toast": "धन्यवाद. तुमची सही नोंदवली.",
        "signed": "{{name}} यांनी {{when}} रोजी सही केली",
        "signedDevice": "{{name}} यांनी {{when}} रोजी घेणाऱ्याच्या डिव्हाइसवर सही केली. {{by}} यांनी नोंदवले.",
        "deviceHeading": "ग्राहक येथे प्रत्यक्ष सही करतो",
        "deviceHint": "डिव्हाइस ग्राहकाला द्या. फक्त ग्राहक सही करतो.",
        "signer": "ग्राहकाचे नाव",
        "signature": "सही",
        "clear": "पुसा",
        "record": "ग्राहकाची सही नोंदवा",
        "remote": "ग्राहक प्रत्यक्ष हजर नव्हता, म्हणून तो स्वतःच्या खात्यातून स्वतः सही करतो.",
        "distinct": "हे तांत्रिक तपासण्या आणि अनुपालन प्रमाणपत्रापासून वेगळे आहे. ते ग्राहकाची स्वतःची समज आणि स्वीकृती पक्की करते."
      },
      "amc": {
        "heading": "लिफ्टला चांगल्या हातांत ठेवणे",
        "intro": "वार्षिक देखभाल करार लिफ्ट सुरक्षित आणि भरवशाची ठेवतो. या योजना आहेत आणि वर्षाचा खर्च.",
        "tier": {
          "basic": "बेसिक",
          "standard": "स्टँडर्ड",
          "comprehensive": "कॉम्प्रिहेन्सिव्ह"
        },
        "tierLine": "आम्ही {{hours}} तासांत प्रतिसाद देतो",
        "choice": {
          "enrol": "मला सामील व्हायचे आहे",
          "later": "नंतर पुन्हा विचारा",
          "declined": "आत्ता नको, धन्यवाद"
        },
        "choiceHint": {
          "enrol": "एक योजना निवडा. नोंदणी वॉरंटी आणि AMC च्या तपशिलांसह पूर्ण होते.",
          "later": "आम्ही काही काळाने पुन्हा विचारू. काहीही गमावले जात नाही.",
          "declined": "हरकत नाही. तुम्ही केव्हाही मत बदलू शकता."
        },
        "note": "काही जोडायचे असेल तर (ऐच्छिक)",
        "save": "माझी निवड जतन करा",
        "toast": "तुमची निवड जतन केली.",
        "saved": "जतन केले: {{choice}}.",
        "savedTier": "जतन केले: {{choice}}, {{tier}} योजना.",
        "after": "येथे काहीही आकारले जात नाही. AMC वॉरंटी आणि AMC पायरीवर नोंदवले जाते.",
        "waiting": "वॉकथ्रू पूर्ण झाल्यावर AMC ची ऑफर येते."
      },
      "feedback": {
        "heading": "कसे झाले?",
        "intro": "ताजे असताना एक क्षण: हस्तांतरण कसे झाले?",
        "score": {
          "1": "वाईट",
          "2": "चांगले नाही",
          "3": "ठीक",
          "4": "चांगले",
          "5": "उत्कृष्ट"
        },
        "comment": "काही सांगायचे असेल तर (ऐच्छिक)",
        "send": "अभिप्राय पाठवा",
        "toast": "सांगितल्याबद्दल धन्यवाद.",
        "thanks": "धन्यवाद.",
        "waiting": "सही झाल्यानंतर अभिप्राय उघडतो.",
        "signal": "कमी गुण: समजून घेण्यासारखे",
        "given": "गुण: 5 पैकी {{score}}"
      },
      "review": {
        "heading": "सर्व काही एका नजरेत",
        "intro": "पूर्ण करण्यापूर्वी हे पहा. येथे काहीही सुटू शकत नाही.",
        "arranged": "व्यवस्था",
        "shown": "काय दाखवले",
        "docs": "सोपवलेले दस्तऐवज",
        "conducted": "वॉकथ्रू पूर्ण",
        "signed": "ग्राहकाची सही",
        "amc": "AMC ची निवड",
        "feedback": "अभिप्राय",
        "none": "दिलेला नाही",
        "warranty": "वॉरंटी आणि AMC नोंदणी",
        "notYet": "अजून नाही",
        "questions": "प्रश्न"
      },
      "ask": {
        "heading": "स्क्रिप्टपलीकडचे प्रश्न",
        "intro": "आणखी काही जाणून घ्यायचे असेल तर येथे विचारा. ते AIEC कडे उत्तरासाठी जाते, म्हणजे कोणाला त्याच क्षणी सर्व काही माहीत असण्याची गरज नाही.",
        "label": "तुमचा प्रश्न",
        "hint": "किमान {{count}} अक्षरे.",
        "send": "प्रश्न पाठवा",
        "toast": "तुमचा प्रश्न पाठवला.",
        "waiting": "उत्तराची प्रतीक्षा आहे.",
        "answer": "उत्तर",
        "answerGo": "उत्तर पाठवा",
        "answerToast": "उत्तर दिले.",
        "answered": "{{name}} यांनी उत्तर दिले",
        "none": "अजून कोणताही प्रश्न नाही."
      },
      "alert": {
        "negative": "सर्व तपासण्या पास झाल्यानंतर हस्तांतरणावर कमी गुण"
      },
      "cancel": "रद्द करा"
    },
  },
};

export default translations;
