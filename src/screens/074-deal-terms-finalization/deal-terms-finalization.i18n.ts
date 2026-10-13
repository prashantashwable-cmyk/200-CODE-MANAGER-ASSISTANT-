import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    dealTermsFinalization: {
      title: 'Deal Terms Finalization',
      loading: 'Loading deal terms',
      error: { title: 'Could not load deal terms', body: 'Check your connection and try again.' },

      status: {
        draft: 'Draft',
        awaiting_customer: 'Awaiting customer',
        confirmed: 'Confirmed',
      },

      summary: {
        finalPrice: 'Final agreed price',
        editElsewhere: 'Change configuration or price',
      },

      paymentPlan: {
        heading: 'Payment stage plan',
        subtitle: 'This plan is locked in here and read directly by Payment Stage Schedule Setup — never re-entered.',
        total: 'Total: {{pct}}%',
        totalMustBe100: 'Advance, material, installation and handover must total 100%.',
        retentionHint: 'Retention is an additional holdback on top of the price above, not part of the 100%.',
      },

      specialTerms: {
        heading: 'Special terms',
        placeholder: 'e.g. a specific installation timeline promise',
        hint: 'Visible downstream as a tracked commitment, referenced later on the Installation Progress Timeline.',
      },

      confirmation: {
        heading: 'Confirmation',
        internalStep: 'Internal staff confirmed',
        internalDone: 'Confirmed',
        customerStep: 'Customer confirmed',
        customerDone: 'Confirmed',
        confirmInternal: 'Confirm internally',
        confirmCustomer: 'Mark customer confirmed',
        confirmCustomerNote: 'Simulates the customer confirming via their own portal/link — there is no live customer portal in this build yet.',
        waitingOnCustomer: 'Waiting on the customer to confirm. A follow-up nudge is tracked automatically if this runs long.',
        bothConfirmed: 'Both parties have confirmed. This deal is binding — contract and payment setup can proceed.',
        generateContract: 'Generate contract',
        setUpSchedule: 'Set up payment schedule',
      },

      amendments: {
        heading: 'Amendments',
        logButton: 'Log an amendment',
        sheetTitle: 'Log a corrective amendment',
        noteLabel: 'What changed and why',
        submit: 'Log amendment',
        loggedBy: 'Logged {{date}}',
      },

      toast: {
        saved: 'Draft saved',
        confirmedInternal: 'Confirmed internally — now awaiting the customer',
        confirmedCustomer: 'Customer confirmation recorded — this deal is now binding',
        amended: 'Amendment logged',
        error: 'Something went wrong. Please try again.',
      },
    },
  },
  hi: {
    dealTermsFinalization: {
      title: 'डील शर्तें अंतिम रूप',
      loading: 'डील की शर्तें लोड हो रही हैं',
      error: { title: 'डील की शर्तें लोड नहीं हो सकीं', body: 'अपना कनेक्शन जांचें और फिर से कोशिश करें।' },

      status: {
        draft: 'ड्राफ़्ट',
        awaiting_customer: 'ग्राहक की प्रतीक्षा में',
        confirmed: 'पुष्टि हो गई',
      },

      summary: {
        finalPrice: 'अंतिम सहमत कीमत',
        editElsewhere: 'कॉन्फ़िगरेशन या कीमत बदलें',
      },

      paymentPlan: {
        heading: 'भुगतान चरण योजना',
        subtitle: 'यह योजना यहीं तय हो जाती है और सीधे पेमेंट स्टेज शेड्यूल सेटअप द्वारा पढ़ी जाती है — फिर से दर्ज नहीं करनी पड़ती।',
        total: 'कुल: {{pct}}%',
        totalMustBe100: 'एडवांस, मटीरियल, इंस्टॉलेशन और हैंडओवर मिलाकर 100% होने चाहिए।',
        retentionHint: 'रिटेंशन ऊपर दी गई कीमत पर एक अतिरिक्त होल्डबैक है, 100% का हिस्सा नहीं।',
      },

      specialTerms: {
        heading: 'विशेष शर्तें',
        placeholder: 'जैसे, एक तय इंस्टॉलेशन समय-सीमा का वादा',
        hint: 'आगे एक ट्रैक की गई प्रतिबद्धता के रूप में दिखेगी, जिसे बाद में इंस्टॉलेशन प्रोग्रेस टाइमलाइन पर संदर्भित किया जाएगा।',
      },

      confirmation: {
        heading: 'पुष्टिकरण',
        internalStep: 'आंतरिक स्टाफ़ ने पुष्टि की',
        internalDone: 'पुष्टि हो गई',
        customerStep: 'ग्राहक ने पुष्टि की',
        customerDone: 'पुष्टि हो गई',
        confirmInternal: 'आंतरिक रूप से पुष्टि करें',
        confirmCustomer: 'ग्राहक की पुष्टि दर्ज करें',
        confirmCustomerNote: 'ग्राहक के अपने पोर्टल/लिंक से पुष्टि करने का अनुकरण करता है — इस बिल्ड में अभी कोई लाइव ग्राहक पोर्टल नहीं है।',
        waitingOnCustomer: 'ग्राहक की पुष्टि का इंतज़ार है। इसमें ज़्यादा समय लगने पर एक फ़ॉलो-अप याद-दिलाना अपने आप ट्रैक होता है।',
        bothConfirmed: 'दोनों पक्षों ने पुष्टि कर दी है। यह डील बाध्यकारी है — अनुबंध और भुगतान सेटअप आगे बढ़ सकते हैं।',
        generateContract: 'अनुबंध तैयार करें',
        setUpSchedule: 'भुगतान अनुसूची सेट करें',
      },

      amendments: {
        heading: 'संशोधन',
        logButton: 'एक संशोधन दर्ज करें',
        sheetTitle: 'सुधारात्मक संशोधन दर्ज करें',
        noteLabel: 'क्या बदला और क्यों',
        submit: 'संशोधन दर्ज करें',
        loggedBy: '{{date}} को दर्ज किया गया',
      },

      toast: {
        saved: 'ड्राफ़्ट सेव हो गया',
        confirmedInternal: 'आंतरिक रूप से पुष्टि हो गई — अब ग्राहक की प्रतीक्षा है',
        confirmedCustomer: 'ग्राहक की पुष्टि दर्ज हो गई — यह डील अब बाध्यकारी है',
        amended: 'संशोधन दर्ज हो गया',
        error: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
      },
    },
  },
  mr: {
    dealTermsFinalization: {
      title: 'डील अटी अंतिम करणे',
      loading: 'डीलच्या अटी लोड होत आहेत',
      error: { title: 'डीलच्या अटी लोड होऊ शकल्या नाहीत', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },

      status: {
        draft: 'मसुदा',
        awaiting_customer: 'ग्राहकाच्या प्रतीक्षेत',
        confirmed: 'पुष्टी झाली',
      },

      summary: {
        finalPrice: 'अंतिम मान्य किंमत',
        editElsewhere: 'कॉन्फिगरेशन किंवा किंमत बदला',
      },

      paymentPlan: {
        heading: 'पेमेंट टप्पा योजना',
        subtitle: 'ही योजना इथेच निश्चित होते आणि थेट पेमेंट स्टेज शेड्यूल सेटअपद्वारे वाचली जाते — पुन्हा भरावी लागत नाही.',
        total: 'एकूण: {{pct}}%',
        totalMustBe100: 'अ‍ॅडव्हान्स, मटेरियल, इन्स्टॉलेशन आणि हँडओव्हर मिळून 100% असणे आवश्यक आहे.',
        retentionHint: 'रिटेन्शन ही वरील किंमतीवर एक अतिरिक्त होल्डबॅक आहे, 100% चा भाग नाही.',
      },

      specialTerms: {
        heading: 'विशेष अटी',
        placeholder: 'उदा., एक निश्चित इन्स्टॉलेशन कालमर्यादेचे वचन',
        hint: 'पुढे एक ट्रॅक केलेली वचनबद्धता म्हणून दिसेल, जी नंतर इन्स्टॉलेशन प्रोग्रेस टाइमलाइनवर संदर्भित केली जाईल.',
      },

      confirmation: {
        heading: 'पुष्टीकरण',
        internalStep: 'अंतर्गत स्टाफने पुष्टी केली',
        internalDone: 'पुष्टी झाली',
        customerStep: 'ग्राहकाने पुष्टी केली',
        customerDone: 'पुष्टी झाली',
        confirmInternal: 'अंतर्गत पुष्टी करा',
        confirmCustomer: 'ग्राहकाची पुष्टी नोंदवा',
        confirmCustomerNote: 'ग्राहकाने स्वतःच्या पोर्टल/लिंकवरून पुष्टी करण्याचे अनुकरण करते — या बिल्डमध्ये अजून थेट ग्राहक पोर्टल नाही.',
        waitingOnCustomer: 'ग्राहकाच्या पुष्टीची वाट पाहत आहोत. यास जास्त वेळ लागल्यास फॉलो-अप आठवण आपोआप ट्रॅक होते.',
        bothConfirmed: 'दोन्ही पक्षांनी पुष्टी केली आहे. ही डील बंधनकारक आहे — करार आणि पेमेंट सेटअप पुढे जाऊ शकतात.',
        generateContract: 'करार तयार करा',
        setUpSchedule: 'पेमेंट वेळापत्रक सेट करा',
      },

      amendments: {
        heading: 'दुरुस्त्या',
        logButton: 'एक दुरुस्ती नोंदवा',
        sheetTitle: 'सुधारात्मक दुरुस्ती नोंदवा',
        noteLabel: 'काय बदलले आणि का',
        submit: 'दुरुस्ती नोंदवा',
        loggedBy: '{{date}} रोजी नोंदवले',
      },

      toast: {
        saved: 'मसुदा जतन केला',
        confirmedInternal: 'अंतर्गत पुष्टी झाली — आता ग्राहकाची प्रतीक्षा आहे',
        confirmedCustomer: 'ग्राहकाची पुष्टी नोंदवली — ही डील आता बंधनकारक आहे',
        amended: 'दुरुस्ती नोंदवली',
        error: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
