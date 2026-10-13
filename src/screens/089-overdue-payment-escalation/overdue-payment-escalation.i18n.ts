import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    overduePaymentEscalation: {
      title: 'Overdue Payment Escalation',
      subtitle: 'Cases automation alone couldn\'t resolve — your judgment call',
      loading: 'Loading escalation queue',
      error: { title: 'Could not load the escalation queue', body: 'Check your connection and try again.' },
      empty: { title: 'Nothing needs your judgment right now', body: 'Every overdue payment is either current, being handled, or still inside the automated reminder cadence.' },
      noResults: { title: 'No cases at this tier', body: 'Try a different filter.' },

      filters: { all: 'All tiers' },

      tier: {
        call: 'Gentle Call Needed',
        formal_notice: 'Formal Notice',
        installation_hold: 'Consider Installation Hold',
      },

      row: {
        overdueDays: '{{days}} days overdue',
        goodStanding: 'Reliable customer — other payments in order',
        safetyWarning: 'Technician mid-safety-critical step on site',
      },

      detail: {
        overdueAmountLabel: 'Overdue amount',
        overdueDaysLabel: 'Overdue by',
        tierLabel: 'Recommended tier',
        goodStandingNote: 'This customer\'s other payments are all paid or not yet due — weigh that before escalating hard.',
        activeJobsLabel: 'Active installation jobs',
        noActiveJobs: 'None',
        logCall: 'Log a call outcome',
        sendNotice: 'Send formal notice',
        flagHold: 'Flag to pause installation',
        viewHistory: 'View deal & communication history',
      },

      callSheet: {
        title: 'Log a call outcome',
        outcomeLabel: 'Outcome',
        durationLabel: 'Duration (seconds)',
        consentLabel: 'Customer consented to the call being logged',
        submit: 'Save call outcome',
      },

      holdSheet: {
        title: 'Flag to pause installation',
        hint: 'This is a serious, logged decision that stops active installation work on this deal until the payment is resolved. It appends permanently to the deal\'s record.',
        elevatedWarning: 'A technician is currently mid-way through a safety-critical step on site. Pausing now has real, immediate operational impact — confirm you understand before proceeding.',
        reasonLabel: 'Reason (required)',
        acknowledgeLabel: 'I understand this pauses active installation work and have considered the operational impact.',
        submit: 'Confirm pause',
      },

      outcome: {
        connected_interested: 'Connected — Interested',
        connected_not_interested: 'Connected — Not interested',
        no_answer: 'No answer',
        wrong_number: 'Wrong number',
        pocket_dial: 'Pocket dial',
      },

      toast: {
        callLogged: 'Call outcome logged',
        noticeSent: 'Formal notice sent',
        holdFlagged: 'Installation paused',
        error: 'Something went wrong',
      },
    },
  },
  hi: {
    overduePaymentEscalation: {
      title: 'बकाया भुगतान एस्केलेशन',
      subtitle: 'ऐसे मामले जिन्हें अकेले ऑटोमेशन हल नहीं कर सका — आपका निर्णय जरूरी है',
      loading: 'एस्केलेशन सूची लोड हो रही है',
      error: { title: 'एस्केलेशन सूची लोड नहीं हो सकी', body: 'अपना कनेक्शन जांचें और फिर से प्रयास करें।' },
      empty: { title: 'अभी आपके निर्णय की जरूरत नहीं है', body: 'हर बकाया भुगतान या तो चालू है, संभाला जा रहा है, या अभी भी स्वचालित रिमाइंडर चक्र के भीतर है।' },
      noResults: { title: 'इस स्तर पर कोई मामला नहीं', body: 'एक अलग फ़िल्टर आज़माएं।' },

      filters: { all: 'सभी स्तर' },

      tier: {
        call: 'सौम्य कॉल जरूरी',
        formal_notice: 'औपचारिक सूचना',
        installation_hold: 'इंस्टॉलेशन रोकने पर विचार करें',
      },

      row: {
        overdueDays: '{{days}} दिन बकाया',
        goodStanding: 'भरोसेमंद ग्राहक — अन्य भुगतान व्यवस्थित हैं',
        safetyWarning: 'तकनीशियन साइट पर सुरक्षा-महत्वपूर्ण चरण के बीच में है',
      },

      detail: {
        overdueAmountLabel: 'बकाया राशि',
        overdueDaysLabel: 'कितने दिन बकाया',
        tierLabel: 'अनुशंसित स्तर',
        goodStandingNote: 'इस ग्राहक के अन्य सभी भुगतान या तो चुकाए जा चुके हैं या अभी देय नहीं हैं — कठोरता से एस्केलेट करने से पहले इसे तौलें।',
        activeJobsLabel: 'सक्रिय इंस्टॉलेशन कार्य',
        noActiveJobs: 'कोई नहीं',
        logCall: 'कॉल का परिणाम दर्ज करें',
        sendNotice: 'औपचारिक सूचना भेजें',
        flagHold: 'इंस्टॉलेशन रोकने के लिए फ़्लैग करें',
        viewHistory: 'डील और संचार इतिहास देखें',
      },

      callSheet: {
        title: 'कॉल का परिणाम दर्ज करें',
        outcomeLabel: 'परिणाम',
        durationLabel: 'अवधि (सेकंड)',
        consentLabel: 'ग्राहक ने कॉल दर्ज करने पर सहमति दी',
        submit: 'कॉल परिणाम सहेजें',
      },

      holdSheet: {
        title: 'इंस्टॉलेशन रोकने के लिए फ़्लैग करें',
        hint: 'यह एक गंभीर, दर्ज किया जाने वाला निर्णय है जो भुगतान हल होने तक इस डील पर सक्रिय इंस्टॉलेशन कार्य रोक देता है। यह डील के रिकॉर्ड में स्थायी रूप से जुड़ जाता है।',
        elevatedWarning: 'एक तकनीशियन इस समय साइट पर एक सुरक्षा-महत्वपूर्ण चरण के बीच में है। अभी रोकने का वास्तविक, तत्काल परिचालन प्रभाव है — आगे बढ़ने से पहले पुष्टि करें कि आप यह समझते हैं।',
        reasonLabel: 'कारण (आवश्यक)',
        acknowledgeLabel: 'मैं समझता/समझती हूं कि इससे सक्रिय इंस्टॉलेशन कार्य रुक जाएगा, और मैंने परिचालन प्रभाव पर विचार कर लिया है।',
        submit: 'रोक की पुष्टि करें',
      },

      outcome: {
        connected_interested: 'जुड़ा — रुचि है',
        connected_not_interested: 'जुड़ा — रुचि नहीं है',
        no_answer: 'कोई जवाब नहीं',
        wrong_number: 'गलत नंबर',
        pocket_dial: 'गलती से डायल',
      },

      toast: {
        callLogged: 'कॉल का परिणाम दर्ज हुआ',
        noticeSent: 'औपचारिक सूचना भेजी गई',
        holdFlagged: 'इंस्टॉलेशन रोक दिया गया',
        error: 'कुछ गलत हो गया',
      },
    },
  },
  mr: {
    overduePaymentEscalation: {
      title: 'थकीत पेमेंट एस्केलेशन',
      subtitle: 'अशी प्रकरणे जी केवळ ऑटोमेशनने सोडवली गेली नाहीत — तुमचा निर्णय आवश्यक',
      loading: 'एस्केलेशन यादी लोड होत आहे',
      error: { title: 'एस्केलेशन यादी लोड होऊ शकली नाही', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'सध्या तुमच्या निर्णयाची गरज नाही', body: 'प्रत्येक थकीत पेमेंट एकतर चालू आहे, हाताळले जात आहे, किंवा अजूनही स्वयंचलित स्मरणपत्र चक्रात आहे.' },
      noResults: { title: 'या स्तरावर कोणतीही प्रकरणे नाहीत', body: 'वेगळा फिल्टर वापरून पहा.' },

      filters: { all: 'सर्व स्तर' },

      tier: {
        call: 'सौम्य कॉल आवश्यक',
        formal_notice: 'औपचारिक सूचना',
        installation_hold: 'इंस्टॉलेशन थांबवण्याचा विचार करा',
      },

      row: {
        overdueDays: '{{days}} दिवस थकीत',
        goodStanding: 'विश्वासार्ह ग्राहक — इतर पेमेंट व्यवस्थित आहेत',
        safetyWarning: 'तंत्रज्ञ साइटवर सुरक्षा-महत्त्वाच्या टप्प्याच्या मध्यावर आहे',
      },

      detail: {
        overdueAmountLabel: 'थकीत रक्कम',
        overdueDaysLabel: 'किती दिवस थकीत',
        tierLabel: 'शिफारस केलेला स्तर',
        goodStandingNote: 'या ग्राहकाची इतर सर्व पेमेंट्स एकतर भरलेली आहेत किंवा अजून देय नाहीत — कठोरपणे एस्केलेट करण्यापूर्वी हे लक्षात घ्या.',
        activeJobsLabel: 'सक्रिय इंस्टॉलेशन कामे',
        noActiveJobs: 'काहीही नाही',
        logCall: 'कॉलचा निकाल नोंदवा',
        sendNotice: 'औपचारिक सूचना पाठवा',
        flagHold: 'इंस्टॉलेशन थांबवण्यासाठी फ्लॅग करा',
        viewHistory: 'डील आणि संवाद इतिहास पहा',
      },

      callSheet: {
        title: 'कॉलचा निकाल नोंदवा',
        outcomeLabel: 'निकाल',
        durationLabel: 'कालावधी (सेकंद)',
        consentLabel: 'ग्राहकाने कॉल नोंदवण्यास संमती दिली',
        submit: 'कॉल निकाल जतन करा',
      },

      holdSheet: {
        title: 'इंस्टॉलेशन थांबवण्यासाठी फ्लॅग करा',
        hint: 'हा एक गंभीर, नोंदवला जाणारा निर्णय आहे जो पेमेंट निकाली निघेपर्यंत या डीलवरील सक्रिय इंस्टॉलेशन काम थांबवतो. हे डीलच्या नोंदीत कायमचे जोडले जाते.',
        elevatedWarning: 'एक तंत्रज्ञ सध्या साइटवर सुरक्षा-महत्त्वाच्या टप्प्याच्या मध्यावर आहे. आत्ता थांबवण्याचा खरा, तात्काळ कार्यरत परिणाम होतो — पुढे जाण्यापूर्वी तुम्हाला हे समजले आहे याची खात्री करा.',
        reasonLabel: 'कारण (आवश्यक)',
        acknowledgeLabel: 'मला समजते की यामुळे सक्रिय इंस्टॉलेशन काम थांबेल, आणि मी कार्यरत परिणामाचा विचार केला आहे.',
        submit: 'थांबवण्याची पुष्टी करा',
      },

      outcome: {
        connected_interested: 'जोडले — स्वारस्य आहे',
        connected_not_interested: 'जोडले — स्वारस्य नाही',
        no_answer: 'उत्तर नाही',
        wrong_number: 'चुकीचा नंबर',
        pocket_dial: 'चुकून डायल',
      },

      toast: {
        callLogged: 'कॉल निकाल नोंदवला',
        noticeSent: 'औपचारिक सूचना पाठवली',
        holdFlagged: 'इंस्टॉलेशन थांबवले',
        error: 'काहीतरी चुकले',
      },
    },
  },
};

export default translations;
