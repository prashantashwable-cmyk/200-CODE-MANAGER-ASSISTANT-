import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    dealWonCelebration: {
      title: 'Deal Won!',
      loading: 'Loading celebration details',
      error: { title: 'Could not load this deal', body: 'Check your connection and try again.' },
      notReady: { title: 'Not a win yet', body: 'This page lights up once this deal is Closed Won.' },

      hero: {
        heading: 'Deal Won!',
        subheading: '{{site}} just closed — great work.',
        dealValue: 'Deal value',
      },

      staff: {
        heading: 'Everyone who made this happen',
        roleOriginal: 'Capturing surveyor',
        roleCurrent: 'Current owner',
        total: 'Total',
        noEntries: 'No commission entries on this deal yet.',
        reasonLine: '{{reason}}',
      },

      nextSteps: {
        heading: "What's next",
        viewClosureBody: 'See the payment schedule and supplier order this win kicked off.',
        viewClosure: 'View closure details',
      },

      feedback: {
        heading: 'Anything we should learn from this one?',
        prompt: 'Optional — shared only with Admin, never with the rest of the team.',
        placeholder: 'What went well, or what nearly went wrong?',
        submitted: 'Thanks — noted.',
      },

      internalNote: {
        heading: 'Internal feedback note',
      },

      acknowledged: {
        banner: 'Acknowledged',
        by: 'on {{date}}',
      },

      actionBar: {
        acknowledge: 'Got it!',
      },

      toast: {
        acknowledged: 'Nice one — celebration acknowledged',
        error: 'Something went wrong. Please try again.',
      },
    },
  },
  hi: {
    dealWonCelebration: {
      title: 'डील जीती!',
      loading: 'उत्सव विवरण लोड हो रहे हैं',
      error: { title: 'यह डील लोड नहीं हो सकी', body: 'अपना कनेक्शन जांचें और फिर से कोशिश करें।' },
      notReady: { title: 'अभी जीत नहीं हुई', body: 'यह डील बंद-जीती होते ही यह पेज सक्रिय हो जाएगा।' },

      hero: {
        heading: 'डील जीती!',
        subheading: '{{site}} अभी बंद हुई — बहुत बढ़िया काम।',
        dealValue: 'डील की कीमत',
      },

      staff: {
        heading: 'इसे सफल बनाने वाले सभी लोग',
        roleOriginal: 'कैप्चर करने वाला सर्वेयर',
        roleCurrent: 'वर्तमान मालिक',
        total: 'कुल',
        noEntries: 'इस डील पर अभी कोई कमीशन प्रविष्टि नहीं है।',
        reasonLine: '{{reason}}',
      },

      nextSteps: {
        heading: 'आगे क्या है',
        viewClosureBody: 'इस जीत से शुरू हुई भुगतान अनुसूची और आपूर्तिकर्ता आदेश देखें।',
        viewClosure: 'क्लोज़र विवरण देखें',
      },

      feedback: {
        heading: 'क्या इससे कुछ सीखने लायक है?',
        prompt: 'वैकल्पिक — केवल एडमिन के साथ साझा होता है, बाकी टीम के साथ कभी नहीं।',
        placeholder: 'क्या अच्छा हुआ, या क्या लगभग गड़बड़ हो गई थी?',
        submitted: 'धन्यवाद — नोट कर लिया गया।',
      },

      internalNote: {
        heading: 'आंतरिक फ़ीडबैक नोट',
      },

      acknowledged: {
        banner: 'स्वीकार किया गया',
        by: '{{date}} को',
      },

      actionBar: {
        acknowledge: 'समझ गया!',
      },

      toast: {
        acknowledged: 'बढ़िया — उत्सव स्वीकार किया गया',
        error: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
      },
    },
  },
  mr: {
    dealWonCelebration: {
      title: 'डील जिंकली!',
      loading: 'उत्सव तपशील लोड होत आहेत',
      error: { title: 'ही डील लोड होऊ शकली नाही', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },
      notReady: { title: 'अजून जिंकलेली नाही', body: 'ही डील बंद-जिंकली झाली की हे पान सक्रिय होईल.' },

      hero: {
        heading: 'डील जिंकली!',
        subheading: '{{site}} नुकतीच बंद झाली — उत्तम काम.',
        dealValue: 'डीलची किंमत',
      },

      staff: {
        heading: 'हे यशस्वी करणारे सर्व',
        roleOriginal: 'कॅप्चर करणारा सर्वेक्षक',
        roleCurrent: 'सध्याचा मालक',
        total: 'एकूण',
        noEntries: 'या डीलवर अजून कोणतीही कमिशन नोंद नाही.',
        reasonLine: '{{reason}}',
      },

      nextSteps: {
        heading: 'पुढे काय',
        viewClosureBody: 'या विजयामुळे सुरू झालेले पेमेंट वेळापत्रक आणि पुरवठादार ऑर्डर पहा.',
        viewClosure: 'क्लोजर तपशील पहा',
      },

      feedback: {
        heading: 'यातून काही शिकण्यासारखे आहे का?',
        prompt: 'ऐच्छिक — फक्त अ‍ॅडमिनसोबत शेअर होते, बाकी टीमसोबत कधीही नाही.',
        placeholder: 'काय चांगले झाले, किंवा काय जवळजवळ चुकले?',
        submitted: 'धन्यवाद — नोंदवले.',
      },

      internalNote: {
        heading: 'अंतर्गत फीडबॅक नोंद',
      },

      acknowledged: {
        banner: 'मान्य केले',
        by: '{{date}} रोजी',
      },

      actionBar: {
        acknowledge: 'समजले!',
      },

      toast: {
        acknowledged: 'छान — उत्सव मान्य केला',
        error: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
