import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    paymentCollectionDashboard: {
      title: 'Payment Collections',
      subtitle: 'Every deal\'s payment stage, at a glance',
      reminderSettingsLink: 'Reminder settings',
      loading: 'Loading collections',
      error: { title: 'Could not load collections', body: 'Check your connection and try again.' },
      empty: { title: 'No payment stages yet', body: 'Payment stages will appear here once deals are closed.' },
      noResults: { title: 'No matching payment stages', body: 'Try a different filter.' },

      kpi: {
        collected: 'Collected',
        pending: 'Pending',
        overdue: 'Overdue',
        disputed: 'Disputed',
      },

      filters: {
        stageAll: 'All stages',
        severityAll: 'All statuses',
        ownerAll: 'All owners',
      },

      bucket: {
        current: 'Current',
        d30: '1-30 days',
        d60: '31-60 days',
        d90plus: '60+ days',
        disputed: 'Disputed',
      },

      row: {
        daysOverdue: '{{days}} days overdue',
        dueIn: 'Due in {{days}} days',
        dueToday: 'Due today',
        partiallyReceived: '{{amount}} already received',
        large: 'Large receivable — worth prioritising',
        paid: 'Paid',
        refunded: 'Refunded',
        failed: 'Failed',
      },

      detail: {
        ownerLabel: 'Sales owner',
        amountLabel: 'Stage amount',
        receivedLabel: 'Received so far',
        remainingLabel: 'Remaining balance',
        disputeReasonLabel: 'Dispute reason',
        disputedLine: 'This stage is disputed — reminders and escalation are paused for it.',
        manualPaymentLine: 'Recorded manually, ref. {{reference}} on {{date}}.',
        sendReminder: 'Send reminder',
        escalate: 'Escalate',
        markPaid: 'Mark paid manually',
        dispute: 'Dispute',
      },

      markPaidSheet: {
        title: 'Mark paid manually',
        hint: 'For a bank transfer or other payment received outside the app\'s gateway. Always logged with a reference number, separately from an automatic confirmation. A partial amount is fine — the remaining balance stays visible.',
        amountLabel: 'Amount received (₹)',
        referenceLabel: 'Reference number',
        methodLabel: 'Method',
        submit: 'Record payment',
      },

      disputeSheet: {
        title: 'Dispute this stage',
        hint: 'Pauses reminders and escalation for this specific stage only — the deal\'s other stages are unaffected.',
        reasonLabel: 'Reason for the dispute',
        submit: 'Mark as disputed',
      },

      toast: {
        reminderSent: 'Reminder sent',
        escalated: 'Escalated',
        markedPaid: 'Payment recorded',
        partialRecorded: 'Partial payment recorded',
        disputed: 'Marked as disputed',
        error: 'Something went wrong. Please try again.',
      },
    },
  },
  hi: {
    paymentCollectionDashboard: {
      title: 'भुगतान संग्रह',
      subtitle: 'हर डील का भुगतान चरण, एक नज़र में',
      reminderSettingsLink: 'याद-दिलाना सेटिंग्स',
      loading: 'संग्रह लोड हो रहा है',
      error: { title: 'संग्रह लोड नहीं हो सका', body: 'अपना कनेक्शन जांचें और फिर से कोशिश करें।' },
      empty: { title: 'अभी कोई भुगतान चरण नहीं', body: 'डील बंद होने पर भुगतान चरण यहां दिखाई देंगे।' },
      noResults: { title: 'कोई मेल खाता भुगतान चरण नहीं', body: 'कोई अलग फ़िल्टर आज़माएं।' },

      kpi: {
        collected: 'वसूला गया',
        pending: 'बकाया',
        overdue: 'अतिदेय',
        disputed: 'विवादित',
      },

      filters: {
        stageAll: 'सभी चरण',
        severityAll: 'सभी स्थितियां',
        ownerAll: 'सभी मालिक',
      },

      bucket: {
        current: 'चालू',
        d30: '1-30 दिन',
        d60: '31-60 दिन',
        d90plus: '60+ दिन',
        disputed: 'विवादित',
      },

      row: {
        daysOverdue: '{{days}} दिन से अतिदेय',
        dueIn: '{{days}} दिन में देय',
        dueToday: 'आज देय',
        partiallyReceived: '{{amount}} पहले ही मिल चुका है',
        large: 'बड़ी बकाया राशि — प्राथमिकता देने लायक',
        paid: 'भुगतान हो गया',
        refunded: 'वापस किया गया',
        failed: 'विफल',
      },

      detail: {
        ownerLabel: 'बिक्री मालिक',
        amountLabel: 'चरण राशि',
        receivedLabel: 'अब तक प्राप्त',
        remainingLabel: 'शेष राशि',
        disputeReasonLabel: 'विवाद का कारण',
        disputedLine: 'यह चरण विवादित है — इसके लिए याद-दिलाना और एस्केलेशन रोक दिया गया है।',
        manualPaymentLine: 'मैन्युअल रूप से दर्ज किया गया, संदर्भ {{reference}}, {{date}} को।',
        sendReminder: 'याद-दिलाना भेजें',
        escalate: 'एस्केलेट करें',
        markPaid: 'मैन्युअल रूप से भुगतान चिह्नित करें',
        dispute: 'विवाद दर्ज करें',
      },

      markPaidSheet: {
        title: 'मैन्युअल रूप से भुगतान चिह्नित करें',
        hint: 'ऐप के गेटवे के बाहर प्राप्त बैंक ट्रांसफर या अन्य भुगतान के लिए। हमेशा एक संदर्भ संख्या के साथ दर्ज किया जाता है, स्वचालित पुष्टि से अलग। आंशिक राशि भी ठीक है — शेष राशि दिखती रहती है।',
        amountLabel: 'प्राप्त राशि (₹)',
        referenceLabel: 'संदर्भ संख्या',
        methodLabel: 'तरीका',
        submit: 'भुगतान दर्ज करें',
      },

      disputeSheet: {
        title: 'इस चरण पर विवाद दर्ज करें',
        hint: 'केवल इसी चरण के लिए याद-दिलाना और एस्केलेशन रोकता है — डील के बाकी चरण प्रभावित नहीं होते।',
        reasonLabel: 'विवाद का कारण',
        submit: 'विवादित के रूप में चिह्नित करें',
      },

      toast: {
        reminderSent: 'याद-दिलाना भेजा गया',
        escalated: 'एस्केलेट किया गया',
        markedPaid: 'भुगतान दर्ज हो गया',
        partialRecorded: 'आंशिक भुगतान दर्ज हो गया',
        disputed: 'विवादित के रूप में चिह्नित किया गया',
        error: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
      },
    },
  },
  mr: {
    paymentCollectionDashboard: {
      title: 'पेमेंट संकलन',
      subtitle: 'प्रत्येक डीलचा पेमेंट टप्पा, एका दृष्टीक्षेपात',
      reminderSettingsLink: 'स्मरणपत्र सेटिंग्ज',
      loading: 'संकलन लोड होत आहे',
      error: { title: 'संकलन लोड होऊ शकले नाही', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'अजून कोणताही पेमेंट टप्पा नाही', body: 'डील बंद झाल्यावर पेमेंट टप्पे इथे दिसतील.' },
      noResults: { title: 'जुळणारा पेमेंट टप्पा नाही', body: 'वेगळा फिल्टर वापरून पहा.' },

      kpi: {
        collected: 'जमा झाले',
        pending: 'प्रलंबित',
        overdue: 'मुदतबाह्य',
        disputed: 'वादग्रस्त',
      },

      filters: {
        stageAll: 'सर्व टप्पे',
        severityAll: 'सर्व स्थिती',
        ownerAll: 'सर्व मालक',
      },

      bucket: {
        current: 'चालू',
        d30: '1-30 दिवस',
        d60: '31-60 दिवस',
        d90plus: '60+ दिवस',
        disputed: 'वादग्रस्त',
      },

      row: {
        daysOverdue: '{{days}} दिवस मुदतबाह्य',
        dueIn: '{{days}} दिवसांत देय',
        dueToday: 'आज देय',
        partiallyReceived: '{{amount}} आधीच मिळाले आहे',
        large: 'मोठी थकबाकी — प्राधान्य देण्यासारखी',
        paid: 'पेमेंट झाले',
        refunded: 'परत केले',
        failed: 'अयशस्वी',
      },

      detail: {
        ownerLabel: 'विक्री मालक',
        amountLabel: 'टप्प्याची रक्कम',
        receivedLabel: 'आतापर्यंत मिळालेले',
        remainingLabel: 'शिल्लक रक्कम',
        disputeReasonLabel: 'वादाचे कारण',
        disputedLine: 'हा टप्पा वादग्रस्त आहे — यासाठी स्मरणपत्रे आणि एस्केलेशन थांबवले आहे.',
        manualPaymentLine: 'मॅन्युअली नोंदवले, संदर्भ {{reference}}, {{date}} रोजी.',
        sendReminder: 'स्मरणपत्र पाठवा',
        escalate: 'एस्केलेट करा',
        markPaid: 'मॅन्युअली पेमेंट झाले असे नोंदवा',
        dispute: 'वाद नोंदवा',
      },

      markPaidSheet: {
        title: 'मॅन्युअली पेमेंट नोंदवा',
        hint: 'अ‍ॅपच्या गेटवेबाहेर मिळालेल्या बँक ट्रान्सफर किंवा इतर पेमेंटसाठी. नेहमी संदर्भ क्रमांकासह नोंदवले जाते, स्वयंचलित पुष्टीपेक्षा वेगळे. अंशतः रक्कमही चालेल — शिल्लक रक्कम दिसत राहते.',
        amountLabel: 'मिळालेली रक्कम (₹)',
        referenceLabel: 'संदर्भ क्रमांक',
        methodLabel: 'पद्धत',
        submit: 'पेमेंट नोंदवा',
      },

      disputeSheet: {
        title: 'या टप्प्यावर वाद नोंदवा',
        hint: 'फक्त याच टप्प्यासाठी स्मरणपत्रे आणि एस्केलेशन थांबवते — डीलचे इतर टप्पे प्रभावित होत नाहीत.',
        reasonLabel: 'वादाचे कारण',
        submit: 'वादग्रस्त म्हणून चिन्हांकित करा',
      },

      toast: {
        reminderSent: 'स्मरणपत्र पाठवले',
        escalated: 'एस्केलेट केले',
        markedPaid: 'पेमेंट नोंदवले',
        partialRecorded: 'अंशतः पेमेंट नोंदवले',
        disputed: 'वादग्रस्त म्हणून चिन्हांकित केले',
        error: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
