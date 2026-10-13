import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    paymentGatewayCheckout: {
      title: 'Pay Online',
      loading: 'Loading your payment',
      notFound: { title: 'Payment link not valid', body: "This payment link doesn't match your account, or the stage no longer exists. Please ask AIEC for a fresh link." },
      error: { title: 'Could not load this payment', body: 'Check your connection and try again.' },

      summary: {
        heading: "You're paying",
        site: 'Site',
        deal: 'Deal',
        stage: 'Stage',
        amountDue: 'Amount due',
        partialNote: 'Part of this stage is already paid — this is the balance still owed.',
      },

      method: {
        heading: 'Pay with',
        upi: 'UPI',
        card: 'Card',
        netbanking: 'Net Banking',
      },

      actionBar: {
        pay: 'Pay {{amount}}',
        retry: 'Retry payment',
      },

      processing: {
        title: 'Processing your payment',
        body: "Don't close this screen — this only takes a moment.",
      },

      awaitingConfirmation: {
        title: 'Confirming with your bank',
        body: 'Your bank has accepted the payment — we\'re waiting for its final confirmation. This can take a minute.',
        checkingNote: "We'll update this automatically. You can also come back to this link later — it'll show the confirmed result.",
      },

      failed: {
        title: "That payment didn't go through",
        body: 'This looked like a bank timeout — nothing was charged. Please try again.',
      },

      alreadyPaid: {
        title: 'This stage is already paid',
        body: "There's nothing more to pay here — this stage was already settled, possibly through a different payment method.",
      },

      receipt: {
        heading: 'Payment received',
        amountPaid: 'Amount paid',
        method: 'Method',
        reference: 'Reference',
        paidAt: 'Paid on',
        done: 'Done',
      },
    },
  },
  hi: {
    paymentGatewayCheckout: {
      title: 'ऑनलाइन भुगतान करें',
      loading: 'आपका भुगतान लोड हो रहा है',
      notFound: { title: 'भुगतान लिंक मान्य नहीं है', body: 'यह भुगतान लिंक आपके खाते से मेल नहीं खाता, या यह चरण अब मौजूद नहीं है। कृपया AIEC से नया लिंक मांगें।' },
      error: { title: 'यह भुगतान लोड नहीं हो सका', body: 'अपना कनेक्शन जांचें और फिर से कोशिश करें।' },

      summary: {
        heading: 'आप भुगतान कर रहे हैं',
        site: 'साइट',
        deal: 'डील',
        stage: 'चरण',
        amountDue: 'देय राशि',
        partialNote: 'इस चरण का कुछ हिस्सा पहले ही भुगतान किया जा चुका है — यह अभी बकाया शेष राशि है।',
      },

      method: {
        heading: 'इससे भुगतान करें',
        upi: 'UPI',
        card: 'कार्ड',
        netbanking: 'नेट बैंकिंग',
      },

      actionBar: {
        pay: '{{amount}} भुगतान करें',
        retry: 'फिर से भुगतान करें',
      },

      processing: {
        title: 'आपका भुगतान प्रोसेस हो रहा है',
        body: 'इस स्क्रीन को बंद न करें — इसमें बस एक पल लगेगा।',
      },

      awaitingConfirmation: {
        title: 'आपके बैंक से पुष्टि की जा रही है',
        body: 'आपके बैंक ने भुगतान स्वीकार कर लिया है — हम इसकी अंतिम पुष्टि का इंतज़ार कर रहे हैं। इसमें एक मिनट लग सकता है।',
        checkingNote: 'हम इसे अपने आप अपडेट कर देंगे। आप बाद में भी इस लिंक पर वापस आ सकते हैं — इसमें पुष्टि किया गया परिणाम दिखेगा।',
      },

      failed: {
        title: 'वह भुगतान पूरा नहीं हो सका',
        body: 'यह बैंक टाइमआउट जैसा लग रहा है — कोई राशि नहीं कटी। कृपया फिर से कोशिश करें।',
      },

      alreadyPaid: {
        title: 'यह चरण पहले ही भुगतान हो चुका है',
        body: 'यहां और कुछ भुगतान करने को नहीं है — यह चरण पहले ही, संभवतः किसी अलग तरीके से, निपटाया जा चुका है।',
      },

      receipt: {
        heading: 'भुगतान प्राप्त हुआ',
        amountPaid: 'भुगतान की गई राशि',
        method: 'तरीका',
        reference: 'संदर्भ',
        paidAt: 'भुगतान की तारीख',
        done: 'हो गया',
      },
    },
  },
  mr: {
    paymentGatewayCheckout: {
      title: 'ऑनलाइन पेमेंट करा',
      loading: 'तुमचे पेमेंट लोड होत आहे',
      notFound: { title: 'पेमेंट लिंक वैध नाही', body: 'ही पेमेंट लिंक तुमच्या खात्याशी जुळत नाही, किंवा हा टप्पा आता अस्तित्वात नाही. कृपया AIEC कडून नवीन लिंक मागवा.' },
      error: { title: 'हे पेमेंट लोड होऊ शकले नाही', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },

      summary: {
        heading: 'तुम्ही भरत आहात',
        site: 'साइट',
        deal: 'डील',
        stage: 'टप्पा',
        amountDue: 'देय रक्कम',
        partialNote: 'या टप्प्याचा काही भाग आधीच भरला गेला आहे — ही आता बाकी असलेली शिल्लक रक्कम आहे.',
      },

      method: {
        heading: 'यासह पैसे भरा',
        upi: 'UPI',
        card: 'कार्ड',
        netbanking: 'नेट बँकिंग',
      },

      actionBar: {
        pay: '{{amount}} भरा',
        retry: 'पुन्हा पेमेंट करा',
      },

      processing: {
        title: 'तुमचे पेमेंट प्रक्रिया होत आहे',
        body: 'ही स्क्रीन बंद करू नका — यास फक्त क्षणभर वेळ लागेल.',
      },

      awaitingConfirmation: {
        title: 'तुमच्या बँकेकडून पुष्टीकरण घेतले जात आहे',
        body: 'तुमच्या बँकेने पेमेंट स्वीकारले आहे — आम्ही त्याच्या अंतिम पुष्टीकरणाची वाट पाहत आहोत. यास एक मिनिट लागू शकतो.',
        checkingNote: 'आम्ही हे आपोआप अपडेट करू. तुम्ही नंतरही या लिंकवर परत येऊ शकता — त्यात पुष्टी झालेला निकाल दिसेल.',
      },

      failed: {
        title: 'ते पेमेंट पूर्ण होऊ शकले नाही',
        body: 'हा बँक टाइमआउटसारखा दिसतो — कोणतीही रक्कम कापली गेली नाही. कृपया पुन्हा प्रयत्न करा.',
      },

      alreadyPaid: {
        title: 'हा टप्पा आधीच भरला गेला आहे',
        body: 'इथे भरण्यासारखे आणखी काही नाही — हा टप्पा आधीच, कदाचित वेगळ्या पद्धतीने, पूर्ण झाला आहे.',
      },

      receipt: {
        heading: 'पेमेंट मिळाले',
        amountPaid: 'भरलेली रक्कम',
        method: 'पद्धत',
        reference: 'संदर्भ',
        paidAt: 'भरल्याची तारीख',
        done: 'झाले',
      },
    },
  },
};

export default translations;
