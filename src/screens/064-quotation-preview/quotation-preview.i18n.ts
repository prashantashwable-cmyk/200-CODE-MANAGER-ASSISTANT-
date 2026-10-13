import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    quotationPreview: {
      title: 'Quotation',
      loading: 'Loading quotation',
      error: { title: 'Could not load this quotation', body: 'Check your connection and try again.' },
      finalPriceLabel: 'Total price',
      gstInclusiveNote: 'Includes GST at {{pct}}%.',
      configSummary: 'A {{finish}} {{drive}} elevator for {{capacity}} persons, serving {{stops}} stops.',
      validUntil: 'Valid until {{date}}',
      viewTracking: {
        notSent: 'Not sent yet',
        sentNotViewed: 'Sent — not yet opened',
        viewed: 'Opened {{date}}',
      },
      expiredState: {
        title: 'This quotation has expired',
        body: 'Its validity period has passed. Request an updated quotation — pricing will be recalculated against current rates.',
        requote: 'Request updated quotation',
      },
      acceptedState: {
        title: 'Quotation accepted',
        body: 'This quotation is now locked. Any further change requires a new version.',
      },
      supersededState: {
        title: 'This version has been replaced',
        body: 'A newer version of this quotation is now the active one.',
      },
      actions: {
        accept: 'Accept quotation',
        requestChanges: 'Request changes',
        send: 'Send quotation',
        deliveryStatus: 'View delivery status',
      },
      changeRequestSheet: {
        title: 'What would you like changed?',
        noteLabel: 'Describe the change',
        noteRequired: 'A description is required.',
        submit: 'Send request',
      },
      toast: {
        accepted: 'Quotation accepted',
        changesRequested: 'Change request sent',
        requoted: 'New quotation drafted',
        error: 'Could not save — try again.',
      },
    },
  },

  hi: {
    quotationPreview: {
      title: 'कोटेशन',
      loading: 'कोटेशन लोड हो रहा है',
      error: { title: 'यह कोटेशन लोड नहीं हो पाया', body: 'नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।' },
      finalPriceLabel: 'कुल कीमत',
      gstInclusiveNote: '{{pct}}% GST शामिल है।',
      configSummary: '{{capacity}} व्यक्तियों के लिए {{finish}} {{drive}} लिफ़्ट, {{stops}} स्टॉप तक।',
      validUntil: '{{date}} तक मान्य',
      viewTracking: {
        notSent: 'अभी नहीं भेजा गया',
        sentNotViewed: 'भेजा गया — अभी तक खोला नहीं गया',
        viewed: '{{date}} को खोला गया',
      },
      expiredState: {
        title: 'यह कोटेशन समाप्त हो गया है',
        body: 'इसकी मान्यता अवधि बीत चुकी है। अपडेटेड कोटेशन माँगें — कीमत मौजूदा दरों के अनुसार फिर से गणना होगी।',
        requote: 'अपडेटेड कोटेशन माँगें',
      },
      acceptedState: {
        title: 'कोटेशन स्वीकृत',
        body: 'यह कोटेशन अब लॉक हो गया है। किसी भी आगे के बदलाव के लिए नया वर्शन चाहिए होगा।',
      },
      supersededState: {
        title: 'यह वर्शन बदल दिया गया है',
        body: 'इस कोटेशन का एक नया वर्शन अब सक्रिय है।',
      },
      actions: {
        accept: 'कोटेशन स्वीकार करें',
        requestChanges: 'बदलाव माँगें',
        send: 'कोटेशन भेजें',
        deliveryStatus: 'डिलीवरी स्थिति देखें',
      },
      changeRequestSheet: {
        title: 'आप क्या बदलाव चाहते हैं?',
        noteLabel: 'बदलाव का वर्णन करें',
        noteRequired: 'विवरण ज़रूरी है।',
        submit: 'अनुरोध भेजें',
      },
      toast: {
        accepted: 'कोटेशन स्वीकृत हुआ',
        changesRequested: 'बदलाव का अनुरोध भेजा गया',
        requoted: 'नया कोटेशन बनाया गया',
        error: 'सहेजा नहीं जा सका — दोबारा कोशिश करें।',
      },
    },
  },

  mr: {
    quotationPreview: {
      title: 'कोटेशन',
      loading: 'कोटेशन लोड होत आहे',
      error: { title: 'हे कोटेशन लोड होऊ शकले नाही', body: 'नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.' },
      finalPriceLabel: 'एकूण किंमत',
      gstInclusiveNote: '{{pct}}% GST समाविष्ट आहे.',
      configSummary: '{{capacity}} व्यक्तींसाठी {{finish}} {{drive}} लिफ्ट, {{stops}} थांब्यांपर्यंत.',
      validUntil: '{{date}} पर्यंत वैध',
      viewTracking: {
        notSent: 'अजून पाठवलेले नाही',
        sentNotViewed: 'पाठवले — अजून उघडलेले नाही',
        viewed: '{{date}} रोजी उघडले',
      },
      expiredState: {
        title: 'हे कोटेशन कालबाह्य झाले आहे',
        body: 'त्याचा वैधता कालावधी संपला आहे. अद्ययावत कोटेशन मागवा — किंमत सध्याच्या दरांनुसार पुन्हा मोजली जाईल.',
        requote: 'अद्ययावत कोटेशन मागवा',
      },
      acceptedState: {
        title: 'कोटेशन स्वीकारले',
        body: 'हे कोटेशन आता लॉक झाले आहे. पुढील कोणत्याही बदलासाठी नवीन आवृत्ती लागेल.',
      },
      supersededState: {
        title: 'ही आवृत्ती बदलली गेली आहे',
        body: 'या कोटेशनची नवीन आवृत्ती आता सक्रिय आहे.',
      },
      actions: {
        accept: 'कोटेशन स्वीकारा',
        requestChanges: 'बदल मागवा',
        send: 'कोटेशन पाठवा',
        deliveryStatus: 'डिलिव्हरी स्थिती पहा',
      },
      changeRequestSheet: {
        title: 'तुम्हाला काय बदल हवा आहे?',
        noteLabel: 'बदलाचे वर्णन करा',
        noteRequired: 'वर्णन आवश्यक आहे.',
        submit: 'विनंती पाठवा',
      },
      toast: {
        accepted: 'कोटेशन स्वीकारले',
        changesRequested: 'बदल विनंती पाठवली',
        requoted: 'नवीन कोटेशन तयार केले',
        error: 'जतन करता आले नाही — पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
