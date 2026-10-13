import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    captureContact: {
      title: 'Who did you meet',
      subtitle: 'The builder or owner behind this site.',
      field: {
        name: 'Full name',
        phone: 'Mobile number',
        phoneHint: "We check this against AIEC's records as you type.",
        company: 'Company (if any)',
        role: 'Their role',
        note: 'How you connected',
        noteHint: 'Optional — anything specific they mentioned that would help whoever quotes this next.',
      },
      role: {
        owner: 'Owner',
        contractor: 'Contractor',
        architect: 'Architect',
        facilityManager: 'Facility manager',
      },
      noPhone: {
        toggle: 'No phone number given',
        hint: "They're open to a visit but did not want to share a number yet — that's fine, note it and carry on.",
      },
      consent: {
        label: 'They agreed to be contacted about elevator services',
        hint: 'Required before this lead can be followed up by phone, SMS or WhatsApp.',
        required: 'This has to be checked before you can continue — consent is what makes every follow-up message compliant.',
      },
      phoneCheck: {
        checking: 'Checking…',
        clear: 'New contact — nothing on file yet.',
        duplicateLead: 'This number is already a lead as {{name}}. You may be looking at the same site.',
        existingCustomer: '{{name}} is already an AIEC customer. This could be a repeat project, not a fresh lead.',
      },
      businessCard: {
        heading: 'Scan a business card',
        body: 'Take a photo and we will try to read the name, company and number straight off it.',
        scanning: 'Reading the card…',
        applied: 'Filled in below',
        reviewNote: 'This only fills in blank fields, and never overwrites anything you have already typed — check everything before continuing.',
      },
      invalid: {
        name: 'Enter at least a first and last name.',
        phone: 'Enter a 10-digit Indian mobile number.',
      },
    },
  },

  hi: {
    captureContact: {
      title: 'आप किससे मिले',
      subtitle: 'इस साइट के पीछे का बिल्डर या मालिक।',
      field: {
        name: 'पूरा नाम',
        phone: 'मोबाइल नंबर',
        phoneHint: 'आपके टाइप करते ही हम इसे AIEC के रिकॉर्ड से मिला लेते हैं।',
        company: 'कंपनी (अगर हो)',
        role: 'उनकी भूमिका',
        note: 'कैसे संपर्क हुआ',
        noteHint: 'वैकल्पिक — कोई ख़ास बात जो उन्होंने बताई हो और अगले व्यक्ति के काम आए।',
      },
      role: {
        owner: 'मालिक',
        contractor: 'ठेकेदार',
        architect: 'आर्किटेक्ट',
        facilityManager: 'फ़ैसिलिटी मैनेजर',
      },
      noPhone: {
        toggle: 'फ़ोन नंबर नहीं दिया',
        hint: 'वे मिलने को तैयार हैं पर अभी नंबर नहीं देना चाहते — ठीक है, बस नोट कर लीजिए और आगे बढ़िए।',
      },
      consent: {
        label: 'वे लिफ़्ट सेवाओं के बारे में संपर्क किए जाने के लिए राज़ी हैं',
        hint: 'फ़ोन, SMS या WhatsApp से फ़ॉलो-अप के लिए यह ज़रूरी है।',
        required: 'आगे बढ़ने से पहले यह टिक होना ज़रूरी है — यही सहमति हर फ़ॉलो-अप संदेश को नियम-अनुरूप बनाती है।',
      },
      phoneCheck: {
        checking: 'जाँचा जा रहा है…',
        clear: 'नया संपर्क — अभी कुछ दर्ज नहीं है।',
        duplicateLead: 'यह नंबर पहले से {{name}} नाम से लीड है। हो सकता है यह वही साइट हो।',
        existingCustomer: '{{name}} पहले से AIEC ग्राहक हैं। यह नया लीड नहीं, दोबारा का प्रोजेक्ट हो सकता है।',
      },
      businessCard: {
        heading: 'बिज़नेस कार्ड स्कैन करें',
        body: 'फ़ोटो लीजिए, हम उससे नाम, कंपनी और नंबर पढ़ने की कोशिश करेंगे।',
        scanning: 'कार्ड पढ़ा जा रहा है…',
        applied: 'नीचे भर दिया गया',
        reviewNote: 'यह सिर्फ़ ख़ाली जगहें भरता है, आपके टाइप किए को कभी नहीं बदलता — आगे बढ़ने से पहले सब जाँच लीजिए।',
      },
      invalid: {
        name: 'कम से कम पहला और आख़िरी नाम डालिए।',
        phone: '10 अंकों का भारतीय मोबाइल नंबर डालिए।',
      },
    },
  },

  mr: {
    captureContact: {
      title: 'तुम्ही कोणाला भेटलात',
      subtitle: 'या साइटमागचा बिल्डर किंवा मालक.',
      field: {
        name: 'पूर्ण नाव',
        phone: 'मोबाइल क्रमांक',
        phoneHint: 'तुम्ही टाइप करताच आम्ही हे AIEC च्या नोंदींशी जुळवतो.',
        company: 'कंपनी (असल्यास)',
        role: 'त्यांची भूमिका',
        note: 'कसा संपर्क झाला',
        noteHint: 'ऐच्छिक — त्यांनी सांगितलेली एखादी खास गोष्ट जी पुढच्या व्यक्तीला उपयोगी पडेल.',
      },
      role: {
        owner: 'मालक',
        contractor: 'कंत्राटदार',
        architect: 'आर्किटेक्ट',
        facilityManager: 'फॅसिलिटी मॅनेजर',
      },
      noPhone: {
        toggle: 'फोन क्रमांक दिला नाही',
        hint: 'ते भेटीसाठी तयार आहेत पण अजून क्रमांक द्यायचा नाही — ठीक आहे, फक्त नोंदवा आणि पुढे जा.',
      },
      consent: {
        label: 'लिफ्ट सेवांबद्दल संपर्क साधण्यास ते तयार आहेत',
        hint: 'फोन, SMS किंवा WhatsApp वरून पाठपुरावा करण्यासाठी हे आवश्यक आहे.',
        required: 'पुढे जाण्यापूर्वी हे टिक करणे आवश्यक आहे — हीच संमती प्रत्येक पाठपुरावा संदेश नियमानुसार ठेवते.',
      },
      phoneCheck: {
        checking: 'तपासत आहे…',
        clear: 'नवीन संपर्क — अजून काही नोंदलेले नाही.',
        duplicateLead: 'हा क्रमांक आधीच {{name}} नावाने लीड आहे. ही तीच साइट असू शकते.',
        existingCustomer: '{{name}} आधीच AIEC चा ग्राहक आहे. हा नवीन लीड नसून, पुन्हा प्रकल्प असू शकतो.',
      },
      businessCard: {
        heading: 'बिझनेस कार्ड स्कॅन करा',
        body: 'फोटो घ्या, आम्ही त्यातून नाव, कंपनी आणि क्रमांक वाचण्याचा प्रयत्न करू.',
        scanning: 'कार्ड वाचत आहे…',
        applied: 'खाली भरले',
        reviewNote: 'हे फक्त रिकाम्या जागा भरते, तुम्ही टाइप केलेले कधीच बदलत नाही — पुढे जाण्यापूर्वी सर्व तपासा.',
      },
      invalid: {
        name: 'किमान पहिले आणि आडनाव टाका.',
        phone: '१० अंकी भारतीय मोबाइल क्रमांक टाका.',
      },
    },
  },
};

export default translations;
