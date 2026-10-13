import type { ScreenTranslations } from '@/i18n/types';

/**
 * Screen 056 owns the `bot.*` namespace — the simulator's canned replies and
 * escalation reasons, returned from the repository as translation keys
 * rather than baked English so the simulator stays real in all 3 languages.
 */
const translations: ScreenTranslations = {
  en: {
    bot: {
      reply: {
        discountCapped: 'I can offer up to {{maxPct}}% — let me have our team confirm anything beyond that.',
        discountApproved: 'Happy to offer {{pct}}% on this — within what I’m able to approve directly.',
        generic: 'Thanks for the message — someone from our team will follow up shortly.',
      },
      escalate: {
        sensitiveTopic: 'This needs a person — the topic is outside what the bot handles automatically.',
        lowConfidence: 'Confidence was below the configured threshold, so this hands off to a human.',
      },
    },
    aiBotConfig: {
      title: 'AI bot configuration',
      subtitle: 'The control surface for the auto-negotiate bot — its rules here govern every live conversation.',
      loading: 'Loading bot configuration',
      error: { title: 'Could not load bot configuration', body: 'Check your connection and try again.' },
      stats: {
        autoResolved: 'Auto-resolved',
        escalated: 'Escalated to human',
      },
      persona: {
        heading: 'Persona',
        toneLabel: 'Tone',
        tone: {
          professional: 'Professional',
          warm: 'Warm',
          concise: 'Concise',
        },
      },
      discount: {
        heading: 'Discount boundaries',
        hint: 'The bot can never independently offer beyond this range. The Quotation Engine’s margin floor caps the maximum at {{maxPct}}%, regardless of what a conversation seems to call for.',
        minLabel: 'Minimum %',
        maxLabel: 'Maximum %',
        marginFloorError: 'Above {{maxPct}}% risks a loss-making sale — lower the maximum to save.',
        rangeInvalid: 'Minimum can’t be higher than maximum.',
      },
      escalation: {
        heading: 'Escalation',
        thresholdLabel: 'Confidence threshold',
        hint: 'Below this confidence, the bot always hands off to a human rather than guessing.',
        lowConfidenceWarning: 'A low threshold auto-resolves more conversations, but raises the risk of a poor customer experience reaching someone un-reviewed.',
      },
      save: 'Save configuration',
      simulator: {
        heading: 'Simulator',
        subtitle: 'Test a hypothetical customer reply before going live.',
        placeholder: 'e.g. "Can you do 20% off?"',
        run: 'Test reply',
        empty: { title: 'No test run yet', body: 'Type a sample customer message and run a test to see how the bot would respond.' },
        confidence: 'Confidence: {{pct}}%',
        autoResolvedBadge: 'Auto-resolved',
        escalatedBadge: 'Escalated',
        testingUnsaved: 'Testing your unsaved changes — save to apply them to live conversations.',
      },
      toast: {
        saved: 'Configuration saved',
        error: 'Could not save — try again.',
      },
    },
  },

  hi: {
    bot: {
      reply: {
        discountCapped: 'मैं {{maxPct}}% तक की छूट दे सकता हूँ — इससे ज़्यादा के लिए हमारी टीम से पुष्टि करवाता हूँ।',
        discountApproved: 'इस पर {{pct}}% देने में खुशी होगी — यह मेरी सीधे मंज़ूरी की सीमा में है।',
        generic: 'संदेश के लिए धन्यवाद — हमारी टीम से कोई जल्द ही संपर्क करेगा।',
      },
      escalate: {
        sensitiveTopic: 'इसके लिए किसी व्यक्ति की ज़रूरत है — यह विषय बॉट की स्वचालित सीमा से बाहर है।',
        lowConfidence: 'भरोसा तय सीमा से कम था, इसलिए यह किसी व्यक्ति को सौंपा जा रहा है।',
      },
    },
    aiBotConfig: {
      title: 'AI बॉट कॉन्फ़िगरेशन',
      subtitle: 'ऑटो-नेगोशिएट बॉट का नियंत्रण केंद्र — यहाँ के नियम हर लाइव बातचीत को नियंत्रित करते हैं।',
      loading: 'बॉट कॉन्फ़िगरेशन लोड हो रहा है',
      error: { title: 'बॉट कॉन्फ़िगरेशन लोड नहीं हो पाया', body: 'नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।' },
      stats: {
        autoResolved: 'स्वतः हल हुए',
        escalated: 'व्यक्ति को सौंपे गए',
      },
      persona: {
        heading: 'व्यक्तित्व',
        toneLabel: 'लहजा',
        tone: {
          professional: 'पेशेवर',
          warm: 'आत्मीय',
          concise: 'संक्षिप्त',
        },
      },
      discount: {
        heading: 'छूट की सीमाएँ',
        hint: 'बॉट कभी भी इस सीमा से आगे स्वतः छूट नहीं दे सकता। कोटेशन इंजन की मार्जिन सीमा अधिकतम {{maxPct}}% तक सीमित करती है, बातचीत चाहे जो भी माँगे।',
        minLabel: 'न्यूनतम %',
        maxLabel: 'अधिकतम %',
        marginFloorError: '{{maxPct}}% से ऊपर घाटे का जोखिम है — सहेजने के लिए अधिकतम घटाएँ।',
        rangeInvalid: 'न्यूनतम, अधिकतम से ज़्यादा नहीं हो सकता।',
      },
      escalation: {
        heading: 'एस्केलेशन',
        thresholdLabel: 'भरोसा सीमा',
        hint: 'इस भरोसे से कम पर, बॉट अंदाज़ा लगाने की बजाय हमेशा किसी व्यक्ति को सौंपता है।',
        lowConfidenceWarning: 'कम सीमा से ज़्यादा बातचीत स्वतः हल होती हैं, लेकिन बिना जाँचे किसी ग्राहक तक खराब अनुभव पहुँचने का जोखिम भी बढ़ता है।',
      },
      save: 'कॉन्फ़िगरेशन सहेजें',
      simulator: {
        heading: 'सिम्युलेटर',
        subtitle: 'लाइव जाने से पहले एक काल्पनिक ग्राहक जवाब आज़माएँ।',
        placeholder: 'जैसे "क्या 20% छूट मिल सकती है?"',
        run: 'जवाब आज़माएँ',
        empty: { title: 'अभी कोई परीक्षण नहीं', body: 'एक नमूना ग्राहक संदेश लिखें और देखें कि बॉट कैसे जवाब देगा।' },
        confidence: 'भरोसा: {{pct}}%',
        autoResolvedBadge: 'स्वतः हल',
        escalatedBadge: 'सौंपा गया',
        testingUnsaved: 'आपके बिना सहेजे बदलाव आज़माए जा रहे हैं — लाइव बातचीत में लागू करने के लिए सहेजें।',
      },
      toast: {
        saved: 'कॉन्फ़िगरेशन सहेजा गया',
        error: 'सहेजा नहीं जा सका — दोबारा कोशिश करें।',
      },
    },
  },

  mr: {
    bot: {
      reply: {
        discountCapped: 'मी {{maxPct}}% पर्यंत सूट देऊ शकतो — त्याहून जास्तसाठी आमची टीम पुष्टी करेल.',
        discountApproved: 'यावर {{pct}}% देण्यात आनंद आहे — ही थेट माझ्या मान्यतेच्या मर्यादेत आहे.',
        generic: 'संदेशाबद्दल धन्यवाद — आमच्या टीमकडून लवकरच संपर्क केला जाईल.',
      },
      escalate: {
        sensitiveTopic: 'यासाठी एका व्यक्तीची गरज आहे — हा विषय बॉटच्या स्वयंचलित मर्यादेबाहेर आहे.',
        lowConfidence: 'विश्वासार्हता ठरवलेल्या मर्यादेपेक्षा कमी होती, म्हणून हे एका व्यक्तीकडे सोपवले जात आहे.',
      },
    },
    aiBotConfig: {
      title: 'AI बॉट कॉन्फिगरेशन',
      subtitle: 'ऑटो-निगोशिएट बॉटचे नियंत्रण केंद्र — इथले नियम प्रत्येक लाइव्ह संभाषण नियंत्रित करतात.',
      loading: 'बॉट कॉन्फिगरेशन लोड होत आहे',
      error: { title: 'बॉट कॉन्फिगरेशन लोड होऊ शकले नाही', body: 'नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.' },
      stats: {
        autoResolved: 'आपोआप सुटलेले',
        escalated: 'व्यक्तीकडे सोपवलेले',
      },
      persona: {
        heading: 'व्यक्तिमत्व',
        toneLabel: 'सूर',
        tone: {
          professional: 'व्यावसायिक',
          warm: 'आपुलकीचा',
          concise: 'संक्षिप्त',
        },
      },
      discount: {
        heading: 'सूट मर्यादा',
        hint: 'बॉट कधीही या मर्यादेपलीकडे स्वतःहून सूट देऊ शकत नाही. कोटेशन इंजिनची मार्जिन मर्यादा जास्तीत जास्त {{maxPct}}% पर्यंत मर्यादित करते, संभाषण काहीही मागत असले तरी.',
        minLabel: 'किमान %',
        maxLabel: 'कमाल %',
        marginFloorError: '{{maxPct}}% पेक्षा जास्त तोट्याचा धोका आहे — जतन करण्यासाठी कमाल कमी करा.',
        rangeInvalid: 'किमान, कमालपेक्षा जास्त असू शकत नाही.',
      },
      escalation: {
        heading: 'एस्कलेशन',
        thresholdLabel: 'विश्वासार्हता मर्यादा',
        hint: 'या विश्वासार्हतेपेक्षा कमी असल्यास, बॉट अंदाज लावण्याऐवजी नेहमी व्यक्तीकडे सोपवतो.',
        lowConfidenceWarning: 'कमी मर्यादेमुळे जास्त संभाषणे आपोआप सुटतात, पण न तपासता ग्राहकापर्यंत वाईट अनुभव पोहोचण्याचा धोकाही वाढतो.',
      },
      save: 'कॉन्फिगरेशन जतन करा',
      simulator: {
        heading: 'सिम्युलेटर',
        subtitle: 'लाइव्ह जाण्यापूर्वी काल्पनिक ग्राहक प्रतिसाद तपासा.',
        placeholder: 'उदा. "20% सूट मिळेल का?"',
        run: 'प्रतिसाद तपासा',
        empty: { title: 'अजून कोणतीही चाचणी नाही', body: 'एक नमुना ग्राहक संदेश लिहा आणि बॉट कसा प्रतिसाद देईल ते पहा.' },
        confidence: 'विश्वासार्हता: {{pct}}%',
        autoResolvedBadge: 'आपोआप सुटले',
        escalatedBadge: 'सोपवले',
        testingUnsaved: 'तुमचे न जतन केलेले बदल तपासले जात आहेत — लाइव्ह संभाषणांत लागू करण्यासाठी जतन करा.',
      },
      toast: {
        saved: 'कॉन्फिगरेशन जतन झाले',
        error: 'जतन करता आले नाही — पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
