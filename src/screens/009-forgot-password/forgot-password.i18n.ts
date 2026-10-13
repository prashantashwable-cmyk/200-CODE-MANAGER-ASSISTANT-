import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    forgotPassword: {
      title: 'Reset your password',
      subtitle: 'We will send a one-time code to the number or email on your account.',
      identify: {
        label: 'Mobile number or email',
        hint: 'Whichever one you signed up with.',
        action: 'Send reset code',
      },
      channel: { sms: 'SMS', whatsapp: 'WhatsApp', email: 'email' },
      code: {
        heading: 'Enter the code',
        label: 'Reset code digit',
        sentVia: 'Sent by {{channel}} to {{target}}.',
        resend: 'Send a new code',
        noGateway:
          'No messaging gateway is connected in this build, so nothing is actually sent. Your code is {{code}}.',
        verify: 'Continue',
      },
      password: {
        heading: 'Choose a new password',
        newLabel: 'New password',
        confirmLabel: 'Type it again',
        strength: 'Strength',
        level: {
          0: 'Too easy to guess',
          1: 'Weak',
          2: 'Getting there',
          3: 'Good',
          4: 'Strong',
        },
        rule: {
          length: 'At least {{count}} characters',
          upper: 'Mix of capital and small letters',
          digit: 'At least one number',
          symbol: 'At least one symbol',
        },
        submit: 'Set new password',
      },
      done: {
        title: 'Password changed',
        body: 'You can sign in with your new password now.',
        sessions: 'Signed out of {{count}} other devices, so nobody stays logged in behind you.',
        action: 'Go to sign in',
      },
      noChannels: {
        title: 'We need to do this one by hand',
        body: 'This account has no verified mobile number or email on it, so we cannot send you a code safely. Contact your AIEC admin and they will reset it for you.',
      },
      rateLimited: {
        title: 'Too many reset requests',
        body: 'Three codes have already gone out for this account in the last fifteen minutes. Wait a few minutes and try again — the last code we sent still works.',
      },
      error: {
        unknownAccount: 'No AIEC account uses that number or email.',
        wrongCode: 'That code is not right. Check it and try again.',
        expiredCode: 'That code has expired. Codes last fifteen minutes — ask for a new one.',
        supersededCode:
          'A newer code has been sent, so this one no longer works. Use the most recent code.',
        samePassword: 'That is too close to something already tied to your account. Pick something else.',
        weakPassword: 'Make this a bit stronger before continuing.',
        mismatch: 'These two do not match.',
        network: 'We could not reach AIEC. Check your connection and try again.',
      },
    },
  },

  hi: {
    forgotPassword: {
      title: 'पासवर्ड फिर से सेट करें',
      subtitle: 'हम आपके खाते वाले नंबर या ईमेल पर एक बार का कोड भेजेंगे।',
      identify: {
        label: 'मोबाइल नंबर या ईमेल',
        hint: 'जिससे भी आपने साइन अप किया था।',
        action: 'रीसेट कोड भेजें',
      },
      channel: { sms: 'SMS', whatsapp: 'WhatsApp', email: 'ईमेल' },
      code: {
        heading: 'कोड डालिए',
        label: 'रीसेट कोड अंक',
        sentVia: '{{channel}} से {{target}} पर भेजा गया।',
        resend: 'नया कोड भेजें',
        noGateway:
          'इस बिल्ड में कोई मैसेजिंग गेटवे जुड़ा नहीं है, इसलिए सचमुच कुछ नहीं भेजा जाता। आपका कोड {{code}} है।',
        verify: 'आगे बढ़ें',
      },
      password: {
        heading: 'नया पासवर्ड चुनिए',
        newLabel: 'नया पासवर्ड',
        confirmLabel: 'दोबारा लिखिए',
        strength: 'मज़बूती',
        level: {
          0: 'बहुत आसानी से पकड़ा जाएगा',
          1: 'कमज़ोर',
          2: 'ठीक-ठाक',
          3: 'अच्छा',
          4: 'मज़बूत',
        },
        rule: {
          length: 'कम से कम {{count}} अक्षर',
          upper: 'बड़े और छोटे अक्षर दोनों',
          digit: 'कम से कम एक अंक',
          symbol: 'कम से कम एक चिह्न',
        },
        submit: 'नया पासवर्ड सेट करें',
      },
      done: {
        title: 'पासवर्ड बदल गया',
        body: 'अब आप अपने नए पासवर्ड से साइन इन कर सकते हैं।',
        sessions: '{{count}} दूसरे डिवाइस से साइन आउट कर दिया गया, ताकि आपके पीछे कोई लॉग इन न रह जाए।',
        action: 'साइन इन पर जाएँ',
      },
      noChannels: {
        title: 'यह काम हाथ से करना पड़ेगा',
        body: 'इस खाते पर कोई सत्यापित मोबाइल नंबर या ईमेल नहीं है, इसलिए हम सुरक्षित तरीक़े से कोड नहीं भेज सकते। अपने AIEC एडमिन से संपर्क कीजिए, वे इसे रीसेट कर देंगे।',
      },
      rateLimited: {
        title: 'बहुत ज़्यादा रीसेट अनुरोध',
        body: 'पिछले पंद्रह मिनट में इस खाते के लिए तीन कोड जा चुके हैं। कुछ मिनट रुककर दोबारा कोशिश कीजिए — आख़िरी भेजा गया कोड अब भी चलेगा।',
      },
      error: {
        unknownAccount: 'उस नंबर या ईमेल से कोई AIEC खाता नहीं जुड़ा है।',
        wrongCode: 'यह कोड सही नहीं है। जाँचकर दोबारा कोशिश कीजिए।',
        expiredCode: 'यह कोड समाप्त हो गया। कोड पंद्रह मिनट चलता है — नया माँग लीजिए।',
        supersededCode: 'नया कोड भेजा जा चुका है, इसलिए यह अब नहीं चलेगा। सबसे नया कोड इस्तेमाल कीजिए।',
        samePassword: 'यह आपके खाते से जुड़ी किसी चीज़ के बहुत क़रीब है। कुछ और चुनिए।',
        weakPassword: 'आगे बढ़ने से पहले इसे थोड़ा और मज़बूत कीजिए।',
        mismatch: 'ये दोनों मेल नहीं खा रहे।',
        network: 'हम AIEC तक नहीं पहुँच पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
    },
  },

  mr: {
    forgotPassword: {
      title: 'पासवर्ड पुन्हा सेट करा',
      subtitle: 'तुमच्या खात्यावरील क्रमांक किंवा ईमेलवर आम्ही एकदाच वापरायचा कोड पाठवू.',
      identify: {
        label: 'मोबाइल क्रमांक किंवा ईमेल',
        hint: 'ज्याने तुम्ही नोंदणी केली होती ते.',
        action: 'रीसेट कोड पाठवा',
      },
      channel: { sms: 'SMS', whatsapp: 'WhatsApp', email: 'ईमेल' },
      code: {
        heading: 'कोड टाका',
        label: 'रीसेट कोड अंक',
        sentVia: '{{channel}} ने {{target}} वर पाठवला.',
        resend: 'नवीन कोड पाठवा',
        noGateway:
          'या बिल्डमध्ये मेसेजिंग गेटवे जोडलेला नाही, त्यामुळे प्रत्यक्षात काहीच पाठवले जात नाही. तुमचा कोड {{code}} आहे.',
        verify: 'पुढे जा',
      },
      password: {
        heading: 'नवीन पासवर्ड निवडा',
        newLabel: 'नवीन पासवर्ड',
        confirmLabel: 'पुन्हा लिहा',
        strength: 'मजबुती',
        level: {
          0: 'फार सहज ओळखला जाईल',
          1: 'कमकुवत',
          2: 'बऱ्यापैकी',
          3: 'चांगला',
          4: 'मजबूत',
        },
        rule: {
          length: 'किमान {{count}} अक्षरे',
          upper: 'मोठी आणि लहान दोन्ही अक्षरे',
          digit: 'किमान एक अंक',
          symbol: 'किमान एक चिन्ह',
        },
        submit: 'नवीन पासवर्ड सेट करा',
      },
      done: {
        title: 'पासवर्ड बदलला',
        body: 'आता तुम्ही नव्या पासवर्डने साइन इन करू शकता.',
        sessions: '{{count}} इतर डिव्हाइसवरून साइन आउट केले, म्हणजे तुमच्या मागे कोणी लॉग इन राहणार नाही.',
        action: 'साइन इनकडे जा',
      },
      noChannels: {
        title: 'हे काम हाताने करावे लागेल',
        body: 'या खात्यावर पडताळलेला मोबाइल क्रमांक किंवा ईमेल नाही, त्यामुळे सुरक्षितपणे कोड पाठवता येत नाही. तुमच्या AIEC प्रशासकाशी संपर्क करा, ते हे रीसेट करून देतील.',
      },
      rateLimited: {
        title: 'खूप जास्त रीसेट विनंत्या',
        body: 'गेल्या पंधरा मिनिटांत या खात्यासाठी तीन कोड पाठवले गेले आहेत. काही मिनिटे थांबून पुन्हा प्रयत्न करा — शेवटचा पाठवलेला कोड अजूनही चालतो.',
      },
      error: {
        unknownAccount: 'त्या क्रमांकाशी किंवा ईमेलशी कोणतेही AIEC खाते जोडलेले नाही.',
        wrongCode: 'हा कोड बरोबर नाही. तपासून पुन्हा प्रयत्न करा.',
        expiredCode: 'हा कोड कालबाह्य झाला. कोड पंधरा मिनिटे चालतो — नवीन मागवा.',
        supersededCode: 'नवीन कोड पाठवला गेला आहे, त्यामुळे हा आता चालणार नाही. सर्वात नवीन कोड वापरा.',
        samePassword: 'हे तुमच्या खात्याशी जोडलेल्या एखाद्या गोष्टीच्या फार जवळ आहे. दुसरे काही निवडा.',
        weakPassword: 'पुढे जाण्यापूर्वी हा थोडा अधिक मजबूत करा.',
        mismatch: 'हे दोन्ही जुळत नाहीत.',
        network: 'आम्ही AIEC पर्यंत पोहोचू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
