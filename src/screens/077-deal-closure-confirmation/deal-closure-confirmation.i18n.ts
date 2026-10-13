import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    dealClosureConfirmation: {
      title: 'Deal Closure Confirmation',
      loading: 'Loading closure details',
      error: { title: 'Could not load this closure', body: 'Check your connection and try again.' },

      notReady: {
        title: 'Not closed yet',
        body: 'This deal will appear here once both signatures are captured.',
      },

      hero: {
        closedWon: 'Closed Won',
        closedOn: 'Closed on {{date}}',
        dealValue: 'Deal value',
      },

      nextSteps: {
        heading: 'What happens next',
        subtitle: 'Your payment schedule, exactly as agreed.',
        stageDue: 'Due {{date}}',
        delivery: 'Parts reaching {{city}}',
        deliveryDays_one: 'About {{count}} day from dispatch, which 8 in 10 of our last {{trips}} deliveries beat',
        deliveryDays_other: 'About {{count}} days from dispatch, which 8 in 10 of our last {{trips}} deliveries beat',
        deliveryEmerging_one: 'Too early to promise a time: only {{trips}} delivery there so far',
        deliveryEmerging_other: 'Too early to promise a time: only {{trips}} deliveries there so far',
      },

      contact: {
        heading: 'Your point of contact',
        role: 'Site surveyor',
      },

      internalSummary: {
        heading: 'Internal summary',
        dealValue: 'Deal value',
        commission: 'Surveyor commission',
        paymentSchedule: 'Payment schedule',
        paymentScheduleDone: 'Created',
        supplierPo: 'Supplier purchase order',
        supplierPoOk: 'Triggered',
        supplierPoFailed: 'Failed — see Automation Health Monitor',
        viewCelebration: 'View team celebration',
      },

      voidAction: {
        button: 'Void this closure',
        sheetTitle: 'Void this closure',
        sheetHint: 'Logs a fully audited reversal note on this record — it is never deleted.',
        reasonLabel: 'Reason for voiding',
        submit: 'Void closure',
        voidedBanner: 'This closure has been voided',
      },

      toast: {
        voided: 'Closure voided',
        error: 'Something went wrong. Please try again.',
      },
    },
  },
  hi: {
    dealClosureConfirmation: {
      title: 'डील क्लोज़र पुष्टिकरण',
      loading: 'क्लोज़र विवरण लोड हो रहे हैं',
      error: { title: 'यह क्लोज़र लोड नहीं हो सका', body: 'अपना कनेक्शन जांचें और फिर से कोशिश करें।' },

      notReady: {
        title: 'अभी बंद नहीं हुई',
        body: 'दोनों हस्ताक्षर दर्ज होते ही यह डील यहां दिखाई देगी।',
      },

      hero: {
        closedWon: 'डील बंद — जीती गई',
        closedOn: '{{date}} को बंद हुई',
        dealValue: 'डील की कीमत',
      },

      nextSteps: {
        heading: 'आगे क्या होगा',
        subtitle: 'आपकी भुगतान योजना, ठीक वैसी जैसी तय हुई थी।',
        stageDue: '{{date}} को देय',
        delivery: '{{city}} तक पार्ट्स का पहुँचना',
        deliveryDays_one: 'डिस्पैच से लगभग {{count}} दिन, जिसे हमारी पिछली {{trips}} डिलीवरी में से 10 में से 8 ने पूरा किया',
        deliveryDays_other: 'डिस्पैच से लगभग {{count}} दिन, जिसे हमारी पिछली {{trips}} डिलीवरी में से 10 में से 8 ने पूरा किया',
        deliveryEmerging_one: 'समय का वादा करना अभी जल्दबाज़ी होगी: वहाँ अब तक सिर्फ़ {{trips}} डिलीवरी हुई',
        deliveryEmerging_other: 'समय का वादा करना अभी जल्दबाज़ी होगी: वहाँ अब तक सिर्फ़ {{trips}} डिलीवरी हुईं',
      },

      contact: {
        heading: 'आपका संपर्क व्यक्ति',
        role: 'साइट सर्वेयर',
      },

      internalSummary: {
        heading: 'आंतरिक सारांश',
        dealValue: 'डील की कीमत',
        commission: 'सर्वेयर कमीशन',
        paymentSchedule: 'भुगतान अनुसूची',
        paymentScheduleDone: 'तैयार हो गई',
        supplierPo: 'आपूर्तिकर्ता खरीद आदेश',
        supplierPoOk: 'भेजा गया',
        supplierPoFailed: 'विफल — ऑटोमेशन हेल्थ मॉनिटर देखें',
        viewCelebration: 'टीम उत्सव देखें',
      },

      voidAction: {
        button: 'यह क्लोज़र रद्द करें',
        sheetTitle: 'यह क्लोज़र रद्द करें',
        sheetHint: 'इस रिकॉर्ड पर एक पूरी तरह ऑडिट की गई रद्दीकरण टिप्पणी दर्ज करता है — इसे कभी मिटाया नहीं जाता।',
        reasonLabel: 'रद्द करने का कारण',
        submit: 'क्लोज़र रद्द करें',
        voidedBanner: 'इस क्लोज़र को रद्द कर दिया गया है',
      },

      toast: {
        voided: 'क्लोज़र रद्द हो गया',
        error: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
      },
    },
  },
  mr: {
    dealClosureConfirmation: {
      title: 'डील क्लोजर पुष्टीकरण',
      loading: 'क्लोजर तपशील लोड होत आहेत',
      error: { title: 'हे क्लोजर लोड होऊ शकले नाही', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },

      notReady: {
        title: 'अजून बंद झालेली नाही',
        body: 'दोन्ही स्वाक्षऱ्या नोंदल्या की ही डील इथे दिसेल.',
      },

      hero: {
        closedWon: 'डील बंद — जिंकली',
        closedOn: '{{date}} रोजी बंद झाली',
        dealValue: 'डीलची किंमत',
      },

      nextSteps: {
        heading: 'पुढे काय होईल',
        subtitle: 'तुमची पेमेंट योजना, ठरल्याप्रमाणे तंतोतंत.',
        stageDue: '{{date}} रोजी देय',
        delivery: '{{city}} पर्यंत पार्ट्स पोहोचणं',
        deliveryDays_one: 'डिस्पॅचपासून साधारण {{count}} दिवस, जे आमच्या शेवटच्या {{trips}} डिलिव्हऱ्यांपैकी 10 पैकी 8 ने पाळलं',
        deliveryDays_other: 'डिस्पॅचपासून साधारण {{count}} दिवस, जे आमच्या शेवटच्या {{trips}} डिलिव्हऱ्यांपैकी 10 पैकी 8 ने पाळलं',
        deliveryEmerging_one: 'वेळेचा शब्द देणं अजून घाईचं: तिथे आतापर्यंत फक्त {{trips}} डिलिव्हरी झाली',
        deliveryEmerging_other: 'वेळेचा शब्द देणं अजून घाईचं: तिथे आतापर्यंत फक्त {{trips}} डिलिव्हऱ्या झाल्या',
      },

      contact: {
        heading: 'तुमची संपर्क व्यक्ती',
        role: 'साइट सर्वेक्षक',
      },

      internalSummary: {
        heading: 'अंतर्गत सारांश',
        dealValue: 'डीलची किंमत',
        commission: 'सर्वेक्षक कमिशन',
        paymentSchedule: 'पेमेंट वेळापत्रक',
        paymentScheduleDone: 'तयार झाले',
        supplierPo: 'पुरवठादार खरेदी ऑर्डर',
        supplierPoOk: 'पाठवली',
        supplierPoFailed: 'अयशस्वी — ऑटोमेशन हेल्थ मॉनिटर पहा',
        viewCelebration: 'टीम उत्सव पहा',
      },

      voidAction: {
        button: 'हे क्लोजर रद्द करा',
        sheetTitle: 'हे क्लोजर रद्द करा',
        sheetHint: 'या नोंदीवर पूर्णपणे ऑडिट केलेली रद्दीकरण नोंद ठेवते — ती कधीही हटवली जात नाही.',
        reasonLabel: 'रद्द करण्याचे कारण',
        submit: 'क्लोजर रद्द करा',
        voidedBanner: 'हे क्लोजर रद्द केले गेले आहे',
      },

      toast: {
        voided: 'क्लोजर रद्द झाले',
        error: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
