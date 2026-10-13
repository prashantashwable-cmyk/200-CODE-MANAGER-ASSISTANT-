import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    negotiationBotConfig: {
      title: 'Auto-Negotiation Bot Configuration',
      subtitle: 'Bounded, monitored deal-closing automation — a human always regains control.',
      loading: 'Loading negotiation bot configuration',
      error: { title: 'Could not load negotiation bot configuration', body: 'Check your connection and try again.' },
      save: 'Save configuration',
      counterOffersLink: 'Counter-offers',

      guardrails: {
        heading: 'Price guardrail',
        bufferLabel: 'Margin buffer above the company floor (%)',
        bufferHint: 'Added on top of the Pricing Rules margin floor — the bot can only ever be more conservative than Cost Breakdown allows, never less.',
        bufferMustBeNonNegative: "The buffer cannot be negative — that would let the bot settle below the company's own margin floor.",
        effectiveFloor: 'Bot never settles below',
      },

      rounds: {
        heading: 'Negotiation rounds',
        label: 'Maximum rounds before mandatory human handoff',
        hint: 'Hitting this limit always hands off to a human, however close the deal seems — a low number is a valid, conservative choice, not an error.',
        mustBeAtLeastOne: 'At least one round is required.',
      },

      persona: {
        heading: 'Tone for this conversation',
        toneLabel: 'Persona',
        tone: { professional: 'Professional', warm: 'Warm', concise: 'Concise', firm: 'Firm' },
      },

      autoClose: {
        heading: 'Closing authority',
        label: 'Bot can close independently at the floor price',
        hint: 'Off by default. When off, even an acceptable price always waits for a final human nod before the deal closes.',
        warning: 'The bot can now close a deal on its own once it reaches the floor price, with no human sign-off.',
      },

      scenarios: {
        heading: 'Objection scenario library',
        subtitle: "Each objection below maps to an approved response strategy — a genuinely novel objection that matches none of these always escalates to a human.",
        objectionLabel: {
          price_too_high: '"Your price is too high"',
          competitor_comparison: '"A competitor quoted less"',
          wants_to_delay: '"I want to think it over / delay"',
        },
        strategyLabel: 'Response strategy',
        noMatchNote: "An objection that doesn't clearly match one of these always escalates to a human rather than forcing a poor-fit canned response.",
      },

      dashboard: {
        heading: 'Live negotiations',
        subtitle: 'Every bot-run negotiation still open, with a manual take-over always available.',
        empty: 'No negotiations are currently active.',
        roundsProgress: 'Round {{used}} of {{max}}',
        currentOffer: 'Current offer: {{amount}}',
        floor: 'Floor: {{amount}}',
        takeOver: 'Take over',
        openThread: 'Open thread',
        takenOverBy: 'Taken over by you on {{date}}',
        lastActivity: 'Updated {{time}}',
        status: { bot_active: 'Bot active', escalated: 'Escalated', human_takeover: 'Human handling' },
        escalationReason: {
          no_scenario_match: "Escalated — the customer's objection didn't match any known scenario.",
          max_rounds_reached: 'Escalated — reached the maximum negotiation rounds.',
          manual_takeover: 'Taken over manually.',
        },
      },

      toast: {
        saved: 'Configuration saved',
        takenOver: "You've taken over this negotiation",
        error: 'Something went wrong — try again',
      },
    },
  },

  hi: {
    negotiationBotConfig: {
      title: 'ऑटो-नेगोशिएशन बॉट कॉन्फ़िगरेशन',
      subtitle: 'सीमित, निगरानी में रहने वाला डील-क्लोजिंग ऑटोमेशन — नियंत्रण हमेशा किसी इंसान के पास वापस आता है।',
      loading: 'नेगोशिएशन बॉट कॉन्फ़िगरेशन लोड हो रहा है',
      error: { title: 'नेगोशिएशन बॉट कॉन्फ़िगरेशन लोड नहीं हो सका', body: 'अपना कनेक्शन जांचें और फिर से प्रयास करें।' },
      save: 'कॉन्फ़िगरेशन सेव करें',
      counterOffersLink: 'काउंटर-ऑफ़र',

      guardrails: {
        heading: 'कीमत सुरक्षा सीमा',
        bufferLabel: 'कंपनी की सीमा से ऊपर मार्जिन बफर (%)',
        bufferHint: 'प्राइसिंग रूल्स के मार्जिन फ़्लोर के ऊपर जोड़ा गया — बॉट कभी भी कॉस्ट ब्रेकडाउन की अनुमति से कम सतर्क नहीं, बल्कि हमेशा अधिक सतर्क ही हो सकता है।',
        bufferMustBeNonNegative: 'बफर नकारात्मक नहीं हो सकता — इससे बॉट कंपनी की अपनी मार्जिन सीमा से नीचे तय कर सकता है।',
        effectiveFloor: 'बॉट कभी इससे नीचे नहीं जाएगा',
      },

      rounds: {
        heading: 'नेगोशिएशन राउंड',
        label: 'अनिवार्य मानव हस्तांतरण से पहले अधिकतम राउंड',
        hint: 'यह सीमा पूरी होते ही हमेशा किसी इंसान को सौंपा जाता है, चाहे डील कितनी भी करीब लगे — कम संख्या एक मान्य, सतर्क विकल्प है, गलती नहीं।',
        mustBeAtLeastOne: 'कम से कम एक राउंड ज़रूरी है।',
      },

      persona: {
        heading: 'इस बातचीत के लिए लहजा',
        toneLabel: 'व्यक्तित्व',
        tone: { professional: 'पेशेवर', warm: 'आत्मीय', concise: 'संक्षिप्त', firm: 'दृढ़' },
      },

      autoClose: {
        heading: 'सौदा बंद करने का अधिकार',
        label: 'बॉट फ़्लोर कीमत पर स्वतंत्र रूप से सौदा बंद कर सकता है',
        hint: 'डिफ़ॉल्ट रूप से बंद। बंद होने पर, स्वीकार्य कीमत भी हमेशा सौदा बंद होने से पहले किसी इंसान की अंतिम स्वीकृति का इंतज़ार करती है।',
        warning: 'अब बॉट फ़्लोर कीमत तक पहुंचते ही बिना किसी इंसानी स्वीकृति के अपने आप सौदा बंद कर सकता है।',
      },

      scenarios: {
        heading: 'आपत्ति परिदृश्य लाइब्रेरी',
        subtitle: 'नीचे हर आपत्ति एक स्वीकृत प्रतिक्रिया रणनीति से जुड़ी है — जो आपत्ति इनमें से किसी से मेल नहीं खाती, वह हमेशा किसी इंसान को सौंपी जाती है।',
        objectionLabel: {
          price_too_high: '"आपकी कीमत बहुत ज़्यादा है"',
          competitor_comparison: '"किसी प्रतियोगी ने कम कीमत बताई"',
          wants_to_delay: '"मुझे सोचना है / देर करनी है"',
        },
        strategyLabel: 'प्रतिक्रिया रणनीति',
        noMatchNote: 'जो आपत्ति स्पष्ट रूप से इनमें से किसी से मेल नहीं खाती, वह हमेशा किसी इंसान को सौंपी जाती है, न कि किसी गलत-फिट तैयार जवाब पर मजबूर की जाती है।',
      },

      dashboard: {
        heading: 'लाइव नेगोशिएशन',
        subtitle: 'हर बॉट-संचालित नेगोशिएशन जो अभी भी खुला है, मैनुअल टेक-ओवर हमेशा उपलब्ध है।',
        empty: 'फ़िलहाल कोई नेगोशिएशन सक्रिय नहीं है।',
        roundsProgress: 'राउंड {{used}} / {{max}}',
        currentOffer: 'मौजूदा ऑफ़र: {{amount}}',
        floor: 'सीमा: {{amount}}',
        takeOver: 'टेक ओवर करें',
        openThread: 'बातचीत खोलें',
        takenOverBy: 'आपने {{date}} को टेक ओवर किया',
        lastActivity: '{{time}} अपडेट हुआ',
        status: { bot_active: 'बॉट सक्रिय', escalated: 'एस्केलेटेड', human_takeover: 'इंसान संभाल रहा है' },
        escalationReason: {
          no_scenario_match: 'एस्केलेटेड — ग्राहक की आपत्ति किसी ज्ञात परिदृश्य से मेल नहीं खाई।',
          max_rounds_reached: 'एस्केलेटेड — अधिकतम नेगोशिएशन राउंड पूरे हो गए।',
          manual_takeover: 'मैन्युअल रूप से टेक ओवर किया गया।',
        },
      },

      toast: {
        saved: 'कॉन्फ़िगरेशन सेव हो गया',
        takenOver: 'आपने यह नेगोशिएशन टेक ओवर कर लिया है',
        error: 'कुछ गलत हो गया — फिर से प्रयास करें',
      },
    },
  },

  mr: {
    negotiationBotConfig: {
      title: 'ऑटो-निगोशिएशन बॉट कॉन्फिगरेशन',
      subtitle: 'मर्यादित, देखरेख असलेले डील-क्लोजिंग ऑटोमेशन — नियंत्रण नेहमी माणसाकडे परत येते.',
      loading: 'निगोशिएशन बॉट कॉन्फिगरेशन लोड होत आहे',
      error: { title: 'निगोशिएशन बॉट कॉन्फिगरेशन लोड होऊ शकले नाही', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },
      save: 'कॉन्फिगरेशन सेव्ह करा',
      counterOffersLink: 'काउंटर-ऑफर',

      guardrails: {
        heading: 'किंमत सुरक्षा मर्यादा',
        bufferLabel: 'कंपनीच्या मर्यादेपेक्षा जास्त मार्जिन बफर (%)',
        bufferHint: 'प्रायसिंग रूल्सच्या मार्जिन मर्यादेवर जोडलेले — बॉट कधीही कॉस्ट ब्रेकडाउनपेक्षा कमी सावध असू शकत नाही, फक्त जास्त सावध असू शकतो.',
        bufferMustBeNonNegative: 'बफर ऋण असू शकत नाही — यामुळे बॉट कंपनीच्या स्वतःच्या मार्जिन मर्यादेखाली जाऊ शकेल.',
        effectiveFloor: 'बॉट यापेक्षा कधीही खाली जाणार नाही',
      },

      rounds: {
        heading: 'निगोशिएशन फेऱ्या',
        label: 'अनिवार्य मानवी हस्तांतरणापूर्वी कमाल फेऱ्या',
        hint: 'ही मर्यादा गाठताच नेहमी माणसाकडे सोपवले जाते, डील कितीही जवळ वाटली तरी — कमी संख्या हा एक वैध, सावध पर्याय आहे, चूक नाही.',
        mustBeAtLeastOne: 'किमान एक फेरी आवश्यक आहे.',
      },

      persona: {
        heading: 'या संभाषणासाठी सूर',
        toneLabel: 'व्यक्तिमत्त्व',
        tone: { professional: 'व्यावसायिक', warm: 'आपुलकीचा', concise: 'संक्षिप्त', firm: 'ठाम' },
      },

      autoClose: {
        heading: 'सौदा बंद करण्याचा अधिकार',
        label: 'बॉट मर्यादा किमतीवर स्वतंत्रपणे सौदा बंद करू शकतो',
        hint: 'डीफॉल्टनुसार बंद. बंद असताना, मान्य किंमत असतानाही सौदा बंद होण्यापूर्वी नेहमी माणसाच्या अंतिम मंजुरीची वाट पाहिली जाते.',
        warning: 'आता बॉट मर्यादा किमतीपर्यंत पोहोचताच कोणत्याही मानवी मंजुरीशिवाय स्वतःहून सौदा बंद करू शकतो.',
      },

      scenarios: {
        heading: 'आक्षेप परिस्थिती लायब्ररी',
        subtitle: 'खालील प्रत्येक आक्षेप एका मंजूर प्रतिसाद रणनीतीशी जोडलेला आहे — यापैकी कशाशीही न जुळणारा खरोखर नवीन आक्षेप नेहमी माणसाकडे सोपवला जातो.',
        objectionLabel: {
          price_too_high: '"तुमची किंमत खूप जास्त आहे"',
          competitor_comparison: '"एका स्पर्धकाने कमी किंमत सांगितली"',
          wants_to_delay: '"मला विचार करायचा आहे / उशीर करायचा आहे"',
        },
        strategyLabel: 'प्रतिसाद रणनीती',
        noMatchNote: 'यापैकी कशाशीही स्पष्टपणे न जुळणारा आक्षेप नेहमी माणसाकडे सोपवला जातो, चुकीच्या-फिट तयार उत्तरावर सक्ती केली जात नाही.',
      },

      dashboard: {
        heading: 'थेट निगोशिएशन',
        subtitle: 'अजूनही सुरू असलेली प्रत्येक बॉट-चालित निगोशिएशन, मॅन्युअल टेक-ओव्हर नेहमी उपलब्ध.',
        empty: 'सध्या कोणतीही निगोशिएशन सक्रिय नाही.',
        roundsProgress: 'फेरी {{used}} / {{max}}',
        currentOffer: 'सध्याची ऑफर: {{amount}}',
        floor: 'मर्यादा: {{amount}}',
        takeOver: 'टेक ओव्हर करा',
        openThread: 'संभाषण उघडा',
        takenOverBy: 'तुम्ही {{date}} रोजी टेक ओव्हर केले',
        lastActivity: '{{time}} अद्ययावत',
        status: { bot_active: 'बॉट सक्रिय', escalated: 'एस्कलेटेड', human_takeover: 'माणूस हाताळत आहे' },
        escalationReason: {
          no_scenario_match: 'एस्कलेटेड — ग्राहकाचा आक्षेप कोणत्याही ज्ञात परिस्थितीशी जुळला नाही.',
          max_rounds_reached: 'एस्कलेटेड — कमाल निगोशिएशन फेऱ्या पूर्ण झाल्या.',
          manual_takeover: 'मॅन्युअली टेक ओव्हर केले.',
        },
      },

      toast: {
        saved: 'कॉन्फिगरेशन सेव्ह झाले',
        takenOver: 'तुम्ही ही निगोशिएशन टेक ओव्हर केली आहे',
        error: 'काहीतरी चुकले — पुन्हा प्रयत्न करा',
      },
    },
  },
};

export default translations;
