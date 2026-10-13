import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    callLog: {
      title: 'Call log',
      subtitle: 'Every outcome flows straight into the right next CRM action.',
      loading: 'Loading calls',
      error: { title: 'Could not load the call log', body: 'Check your connection and try again.' },
      empty: { title: 'No calls yet', body: 'Calls placed or logged for a lead will appear here.' },
      callSection: {
        heading: 'Call a lead',
        pickLead: 'Choose a lead',
        callNow: 'Call now',
        logManually: 'Log a call manually',
      },
      manualSheet: {
        title: 'Log a call',
        outcomeLabel: 'Outcome',
        durationLabel: 'Duration (seconds)',
        consentLabel: 'Contact consented to this call being recorded',
        confirm: 'Save call',
      },
      outcome: {
        connected_interested: 'Connected — interested',
        connected_not_interested: 'Connected — not interested',
        no_answer: 'No answer',
        wrong_number: 'Wrong number',
        pocket_dial: 'Pocket dial',
      },
      needsDisposition: 'Needs disposition',
      dispositionReminder: 'This call hasn’t been logged yet — a quick disposition keeps the record accurate.',
      switchChannelSuggestion: 'Three unanswered calls in a row — consider switching to WhatsApp first for this lead.',
      durationLabel: 'Duration: {{duration}}',
      loggedByManual: 'Logged manually',
      dispositionPrompt: 'How did it go?',
      toast: {
        logged: 'Call logged',
        dispositioned: 'Outcome saved',
        error: 'Could not save — try again.',
      },
    },
  },

  hi: {
    callLog: {
      title: 'कॉल लॉग',
      subtitle: 'हर नतीजा सीधे सही अगले CRM एक्शन में जाता है।',
      loading: 'कॉल लोड हो रहे हैं',
      error: { title: 'कॉल लॉग लोड नहीं हो पाया', body: 'नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।' },
      empty: { title: 'अभी कोई कॉल नहीं', body: 'किसी लीड के लिए की गई या दर्ज की गई कॉल यहाँ दिखेंगी।' },
      callSection: {
        heading: 'लीड को कॉल करें',
        pickLead: 'एक लीड चुनें',
        callNow: 'अभी कॉल करें',
        logManually: 'हाथ से कॉल दर्ज करें',
      },
      manualSheet: {
        title: 'कॉल दर्ज करें',
        outcomeLabel: 'नतीजा',
        durationLabel: 'अवधि (सेकंड)',
        consentLabel: 'संपर्क ने इस कॉल की रिकॉर्डिंग के लिए सहमति दी',
        confirm: 'कॉल सहेजें',
      },
      outcome: {
        connected_interested: 'जुड़ा — रुचि है',
        connected_not_interested: 'जुड़ा — रुचि नहीं',
        no_answer: 'जवाब नहीं मिला',
        wrong_number: 'ग़लत नंबर',
        pocket_dial: 'पॉकेट डायल',
      },
      needsDisposition: 'नतीजा दर्ज करना बाकी',
      dispositionReminder: 'यह कॉल अभी तक दर्ज नहीं हुई — जल्दी नतीजा दर्ज करने से रिकॉर्ड सही रहता है।',
      switchChannelSuggestion: 'लगातार तीन कॉल का जवाब नहीं मिला — इस लीड के लिए पहले व्हाट्सऐप आज़माने पर विचार करें।',
      durationLabel: 'अवधि: {{duration}}',
      loggedByManual: 'हाथ से दर्ज',
      dispositionPrompt: 'कैसा रहा?',
      toast: {
        logged: 'कॉल दर्ज हुई',
        dispositioned: 'नतीजा सहेजा गया',
        error: 'सहेजा नहीं जा सका — दोबारा कोशिश करें।',
      },
    },
  },

  mr: {
    callLog: {
      title: 'कॉल लॉग',
      subtitle: 'प्रत्येक निकाल थेट योग्य पुढच्या CRM कृतीत जातो.',
      loading: 'कॉल लोड होत आहेत',
      error: { title: 'कॉल लॉग लोड होऊ शकला नाही', body: 'नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'अजून कोणतेही कॉल नाहीत', body: 'एखाद्या लीडसाठी केलेले किंवा नोंदवलेले कॉल इथे दिसतील.' },
      callSection: {
        heading: 'लीडला कॉल करा',
        pickLead: 'एक लीड निवडा',
        callNow: 'आत्ता कॉल करा',
        logManually: 'हाताने कॉल नोंदवा',
      },
      manualSheet: {
        title: 'कॉल नोंदवा',
        outcomeLabel: 'निकाल',
        durationLabel: 'कालावधी (सेकंद)',
        consentLabel: 'संपर्काने या कॉलच्या रेकॉर्डिंगसाठी संमती दिली',
        confirm: 'कॉल जतन करा',
      },
      outcome: {
        connected_interested: 'जोडले — स्वारस्य आहे',
        connected_not_interested: 'जोडले — स्वारस्य नाही',
        no_answer: 'प्रतिसाद मिळाला नाही',
        wrong_number: 'चुकीचा नंबर',
        pocket_dial: 'पॉकेट डायल',
      },
      needsDisposition: 'निकाल नोंदवणे बाकी',
      dispositionReminder: 'हा कॉल अजून नोंदवलेला नाही — पटकन निकाल नोंदवल्याने नोंद अचूक राहते.',
      switchChannelSuggestion: 'सलग तीन कॉलना प्रतिसाद मिळाला नाही — या लीडसाठी आधी व्हॉट्सअ‍ॅप वापरण्याचा विचार करा.',
      durationLabel: 'कालावधी: {{duration}}',
      loggedByManual: 'हाताने नोंदवले',
      dispositionPrompt: 'कसे झाले?',
      toast: {
        logged: 'कॉल नोंदवला',
        dispositioned: 'निकाल जतन झाला',
        error: 'जतन करता आले नाही — पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
