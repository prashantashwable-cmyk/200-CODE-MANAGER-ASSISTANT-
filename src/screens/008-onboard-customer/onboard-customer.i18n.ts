import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    onbCustomer: {
      alert: { noDataConsent: 'A customer declined sharing their project details: talk to them before work starts' },
      existingPhone: 'This mobile number belongs to an AIEC partner account. Use a different number, or call us.',
      saveFailed: 'We could not save your details. Nothing is lost: try again in a moment.',
      passwordLater: 'Signing in is by a code sent to your phone. There is no password to set.',
      title: 'Confirm your details',
      subtitle: 'Check we got everything right, and confirm to open your account.',
      fromLead: 'From the site survey at {{site}} · {{code}}',
      loading: 'Loading your project',
      section: { details: 'Your details', access: 'How you sign in', consent: 'Staying in touch' },
      field: {
        name: 'Your name',
        phone: 'Mobile number',
        email: 'Email address',
        emailHint: 'Optional. Useful for invoices and the signed contract.',
        siteAddress: 'Site address',
        addressHint: 'Taken from the survey. Correct it here if anything is off.',
        city: 'City',
        pincode: 'PIN code',
        password: 'Choose a password',
      },
      login: {
        otp: 'Sign in with a code each time',
        otpHint: 'Nothing to remember. We text you a 6-digit code when you want to check in.',
        password: 'Use a password',
        passwordHint: 'Faster if you plan to check your project often.',
      },
      consent: {
        whatsapp: 'WhatsApp updates',
        whatsappHint: 'Progress photos, delivery dates, and payment reminders.',
        sms: 'SMS updates',
        smsHint: 'The important ones only — payments due and handover dates.',
        dataUsage: 'I agree to AIEC using my project details to deliver this installation',
        dataUsageHint: 'Shared with the technicians and suppliers working on your lift, and no one else.',
        declineNote:
          'That is completely fine. Your account still works, and you can follow everything in the app. We simply will not message you on the channels you turned off.',
      },
      existing: {
        title: 'You already have an account',
        body: 'We found {{name}} on this number. Rather than making a second account, we will add {{site}} to the one you already have.',
        action: 'Add this project to my account',
      },
      submit: 'Confirm and continue',
      done: {
        title: 'All set',
        body: 'Your project is live in the app. You can follow every stage from here, from parts arriving to final handover.',
        action: 'See my project',
      },
      error: {
        title: 'Could not load your project',
        body: 'We could not find the survey this account is being created from. Check the link, or ask your AIEC contact to resend it.',
      },
      invalid: {
        name: 'Please enter your full name.',
        phone: 'Enter a 10-digit Indian mobile number.',
        password: 'Use at least 6 characters.',
      },
    },
  },

  hi: {
    onbCustomer: {
      alert: { noDataConsent: 'एक ग्राहक ने अपने प्रोजेक्ट का विवरण साझा करने से मना किया: काम शुरू होने से पहले उनसे बात करें' },
      existingPhone: 'यह मोबाइल नंबर एक AIEC पार्टनर खाते का है। कोई दूसरा नंबर उपयोग करें, या हमें कॉल करें।',
      saveFailed: 'हम आपका विवरण सहेज नहीं सके। कुछ भी खोया नहीं है: थोड़ी देर में फिर कोशिश करें।',
      passwordLater: 'साइन इन आपके फ़ोन पर भेजे गए कोड से होता है। कोई पासवर्ड बनाना नहीं है।',
      title: 'अपनी जानकारी पक्की कीजिए',
      subtitle: 'देख लीजिए कि सब सही है, और अपना खाता खोलने के लिए पुष्टि करें।',
      fromLead: '{{site}} पर हुए साइट सर्वे से · {{code}}',
      loading: 'आपका प्रोजेक्ट लोड हो रहा है',
      section: { details: 'आपकी जानकारी', access: 'आप कैसे साइन इन करेंगे', consent: 'संपर्क में रहना' },
      field: {
        name: 'आपका नाम',
        phone: 'मोबाइल नंबर',
        email: 'ईमेल पता',
        emailHint: 'वैकल्पिक। बिल और हस्ताक्षरित अनुबंध के लिए उपयोगी।',
        siteAddress: 'साइट का पता',
        addressHint: 'सर्वे से लिया गया है। कुछ ग़लत हो तो यहीं ठीक कर लीजिए।',
        city: 'शहर',
        pincode: 'पिन कोड',
        password: 'पासवर्ड चुनिए',
      },
      login: {
        otp: 'हर बार कोड से साइन इन करें',
        otpHint: 'कुछ याद रखने की ज़रूरत नहीं। देखना हो तब हम 6 अंकों का कोड भेज देते हैं।',
        password: 'पासवर्ड इस्तेमाल करें',
        passwordHint: 'अगर आप बार-बार प्रोजेक्ट देखना चाहते हैं तो यह जल्दी पड़ेगा।',
      },
      consent: {
        whatsapp: 'WhatsApp पर अपडेट',
        whatsappHint: 'काम की फ़ोटो, डिलीवरी की तारीख़ें, और भुगतान की याद।',
        sms: 'SMS पर अपडेट',
        smsHint: 'सिर्फ़ ज़रूरी वाले — देय भुगतान और हैंडओवर की तारीख़ें।',
        dataUsage: 'मैं सहमत हूँ कि AIEC इस इंस्टॉलेशन के लिए मेरे प्रोजेक्ट की जानकारी इस्तेमाल करे',
        dataUsageHint: 'आपकी लिफ़्ट पर काम कर रहे तकनीशियनों और आपूर्तिकर्ताओं के साथ ही साझा, और किसी के साथ नहीं।',
        declineNote:
          'यह बिल्कुल ठीक है। आपका खाता चलता रहेगा और आप ऐप में सब कुछ देख सकेंगे। बस जो माध्यम आपने बंद किए हैं, उन पर हम संदेश नहीं भेजेंगे।',
      },
      existing: {
        title: 'आपका खाता पहले से है',
        body: 'इस नंबर पर हमें {{name}} मिले। दूसरा खाता बनाने के बजाय हम {{site}} को आपके मौजूदा खाते में ही जोड़ देंगे।',
        action: 'यह प्रोजेक्ट मेरे खाते में जोड़ें',
      },
      submit: 'पक्का करके आगे बढ़ें',
      done: {
        title: 'सब तैयार है',
        body: 'आपका प्रोजेक्ट ऐप में चालू है। पुर्ज़े आने से लेकर आख़िरी हैंडओवर तक हर चरण आप यहीं देख सकते हैं।',
        action: 'मेरा प्रोजेक्ट देखें',
      },
      error: {
        title: 'आपका प्रोजेक्ट लोड नहीं हो पाया',
        body: 'जिस सर्वे से यह खाता बन रहा है, वह हमें नहीं मिला। लिंक जाँचिए, या अपने AIEC संपर्क से दोबारा भिजवाइए।',
      },
      invalid: {
        name: 'कृपया अपना पूरा नाम लिखिए।',
        phone: '10 अंकों का भारतीय मोबाइल नंबर डालिए।',
        password: 'कम से कम 6 अक्षर रखिए।',
      },
    },
  },

  mr: {
    onbCustomer: {
      alert: { noDataConsent: 'एका ग्राहकाने प्रकल्पाची माहिती शेअर करण्यास नकार दिला: काम सुरू होण्यापूर्वी त्यांच्याशी बोला' },
      existingPhone: 'हा मोबाइल नंबर AIEC भागीदार खात्याचा आहे. दुसरा नंबर वापरा, किंवा आम्हाला कॉल करा.',
      saveFailed: 'आम्ही तुमची माहिती जतन करू शकलो नाही. काहीही हरवलेले नाही: थोड्या वेळाने पुन्हा प्रयत्न करा.',
      passwordLater: 'साइन इन तुमच्या फोनवर पाठवलेल्या कोडने होते. कोणताही पासवर्ड सेट करायचा नाही.',
      title: 'तुमची माहिती निश्चित करा',
      subtitle: 'सर्व बरोबर आहे का ते पहा, आणि तुमचे खाते उघडण्यासाठी पुष्टी करा.',
      fromLead: '{{site}} इथे झालेल्या साइट सर्वेक्षणातून · {{code}}',
      loading: 'तुमचा प्रकल्प लोड होत आहे',
      section: { details: 'तुमची माहिती', access: 'तुम्ही कसे साइन इन कराल', consent: 'संपर्कात राहणे' },
      field: {
        name: 'तुमचे नाव',
        phone: 'मोबाइल क्रमांक',
        email: 'ईमेल पत्ता',
        emailHint: 'ऐच्छिक. बिल आणि सही केलेल्या करारासाठी उपयोगी.',
        siteAddress: 'साइटचा पत्ता',
        addressHint: 'सर्वेक्षणातून घेतला आहे. काही चुकले असेल तर इथेच दुरुस्त करा.',
        city: 'शहर',
        pincode: 'पिन कोड',
        password: 'पासवर्ड निवडा',
      },
      login: {
        otp: 'दर वेळी कोडने साइन इन करा',
        otpHint: 'काहीही लक्षात ठेवायची गरज नाही. पहायचे असेल तेव्हा आम्ही ६ अंकी कोड पाठवतो.',
        password: 'पासवर्ड वापरा',
        passwordHint: 'वारंवार प्रकल्प पहायचा असेल तर हे जलद पडेल.',
      },
      consent: {
        whatsapp: 'WhatsApp वर अपडेट',
        whatsappHint: 'कामाचे फोटो, वितरणाच्या तारखा, आणि पैशांची आठवण.',
        sms: 'SMS वर अपडेट',
        smsHint: 'फक्त महत्त्वाचे — देय रक्कम आणि ताबा देण्याच्या तारखा.',
        dataUsage: 'या बसवणुकीसाठी AIEC ने माझ्या प्रकल्पाची माहिती वापरण्यास मी संमती देतो',
        dataUsageHint: 'तुमच्या लिफ्टवर काम करणाऱ्या तंत्रज्ञ आणि पुरवठादारांसोबतच, इतर कोणासोबतही नाही.',
        declineNote:
          'हे अगदी ठीक आहे. तुमचे खाते चालूच राहील आणि ॲपमध्ये सर्व काही दिसेल. फक्त तुम्ही बंद केलेल्या मार्गांवर आम्ही संदेश पाठवणार नाही.',
      },
      existing: {
        title: 'तुमचे खाते आधीपासून आहे',
        body: 'या क्रमांकावर आम्हाला {{name}} आढळले. दुसरे खाते तयार करण्याऐवजी आम्ही {{site}} तुमच्या सध्याच्या खात्यातच जोडू.',
        action: 'हा प्रकल्प माझ्या खात्यात जोडा',
      },
      submit: 'निश्चित करून पुढे जा',
      done: {
        title: 'सर्व तयार आहे',
        body: 'तुमचा प्रकल्प ॲपमध्ये सुरू आहे. सुटे भाग येण्यापासून अंतिम ताबा देईपर्यंत प्रत्येक टप्पा तुम्ही इथेच पाहू शकता.',
        action: 'माझा प्रकल्प पहा',
      },
      error: {
        title: 'तुमचा प्रकल्प लोड होऊ शकला नाही',
        body: 'ज्या सर्वेक्षणातून हे खाते तयार होत आहे ते आम्हाला सापडले नाही. दुवा तपासा, किंवा तुमच्या AIEC संपर्काकडून पुन्हा मागवा.',
      },
      invalid: {
        name: 'कृपया तुमचे पूर्ण नाव लिहा.',
        phone: '१० अंकी भारतीय मोबाइल क्रमांक टाका.',
        password: 'किमान ६ अक्षरे ठेवा.',
      },
    },
  },
};

export default translations;
