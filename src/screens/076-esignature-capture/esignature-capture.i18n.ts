import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    esignatureCapture: {
      title: 'E-Signature Capture',
      loading: 'Loading signature status',
      error: { title: 'Could not load this signature', body: 'Check your connection and try again.' },

      notReady: {
        title: 'No contract to sign yet',
        body: 'A contract must be generated before it can be signed.',
        goToContract: 'Go to Digital Contract Generator',
      },

      status: {
        unsigned: 'Unsigned',
        customer_signed: 'Customer Signed, Pending Countersignature',
        fully_signed: 'Closed Won',
      },

      progress: {
        customerStep: 'Customer signed',
        aiecStep: 'AIEC countersigned',
      },

      otp: {
        heading: 'Confirm identity',
        body: "Before signing, confirm the customer's identity with a one-time code — this strengthens the signature's legal standing.",
        label: 'One-time code',
        wrongCode: 'That code is incorrect. Please try again.',
        verify: 'Verify',
        fallbackOffer: "Repeated wrong codes — if the customer's phone number has changed, use manual identity confirmation instead of blocking the signature.",
        fallbackButton: 'Confirm identity manually',
        verified: 'Identity confirmed by one-time code',
        verifiedManually: 'Identity confirmed manually',
        demoHint: 'Demo build — the one-time code is 123456.',
      },

      signing: {
        heading: 'Signature',
        tabDrawn: 'Draw',
        tabTyped: 'Type name',
        drawHint: 'Sign with a finger or stylus in the box below.',
        clear: 'Clear',
        typedLabel: 'Type your full name as your signature',
        typedPlaceholder: 'Full name',
        consentLabel: 'I understand this is a legally binding electronic signature and I consent to sign this contract electronically.',
        submit: 'Sign contract',
      },

      pendingCountersign: {
        heading: 'Waiting on AIEC countersignature',
        body: "The customer has signed. This deal is not yet Closed Won and downstream steps (like supplier ordering) won't start until AIEC's authorized signatory countersigns.",
        signedBy: 'Signed by {{name}}',
        countersignButton: 'Countersign as AIEC',
      },

      fullySigned: {
        heading: 'Deal Closed Won!',
        body: 'Both signatures are captured. This contract is now immutable and is the instrument every downstream module reads.',
        customerSignedLine: '{{name}} signed on {{date}}.',
        countersignedLine: 'AIEC countersigned on {{date}}.',
        viewClosure: 'View closure confirmation',
      },

      toast: {
        signed: 'Signature captured',
        countersigned: 'Countersigned — this deal is now Closed Won',
        error: 'Something went wrong. Please try again.',
      },
    },
  },
  hi: {
    esignatureCapture: {
      title: 'ई-हस्ताक्षर',
      loading: 'हस्ताक्षर की स्थिति लोड हो रही है',
      error: { title: 'यह हस्ताक्षर लोड नहीं हो सका', body: 'अपना कनेक्शन जांचें और फिर से कोशिश करें।' },

      notReady: {
        title: 'अभी हस्ताक्षर के लिए कोई अनुबंध नहीं है',
        body: 'हस्ताक्षर करने से पहले एक अनुबंध तैयार करना ज़रूरी है।',
        goToContract: 'डिजिटल अनुबंध जेनरेटर पर जाएं',
      },

      status: {
        unsigned: 'हस्ताक्षर नहीं हुए',
        customer_signed: 'ग्राहक ने हस्ताक्षर किए, प्रति-हस्ताक्षर बाकी',
        fully_signed: 'डील बंद — जीती गई',
      },

      progress: {
        customerStep: 'ग्राहक ने हस्ताक्षर किए',
        aiecStep: 'AIEC ने प्रति-हस्ताक्षर किए',
      },

      otp: {
        heading: 'पहचान की पुष्टि करें',
        body: 'हस्ताक्षर से पहले, एक बार के कोड से ग्राहक की पहचान की पुष्टि करें — इससे हस्ताक्षर की कानूनी मज़बूती बढ़ती है।',
        label: 'एक बार का कोड',
        wrongCode: 'यह कोड गलत है। कृपया फिर से कोशिश करें।',
        verify: 'सत्यापित करें',
        fallbackOffer: 'बार-बार गलत कोड — अगर ग्राहक का फ़ोन नंबर बदल गया है, तो हस्ताक्षर को रोकने के बजाय मैन्युअल पहचान पुष्टि का उपयोग करें।',
        fallbackButton: 'पहचान की मैन्युअल पुष्टि करें',
        verified: 'एक बार के कोड से पहचान की पुष्टि हुई',
        verifiedManually: 'पहचान की मैन्युअल पुष्टि हुई',
        demoHint: 'डेमो बिल्ड — एक बार का कोड 123456 है।',
      },

      signing: {
        heading: 'हस्ताक्षर',
        tabDrawn: 'बनाएं',
        tabTyped: 'नाम टाइप करें',
        drawHint: 'नीचे दिए गए बॉक्स में उंगली या स्टाइलस से हस्ताक्षर करें।',
        clear: 'मिटाएं',
        typedLabel: 'अपने हस्ताक्षर के रूप में अपना पूरा नाम टाइप करें',
        typedPlaceholder: 'पूरा नाम',
        consentLabel: 'मैं समझता/समझती हूं कि यह एक कानूनी रूप से बाध्यकारी इलेक्ट्रॉनिक हस्ताक्षर है और मैं इस अनुबंध पर इलेक्ट्रॉनिक रूप से हस्ताक्षर करने के लिए सहमत हूं।',
        submit: 'अनुबंध पर हस्ताक्षर करें',
      },

      pendingCountersign: {
        heading: 'AIEC के प्रति-हस्ताक्षर का इंतज़ार',
        body: 'ग्राहक ने हस्ताक्षर कर दिए हैं। यह डील अभी बंद-जीती नहीं मानी जाएगी और आगे के कदम (जैसे आपूर्तिकर्ता ऑर्डर) तब तक शुरू नहीं होंगे जब तक AIEC का अधिकृत हस्ताक्षरकर्ता प्रति-हस्ताक्षर नहीं करता।',
        signedBy: '{{name}} द्वारा हस्ताक्षरित',
        countersignButton: 'AIEC की ओर से प्रति-हस्ताक्षर करें',
      },

      fullySigned: {
        heading: 'डील बंद — जीती गई!',
        body: 'दोनों हस्ताक्षर दर्ज हो गए हैं। यह अनुबंध अब अपरिवर्तनीय है और हर आगे के मॉड्यूल द्वारा इसे ही पढ़ा जाएगा।',
        customerSignedLine: '{{name}} ने {{date}} को हस्ताक्षर किए।',
        countersignedLine: 'AIEC ने {{date}} को प्रति-हस्ताक्षर किए।',
        viewClosure: 'क्लोज़र पुष्टिकरण देखें',
      },

      toast: {
        signed: 'हस्ताक्षर दर्ज हो गए',
        countersigned: 'प्रति-हस्ताक्षर हो गए — यह डील अब बंद-जीती है',
        error: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
      },
    },
  },
  mr: {
    esignatureCapture: {
      title: 'ई-स्वाक्षरी',
      loading: 'स्वाक्षरीची स्थिती लोड होत आहे',
      error: { title: 'ही स्वाक्षरी लोड होऊ शकली नाही', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },

      notReady: {
        title: 'अजून स्वाक्षरीसाठी कोणताही करार नाही',
        body: 'स्वाक्षरी करण्यापूर्वी करार तयार करणे आवश्यक आहे.',
        goToContract: 'डिजिटल करार जनरेटरकडे जा',
      },

      status: {
        unsigned: 'स्वाक्षरी झालेली नाही',
        customer_signed: 'ग्राहकाने स्वाक्षरी केली, प्रति-स्वाक्षरी बाकी',
        fully_signed: 'डील बंद — जिंकली',
      },

      progress: {
        customerStep: 'ग्राहकाने स्वाक्षरी केली',
        aiecStep: 'AIEC ने प्रति-स्वाक्षरी केली',
      },

      otp: {
        heading: 'ओळख निश्चित करा',
        body: 'स्वाक्षरी करण्यापूर्वी, एक-वेळ कोडने ग्राहकाची ओळख निश्चित करा — यामुळे स्वाक्षरीची कायदेशीर बळकटी वाढते.',
        label: 'एक-वेळ कोड',
        wrongCode: 'हा कोड चुकीचा आहे. कृपया पुन्हा प्रयत्न करा.',
        verify: 'सत्यापित करा',
        fallbackOffer: 'वारंवार चुकीचे कोड — ग्राहकाचा फोन नंबर बदलला असल्यास, स्वाक्षरी रोखण्याऐवजी मॅन्युअल ओळख निश्चितीकरण वापरा.',
        fallbackButton: 'ओळख मॅन्युअली निश्चित करा',
        verified: 'एक-वेळ कोडने ओळख निश्चित झाली',
        verifiedManually: 'ओळख मॅन्युअली निश्चित झाली',
        demoHint: 'डेमो बिल्ड — एक-वेळ कोड 123456 आहे.',
      },

      signing: {
        heading: 'स्वाक्षरी',
        tabDrawn: 'काढा',
        tabTyped: 'नाव टाइप करा',
        drawHint: 'खालील बॉक्समध्ये बोट किंवा स्टायलसने स्वाक्षरी करा.',
        clear: 'पुसा',
        typedLabel: 'तुमच्या स्वाक्षरीसाठी तुमचे पूर्ण नाव टाइप करा',
        typedPlaceholder: 'पूर्ण नाव',
        consentLabel: 'मला समजते की ही कायदेशीरदृष्ट्या बंधनकारक इलेक्ट्रॉनिक स्वाक्षरी आहे आणि मी हा करार इलेक्ट्रॉनिक पद्धतीने स्वाक्षरी करण्यास सहमत आहे.',
        submit: 'करारावर स्वाक्षरी करा',
      },

      pendingCountersign: {
        heading: 'AIEC च्या प्रति-स्वाक्षरीची प्रतीक्षा',
        body: 'ग्राहकाने स्वाक्षरी केली आहे. AIEC च्या अधिकृत स्वाक्षरीकर्त्याने प्रति-स्वाक्षरी करेपर्यंत ही डील बंद-जिंकली मानली जाणार नाही आणि पुढील पावले (जसे पुरवठादार ऑर्डर) सुरू होणार नाहीत.',
        signedBy: '{{name}} यांनी स्वाक्षरी केली',
        countersignButton: 'AIEC च्या वतीने प्रति-स्वाक्षरी करा',
      },

      fullySigned: {
        heading: 'डील बंद — जिंकली!',
        body: 'दोन्ही स्वाक्षऱ्या नोंदल्या गेल्या आहेत. हा करार आता अपरिवर्तनीय आहे आणि पुढील प्रत्येक मॉड्यूल हाच वाचेल.',
        customerSignedLine: '{{name}} यांनी {{date}} रोजी स्वाक्षरी केली.',
        countersignedLine: 'AIEC ने {{date}} रोजी प्रति-स्वाक्षरी केली.',
        viewClosure: 'क्लोजर पुष्टीकरण पहा',
      },

      toast: {
        signed: 'स्वाक्षरी नोंदवली',
        countersigned: 'प्रति-स्वाक्षरी झाली — ही डील आता बंद-जिंकली आहे',
        error: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
