import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    otp: {
      title: 'Enter your code',
      sentTo: 'We sent a 6-digit code to {{phone}}.',
      inputLabel: 'Verification code digit',
      verify: 'Verify',
      verifying: 'Checking…',
      success: 'Verified',
      changeNumber: 'Use a different number',
      resend: 'Send it again',
      resendIn: 'You can ask for a new code in {{seconds}}s',
      resendCount: '{{used}} of {{max}} codes requested',
      countryNote:
        'Using a number outside India? It still works — just include the correct country code.',
      noGateway:
        'No messaging gateway is connected in this build, so nothing is actually sent by SMS. Your code is {{code}}.',
      server: {
        smsConnected: 'The code was sent to your phone by SMS. It is good for a few minutes.',
        smsNotConnected:
          'AIEC has not connected a text-message service yet, so this code is not sent to your phone. Ask the office for the code waiting for your number.',
      },
      pending: {
        title: 'You are signed in, waiting for AIEC',
        body: 'Your number is confirmed. AIEC has not given your account a role yet, so there is nothing to open until the office does. You can tell them what you are here for.',
        ask: 'What are you here as?',
        asked: 'Thank you. AIEC has been told you asked to join as {{role}}.',
        askFailed: 'That did not reach AIEC. Check your connection and try again.',
      },
      link: {
        title: 'Confirm your mobile number',
        body: 'You signed in with Google. AIEC knows each person by their mobile number, so confirm yours once: we will send a code to it. After this, Google and your number are the same account.',
        field: 'Mobile number',
        hint: 'The number you use for AIEC work.',
        send: 'Send the code',
      },
      inactive: {
        title: 'This account is not open',
        body: 'Your number is confirmed, but this account has been closed or put on hold. Please call the AIEC office.',
      },
      expired: {
        title: 'That code has expired',
        body: 'Codes are valid for five minutes. Ask for a fresh one and we will start the clock again.',
        action: 'Send a new code',
      },
      cooldown: {
        title: 'Too many wrong codes',
        body: 'Take a short break — you can try again in {{seconds}} seconds.',
      },
      resendBlocked: {
        title: 'Too many code requests',
        body: 'For safety, only five codes can be sent to a number in ten minutes. Please wait a little and try again, or use a different number.',
      },
      error: {
        wrongCode: 'That code is not right. {{remaining}} attempts left before a short wait.',
        malformed: 'A code is exactly six digits.',
        network: 'We could not check the code. Try again in a moment.',
        missingContext: 'Start again from the sign-in screen so we know which number to verify.',
        tooMany: 'Too many tries for this number. Wait a few minutes and ask for a new code.',
        phoneLinked: 'This number is already linked to another sign-in. Please call the AIEC office.',
        wrongServerCode: 'That code is not right or has expired. Check it, or ask for a new one.',
        phoneTaken: 'This number already has its own AIEC sign-in. Sign in once with the code sent to that number, then open Settings and choose Connect Google.',
        invalidPhone: 'Enter a 10-digit Indian mobile number.',
      },
    },
  },

  hi: {
    otp: {
      title: 'अपना कोड डालिए',
      sentTo: 'हमने {{phone}} पर 6 अंकों का कोड भेजा है।',
      inputLabel: 'सत्यापन कोड अंक',
      verify: 'जाँचें',
      verifying: 'जाँच हो रही है…',
      success: 'सत्यापित',
      changeNumber: 'दूसरा नंबर इस्तेमाल करें',
      resend: 'दोबारा भेजें',
      resendIn: '{{seconds}} सेकंड बाद नया कोड माँग सकते हैं',
      resendCount: '{{max}} में से {{used}} कोड माँगे गए',
      countryNote: 'भारत से बाहर का नंबर है? वह भी चलेगा — बस सही देश कोड लगाइए।',
      noGateway:
        'इस बिल्ड में कोई मैसेजिंग गेटवे जुड़ा नहीं है, इसलिए SMS सचमुच नहीं जाता। आपका कोड {{code}} है।',
      server: {
        smsConnected: 'कोड SMS से आपके फ़ोन पर भेजा गया है। यह कुछ मिनट तक चलेगा।',
        smsNotConnected:
          'AIEC ने अभी कोई SMS सेवा नहीं जोड़ी है, इसलिए यह कोड आपके फ़ोन पर नहीं जाता। अपने नंबर के लिए रखा कोड ऑफ़िस से पूछिए।',
      },
      pending: {
        title: 'आप साइन इन हैं, AIEC का इंतज़ार है',
        body: 'आपका नंबर पक्का हो गया। AIEC ने अभी आपके खाते को कोई भूमिका नहीं दी है, इसलिए ऑफ़िस के देने तक खोलने को कुछ नहीं है। आप बता सकते हैं कि आप किस लिए आए हैं।',
        ask: 'आप किस रूप में जुड़ रहे हैं?',
        asked: 'धन्यवाद। AIEC को बता दिया गया है कि आप {{role}} के रूप में जुड़ना चाहते हैं।',
        askFailed: 'यह AIEC तक नहीं पहुँचा। कनेक्शन देखकर दोबारा कोशिश कीजिए।',
      },
      link: {
        title: 'अपना मोबाइल नंबर पक्का करें',
        body: 'आपने Google से साइन इन किया है। AIEC हर व्यक्ति को उसके मोबाइल नंबर से पहचानता है, इसलिए अपना नंबर एक बार पक्का करें: हम उस पर एक कोड भेजेंगे। इसके बाद Google और आपका नंबर एक ही खाता होंगे।',
        field: 'मोबाइल नंबर',
        hint: 'वह नंबर जिससे आप AIEC का काम करते हैं।',
        send: 'कोड भेजें',
      },
      inactive: {
        title: 'यह खाता खुला नहीं है',
        body: 'आपका नंबर पक्का है, पर यह खाता बंद है या रोका गया है। कृपया AIEC ऑफ़िस को फ़ोन कीजिए।',
      },
      expired: {
        title: 'यह कोड समाप्त हो गया',
        body: 'कोड पाँच मिनट तक चलता है। नया कोड माँगिए, घड़ी फिर से शुरू हो जाएगी।',
        action: 'नया कोड भेजें',
      },
      cooldown: {
        title: 'बहुत बार ग़लत कोड',
        body: 'थोड़ा रुकिए — {{seconds}} सेकंड बाद दोबारा कोशिश कर सकते हैं।',
      },
      resendBlocked: {
        title: 'बहुत ज़्यादा कोड माँगे गए',
        body: 'सुरक्षा के लिए दस मिनट में एक नंबर पर सिर्फ़ पाँच कोड भेजे जा सकते हैं। थोड़ा रुककर दोबारा कोशिश कीजिए, या दूसरा नंबर इस्तेमाल कीजिए।',
      },
      error: {
        wrongCode: 'यह कोड सही नहीं है। थोड़े इंतज़ार से पहले {{remaining}} कोशिशें बची हैं।',
        malformed: 'कोड ठीक छह अंकों का होता है।',
        network: 'हम कोड जाँच नहीं पाए। थोड़ी देर में दोबारा कोशिश कीजिए।',
        missingContext: 'साइन-इन स्क्रीन से दोबारा शुरू कीजिए, ताकि हमें पता हो कौन सा नंबर जाँचना है।',
        tooMany: 'इस नंबर के लिए बहुत कोशिशें हो गईं। कुछ मिनट रुककर नया कोड माँगिए।',
        phoneLinked: 'यह नंबर पहले से किसी दूसरे साइन-इन से जुड़ा है। कृपया AIEC ऑफ़िस को फ़ोन कीजिए।',
        wrongServerCode: 'यह कोड सही नहीं है या इसका समय निकल गया। जाँचिए, या नया कोड माँगिए।',
        phoneTaken: 'इस नंबर का पहले से अपना AIEC साइन-इन है। उस नंबर पर आए कोड से एक बार साइन इन करें, फिर सेटिंग्स खोलकर Google जोड़ें चुनें।',
        invalidPhone: '10 अंकों का भारतीय मोबाइल नंबर डालिए।',
      },
    },
  },

  mr: {
    otp: {
      title: 'तुमचा कोड टाका',
      sentTo: 'आम्ही {{phone}} वर ६ अंकी कोड पाठवला आहे.',
      inputLabel: 'पडताळणी कोड अंक',
      verify: 'तपासा',
      verifying: 'तपासत आहे…',
      success: 'पडताळले',
      changeNumber: 'दुसरा क्रमांक वापरा',
      resend: 'पुन्हा पाठवा',
      resendIn: '{{seconds}} सेकंदांनी नवीन कोड मागू शकता',
      resendCount: '{{max}} पैकी {{used}} कोड मागितले',
      countryNote: 'भारताबाहेरचा क्रमांक आहे? तोही चालतो — फक्त बरोबर देश कोड लावा.',
      noGateway:
        'या बिल्डमध्ये मेसेजिंग गेटवे जोडलेला नाही, त्यामुळे SMS प्रत्यक्षात जात नाही. तुमचा कोड {{code}} आहे.',
      server: {
        smsConnected: 'कोड SMS ने तुमच्या फोनवर पाठवला आहे. तो काही मिनिटे चालेल.',
        smsNotConnected:
          'AIEC ने अजून SMS सेवा जोडलेली नाही, त्यामुळे हा कोड तुमच्या फोनवर जात नाही. तुमच्या क्रमांकासाठी ठेवलेला कोड ऑफिसला विचारा.',
      },
      pending: {
        title: 'तुम्ही साइन इन आहात, AIEC ची वाट पाहत आहोत',
        body: 'तुमचा क्रमांक पक्का झाला. AIEC ने अजून तुमच्या खात्याला भूमिका दिलेली नाही, त्यामुळे ऑफिस देईपर्यंत उघडण्यासारखे काही नाही. तुम्ही कशासाठी आला आहात ते सांगू शकता.',
        ask: 'तुम्ही कोणत्या भूमिकेत जोडले जात आहात?',
        asked: 'धन्यवाद. तुम्ही {{role}} म्हणून जोडले जाऊ इच्छिता हे AIEC ला कळवले आहे.',
        askFailed: 'हे AIEC पर्यंत पोहोचले नाही. कनेक्शन तपासून पुन्हा प्रयत्न करा.',
      },
      link: {
        title: 'तुमचा मोबाइल क्रमांक पक्का करा',
        body: 'तुम्ही Google ने साइन इन केले आहे. AIEC प्रत्येक व्यक्तीला तिच्या मोबाइल क्रमांकाने ओळखते, म्हणून तुमचा क्रमांक एकदा पक्का करा: आम्ही त्यावर एक कोड पाठवू. यानंतर Google आणि तुमचा क्रमांक एकच खाते असतील.',
        field: 'मोबाइल क्रमांक',
        hint: 'ज्या क्रमांकाने तुम्ही AIEC चे काम करता तो.',
        send: 'कोड पाठवा',
      },
      inactive: {
        title: 'हे खाते उघडे नाही',
        body: 'तुमचा क्रमांक पक्का आहे, पण हे खाते बंद केले आहे किंवा थांबवले आहे. कृपया AIEC ऑफिसला फोन करा.',
      },
      expired: {
        title: 'हा कोड कालबाह्य झाला',
        body: 'कोड पाच मिनिटे चालतो. नवीन कोड मागा, घड्याळ पुन्हा सुरू होईल.',
        action: 'नवीन कोड पाठवा',
      },
      cooldown: {
        title: 'खूप वेळा चुकीचा कोड',
        body: 'जरा थांबा — {{seconds}} सेकंदांनी पुन्हा प्रयत्न करता येईल.',
      },
      resendBlocked: {
        title: 'खूप जास्त कोड मागितले',
        body: 'सुरक्षेसाठी दहा मिनिटांत एका क्रमांकावर फक्त पाच कोड पाठवता येतात. जरा थांबून पुन्हा प्रयत्न करा, किंवा दुसरा क्रमांक वापरा.',
      },
      error: {
        wrongCode: 'हा कोड बरोबर नाही. थोड्या प्रतीक्षेआधी {{remaining}} प्रयत्न शिल्लक आहेत.',
        malformed: 'कोड नेमका सहा अंकांचा असतो.',
        network: 'आम्ही कोड तपासू शकलो नाही. थोड्या वेळाने पुन्हा प्रयत्न करा.',
        missingContext: 'साइन-इन स्क्रीनवरून पुन्हा सुरू करा, म्हणजे कोणता क्रमांक तपासायचा ते आम्हाला कळेल.',
        tooMany: 'या क्रमांकासाठी खूप प्रयत्न झाले. काही मिनिटे थांबून नवीन कोड मागा.',
        phoneLinked: 'हा क्रमांक आधीच दुसऱ्या साइन-इनशी जोडलेला आहे. कृपया AIEC ऑफिसला फोन करा.',
        wrongServerCode: 'हा कोड बरोबर नाही किंवा त्याची वेळ संपली. तपासा, किंवा नवीन कोड मागा.',
        phoneTaken: 'या क्रमांकाचे आधीच स्वतःचे AIEC साइन-इन आहे. त्या क्रमांकावर आलेल्या कोडने एकदा साइन इन करा, मग सेटिंग्ज उघडून Google जोडा निवडा.',
        invalidPhone: '१० अंकी भारतीय मोबाइल क्रमांक टाका.',
      },
    },
  },
};

export default translations;
