import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    onbSupplier: {
      title: 'Register as a supplier',
      subtitle: 'Company KYC, your catalogue, and how we pay you. Four steps.',
      step: {
        company: 'Company',
        catalog: 'Catalogue',
        bank: 'Payment details',
        terms: 'Terms',
      },
      field: {
        companyName: 'Registered company name',
        gstin: 'GSTIN',
        gstinHint: 'Exactly as it appears on your GST certificate.',
        registeredAddress: 'Registered address',
        city: 'City',
        pincode: 'PIN code',
        signatoryName: 'Authorised signatory',
        signatoryDesignation: 'Their designation',
        signatoryPhone: 'Signatory mobile number',
        signatoryPhoneHint: "You'll sign in with this number to follow your KYC review and, once approved, your orders.",
        catalogRowCount: 'How many products are in the file?',
        catalogRowCountHint: 'A rough count helps us spot a truncated upload.',
        accountHolder: 'Name on the account',
        accountNumber: 'Account number',
        ifsc: 'IFSC code',
      },
      gstin: {
        verify: 'Verify GSTIN',
        running: 'Checking…',
        matched: 'GSTIN verified',
        lookupFailed:
          'Format checked, and this GSTIN is not already registered with AIEC. The GST registry lookup is not connected yet, so an admin confirms the legal name by hand before your account goes live.',
        mismatch:
          'The legal name on this GSTIN does not match the company name you entered. Check both and try again.',
        duplicate:
          'This GSTIN is already registered with AIEC. A company can only hold one supplier account.',
        duplicateAction: 'Request access to the existing account',
      },
      catalog: {
        heading: 'Seed your catalogue',
        body: 'Upload a starter list of parts and models with pricing and we will pre-populate your catalogue. You can skip this and add products later.',
        doc: 'Catalogue file',
        formats: 'Accepted formats: {{formats}}',
        pendingReview:
          'Uploaded pricing goes into review, not straight into the catalogue. An admin checks it before anything becomes orderable.',
        skip: 'No file yet? That is fine — this step is optional and you can add products after approval.',
      },
      bank: {
        heading: 'Where AIEC pays you',
        body: 'We pay against delivery milestones. This account is verified the same way partner payout accounts are.',
        doc: 'Cancelled cheque or bank letter',
        verify: 'Verify account with a ₹1 test deposit',
        running: 'Checking with your bank…',
        verified: 'Account verified',
        failed: 'Verification failed',
        notConnected: 'The bank check is not connected yet, so this account has not been verified. AIEC confirms it with you before the first payment.',
        blocked:
          'This account could not be verified. You can finish registering, but no payment can be released until it is sorted.',
      },
      terms: {
        heading: 'Before you submit',
        sla: 'I accept the AIEC supplier service levels',
        slaDetail:
          'Confirmed delivery dates are held to, and a slip is reported as soon as it is known rather than on the due date.',
        payment: 'I accept payment on delivery milestones',
        paymentDetail:
          'Payment is released against confirmed delivery and goods-received checks, not against the order date.',
        legalNote:
          'The English version of the supplier agreement is the binding text. Any Hindi or Marathi version is provided to help you read it, not to replace it. Please have your own advisor review it before you sign.',
        required: 'Accept both to submit your registration.',
      },
      invalid: {
        companyName: 'Enter the company name exactly as registered.',
        gstin: 'A GSTIN is 15 characters, like 27AABCV1234A1Z5.',
        pincode: 'Enter a valid 6-digit PIN code.',
        ifsc: 'An IFSC looks like HDFC0001234 — four letters, a zero, then six characters.',
        accountNumber: 'An account number is between 9 and 18 digits.',
        signatoryPhone: 'Enter a valid 10-digit Indian mobile number.',
      },
      submitError: {
        duplicate_gstin: 'A supplier with this GSTIN is already registered. Contact AIEC if this is your company.',
        phone_taken: 'This mobile number is already linked to another AIEC account. Use a different number.',
        generic: 'We could not submit your details. Please try again.',
      },
      poNote:
        'No purchase order can be issued to you until an admin approves this KYC. We will tell you the moment it is done.',
    },
  },

  hi: {
    onbSupplier: {
      title: 'आपूर्तिकर्ता के रूप में पंजीकरण',
      subtitle: 'कंपनी KYC, आपका कैटलॉग, और भुगतान का तरीक़ा। चार चरण।',
      step: {
        company: 'कंपनी',
        catalog: 'कैटलॉग',
        bank: 'भुगतान विवरण',
        terms: 'शर्तें',
      },
      field: {
        companyName: 'पंजीकृत कंपनी का नाम',
        gstin: 'GSTIN',
        gstinHint: 'ठीक वैसा ही जैसा आपके GST प्रमाणपत्र पर है।',
        registeredAddress: 'पंजीकृत पता',
        city: 'शहर',
        pincode: 'पिन कोड',
        signatoryName: 'अधिकृत हस्ताक्षरकर्ता',
        signatoryDesignation: 'उनका पद',
        signatoryPhone: 'हस्ताक्षरकर्ता का मोबाइल नंबर',
        signatoryPhoneHint: 'इसी नंबर से साइन इन करके आप अपनी KYC समीक्षा और स्वीकृति के बाद अपने ऑर्डर देख सकेंगे।',
        catalogRowCount: 'फ़ाइल में कितने उत्पाद हैं?',
        catalogRowCountHint: 'मोटा-मोटी गिनती से हमें अधूरी अपलोड पकड़ने में मदद मिलती है।',
        accountHolder: 'खाते पर लिखा नाम',
        accountNumber: 'खाता संख्या',
        ifsc: 'IFSC कोड',
      },
      gstin: {
        verify: 'GSTIN सत्यापित करें',
        running: 'जाँच हो रही है…',
        matched: 'GSTIN सत्यापित',
        lookupFailed:
          'फ़ॉर्मैट जाँचा गया, और यह GSTIN AIEC में पहले से पंजीकृत नहीं है। GST रजिस्ट्री से मिलान अभी जुड़ा नहीं है, इसलिए खाता चालू होने से पहले एक एडमिन हाथ से कानूनी नाम की पुष्टि करेगा।',
        mismatch:
          'इस GSTIN का क़ानूनी नाम आपकी लिखी कंपनी के नाम से मेल नहीं खाता। दोनों जाँचकर दोबारा कोशिश कीजिए।',
        duplicate:
          'यह GSTIN पहले से AIEC में दर्ज है। एक कंपनी का सिर्फ़ एक ही आपूर्तिकर्ता खाता हो सकता है।',
        duplicateAction: 'मौजूदा खाते तक पहुँच माँगें',
      },
      catalog: {
        heading: 'अपना कैटलॉग शुरू कीजिए',
        body: 'पुर्ज़ों और मॉडलों की शुरुआती सूची क़ीमत सहित अपलोड कीजिए, हम आपका कैटलॉग पहले से भर देंगे। यह छोड़कर बाद में भी उत्पाद जोड़ सकते हैं।',
        doc: 'कैटलॉग फ़ाइल',
        formats: 'स्वीकार्य प्रारूप: {{formats}}',
        pendingReview:
          'अपलोड की गई क़ीमतें सीधे कैटलॉग में नहीं जातीं, जाँच में जाती हैं। ऑर्डर लायक बनने से पहले एडमिन उन्हें देखता है।',
        skip: 'अभी फ़ाइल नहीं है? कोई बात नहीं — यह चरण वैकल्पिक है, मंज़ूरी के बाद उत्पाद जोड़ सकते हैं।',
      },
      bank: {
        heading: 'AIEC आपको कहाँ भुगतान करे',
        body: 'हम डिलीवरी के पड़ावों पर भुगतान करते हैं। यह खाता उसी तरह सत्यापित होता है जैसे पार्टनर के भुगतान खाते।',
        doc: 'रद्द किया हुआ चेक या बैंक पत्र',
        verify: '₹1 की जाँच-राशि से खाता सत्यापित करें',
        running: 'आपके बैंक से जाँच हो रही है…',
        verified: 'खाता सत्यापित',
        failed: 'सत्यापन नहीं हुआ',
        notConnected: 'बैंक जाँच अभी जुड़ी नहीं है, इसलिए यह खाता सत्यापित नहीं हुआ है। पहले भुगतान से पहले AIEC आपके साथ इसकी पुष्टि करेगा।',
        blocked:
          'यह खाता सत्यापित नहीं हो पाया। आप पंजीकरण पूरा कर सकते हैं, लेकिन ठीक होने तक कोई भुगतान जारी नहीं होगा।',
      },
      terms: {
        heading: 'भेजने से पहले',
        sla: 'मैं AIEC की आपूर्तिकर्ता सेवा-शर्तें स्वीकार करता हूँ',
        slaDetail:
          'पक्की की गई डिलीवरी तारीख़ें निभाई जाती हैं, और देरी की जानकारी नियत तारीख़ पर नहीं, पता चलते ही दी जाती है।',
        payment: 'मैं डिलीवरी पड़ावों पर भुगतान स्वीकार करता हूँ',
        paymentDetail:
          'भुगतान ऑर्डर की तारीख़ पर नहीं, पुष्ट डिलीवरी और माल-प्राप्ति जाँच के आधार पर जारी होता है।',
        legalNote:
          'आपूर्तिकर्ता अनुबंध का अंग्रेज़ी संस्करण ही बाध्यकारी है। हिंदी या मराठी संस्करण सिर्फ़ आपकी समझ के लिए है, उसकी जगह लेने के लिए नहीं। हस्ताक्षर से पहले कृपया अपने सलाहकार से जाँच करवाइए।',
        required: 'पंजीकरण भेजने के लिए दोनों स्वीकार कीजिए।',
      },
      invalid: {
        companyName: 'कंपनी का नाम ठीक वैसा ही लिखिए जैसा पंजीकृत है।',
        gstin: 'GSTIN 15 अक्षरों का होता है, जैसे 27AABCV1234A1Z5।',
        pincode: 'सही 6 अंकों का पिन कोड डालिए।',
        ifsc: 'IFSC ऐसा दिखता है: HDFC0001234 — चार अक्षर, एक शून्य, फिर छह अक्षर-अंक।',
        accountNumber: 'खाता संख्या 9 से 18 अंकों की होती है।',
        signatoryPhone: 'एक मान्य 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें।',
      },
      submitError: {
        duplicate_gstin: 'इस GSTIN वाला सप्लायर पहले से पंजीकृत है। यदि यह आपकी कंपनी है तो AIEC से संपर्क करें।',
        phone_taken: 'यह मोबाइल नंबर पहले से किसी अन्य AIEC खाते से जुड़ा है। कोई दूसरा नंबर उपयोग करें।',
        generic: 'हम आपका विवरण जमा नहीं कर सके। कृपया फिर से प्रयास करें।',
      },
      poNote:
        'जब तक एडमिन यह KYC मंज़ूर नहीं करता, आपको कोई ऑर्डर जारी नहीं किया जा सकता। मंज़ूरी होते ही हम बता देंगे।',
    },
  },

  mr: {
    onbSupplier: {
      title: 'पुरवठादार म्हणून नोंदणी',
      subtitle: 'कंपनी KYC, तुमचा कॅटलॉग, आणि पैसे देण्याची पद्धत. चार टप्पे.',
      step: {
        company: 'कंपनी',
        catalog: 'कॅटलॉग',
        bank: 'पैशांचे तपशील',
        terms: 'अटी',
      },
      field: {
        companyName: 'नोंदणीकृत कंपनीचे नाव',
        gstin: 'GSTIN',
        gstinHint: 'तुमच्या GST प्रमाणपत्रावर आहे अगदी तसेच.',
        registeredAddress: 'नोंदणीकृत पत्ता',
        city: 'शहर',
        pincode: 'पिन कोड',
        signatoryName: 'अधिकृत स्वाक्षरीकर्ता',
        signatoryDesignation: 'त्यांचे पद',
        signatoryPhone: 'स्वाक्षरीकर्त्याचा मोबाईल क्रमांक',
        signatoryPhoneHint: 'याच क्रमांकाने साइन इन करून तुम्ही तुमचे KYC पुनरावलोकन आणि मंजुरीनंतर तुमचे ऑर्डर पाहू शकाल.',
        catalogRowCount: 'फाइलमध्ये किती उत्पादने आहेत?',
        catalogRowCountHint: 'ढोबळ आकड्यामुळे अर्धवट अपलोड ओळखणे आम्हाला सोपे जाते.',
        accountHolder: 'खात्यावरील नाव',
        accountNumber: 'खाते क्रमांक',
        ifsc: 'IFSC कोड',
      },
      gstin: {
        verify: 'GSTIN पडताळा',
        running: 'तपासत आहे…',
        matched: 'GSTIN पडताळले',
        lookupFailed:
          'फॉरमॅट तपासला, आणि हा GSTIN AIEC मध्ये आधीच नोंदलेला नाही. GST नोंदवहीशी जुळवणी अजून जोडलेली नाही, त्यामुळे खाते सुरू होण्यापूर्वी एक प्रशासक कायदेशीर नाव हाताने तपासेल.',
        mismatch:
          'या GSTIN वरील कायदेशीर नाव तुम्ही लिहिलेल्या कंपनीच्या नावाशी जुळत नाही. दोन्ही तपासा आणि पुन्हा प्रयत्न करा.',
        duplicate:
          'हे GSTIN आधीच AIEC कडे नोंदलेले आहे. एका कंपनीचे फक्त एकच पुरवठादार खाते असू शकते.',
        duplicateAction: 'सध्याच्या खात्यासाठी प्रवेश मागा',
      },
      catalog: {
        heading: 'तुमचा कॅटलॉग सुरू करा',
        body: 'सुटे भाग आणि मॉडेलची सुरुवातीची यादी किंमतीसह अपलोड करा, आम्ही तुमचा कॅटलॉग आधीच भरून देऊ. हे वगळून नंतरही उत्पादने जोडता येतील.',
        doc: 'कॅटलॉग फाइल',
        formats: 'स्वीकारले जाणारे प्रकार: {{formats}}',
        pendingReview:
          'अपलोड केलेल्या किंमती थेट कॅटलॉगमध्ये जात नाहीत, तपासणीत जातात. ऑर्डरयोग्य होण्यापूर्वी प्रशासक त्या पाहतो.',
        skip: 'अजून फाइल नाही? हरकत नाही — हा टप्पा ऐच्छिक आहे, मंजुरीनंतर उत्पादने जोडता येतील.',
      },
      bank: {
        heading: 'AIEC ने पैसे कुठे द्यायचे',
        body: 'आम्ही वितरणाच्या टप्प्यांवर पैसे देतो. हे खाते भागीदारांच्या खात्यांप्रमाणेच पडताळले जाते.',
        doc: 'रद्द केलेला धनादेश किंवा बँकेचे पत्र',
        verify: '₹१ च्या चाचणी रकमेने खाते पडताळा',
        running: 'तुमच्या बँकेकडून तपासत आहे…',
        verified: 'खाते पडताळले',
        failed: 'पडताळणी झाली नाही',
        notConnected: 'बँक तपासणी अजून जोडलेली नाही, त्यामुळे हे खाते पडताळलेले नाही. पहिल्या पेमेंटपूर्वी AIEC तुमच्यासोबत त्याची खात्री करेल.',
        blocked:
          'हे खाते पडताळता आले नाही. तुम्ही नोंदणी पूर्ण करू शकता, पण हे सुरळीत होईपर्यंत कोणतेही पैसे दिले जाणार नाहीत.',
      },
      terms: {
        heading: 'पाठवण्यापूर्वी',
        sla: 'मी AIEC च्या पुरवठादार सेवा-अटी स्वीकारतो',
        slaDetail:
          'निश्चित केलेल्या वितरण तारखा पाळल्या जातात, आणि उशीर झाल्यास तो देय तारखेला नव्हे, कळताच सांगितला जातो.',
        payment: 'मी वितरण टप्प्यांवर पैसे स्वीकारतो',
        paymentDetail:
          'पैसे ऑर्डरच्या तारखेवर नव्हे, तर पक्क्या वितरणावर आणि माल-मिळाल्याच्या तपासणीवर दिले जातात.',
        legalNote:
          'पुरवठादार कराराची इंग्रजी आवृत्तीच बंधनकारक आहे. हिंदी किंवा मराठी आवृत्ती फक्त तुम्हाला समजण्यासाठी आहे, तिची जागा घेण्यासाठी नाही. सही करण्यापूर्वी कृपया तुमच्या सल्लागाराकडून तपासून घ्या.',
        required: 'नोंदणी पाठवण्यासाठी दोन्ही स्वीकारा.',
      },
      invalid: {
        companyName: 'कंपनीचे नाव नोंदणीप्रमाणे अगदी तसेच लिहा.',
        gstin: 'GSTIN १५ अक्षरांचा असतो, जसे 27AABCV1234A1Z5.',
        pincode: 'योग्य ६ अंकी पिन कोड टाका.',
        ifsc: 'IFSC असा दिसतो: HDFC0001234 — चार अक्षरे, एक शून्य, मग सहा अक्षरे-अंक.',
        accountNumber: 'खाते क्रमांक ९ ते १८ अंकांचा असतो.',
        signatoryPhone: 'वैध १० अंकी भारतीय मोबाईल क्रमांक टाका.',
      },
      submitError: {
        duplicate_gstin: 'या GSTIN चा सप्लायर आधीच नोंदणीकृत आहे. ही तुमची कंपनी असल्यास AIEC शी संपर्क साधा.',
        phone_taken: 'हा मोबाईल क्रमांक आधीच दुसऱ्या AIEC खात्याशी जोडलेला आहे. वेगळा क्रमांक वापरा.',
        generic: 'आम्ही तुमचे तपशील सादर करू शकलो नाही. कृपया पुन्हा प्रयत्न करा.',
      },
      poNote:
        'प्रशासक हे KYC मंजूर करेपर्यंत तुम्हाला कोणतीही ऑर्डर देता येणार नाही. मंजुरी होताच आम्ही कळवू.',
    },
  },
};

export default translations;
