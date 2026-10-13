import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    onbTechnician: {
      title: 'Join as a technician',
      subtitle: 'Four steps. What you can prove here decides which jobs you get offered.',
      step: {
        personal: 'Your details',
        skills: 'Skills & certificates',
        insurance: 'Insurance cover',
        sop: 'Safety agreement',
      },
      field: {
        fullName: 'Full name',
        phone: 'Mobile number',
        city: 'City',
        years: 'Years on the tools',
        yearsHint: 'Roughly how long you have been working on lifts.',
        expiry: 'Policy expires on',
        expiryHint: 'We remind you a month before this date so cover never lapses mid-job.',
      },
      skill: {
        heading: 'What can you work on?',
        body: 'Turn on everything you do, then add the certificate for it. Jobs are offered to you based on this list.',
        required: 'Turn on at least one skill to continue.',
        certificate: 'Certificate for this skill',
        unverifiedNote:
          'Without a certificate this skill counts as unverified, so jobs needing it will not be offered to you yet. You can add proof later.',
        manualReview: 'This certificate is not in English',
        manualReviewHint:
          'Tick this and an admin will read it themselves. It will not be rejected for being in another language.',
        name: {
          mechanical: 'Mechanical',
          electrical: 'Electrical',
          hydraulic: 'Hydraulic systems',
          mrl_gearless: 'MRL / gearless',
          safety_rescue: 'Safety & rescue',
        },
      },
      insurance: {
        heading: 'Your liability cover',
        body: 'AIEC orchestrates the work rather than employing you, so you carry your own accident and liability cover. We check it stays current.',
        doc: 'Insurance policy document',
        status: {
          missing: 'Not provided',
          expired: 'Expired',
          expiringSoon: 'Expiring soon',
          valid: 'Current',
        },
        expiredBlock:
          'This policy has already expired. Upload a current one — we cannot send you to a site without live cover.',
        inProgressNote:
          'If cover lapses while you are part-way through a job, you finish that job. It is new assignments that stop until you renew.',
      },
      sop: {
        heading: 'How we work on site',
        body: 'Read each one and tick it. These are the steps that keep you and the building safe, and they are checked on every job.',
        required: 'Tick every line to submit.',
        item: {
          lockout: 'I will isolate and lock off power before working in the shaft or pit.',
          ppe: 'I will wear a harness, helmet and safety shoes on every site, every time.',
          loadTest: 'I will not sign off a load or safety-gear test I have not personally run.',
          evidence: 'I will attach real photos as proof at every safety-critical step.',
          escalate: 'I will stop work and escalate rather than improvise around a problem.',
        },
      },
      invalid: {
        fullName: 'Please enter your full name as it appears on your certificates.',
        phone: 'Enter a 10-digit Indian mobile number.',
        expiryPast: 'That date has already passed. Upload a policy that is still running.',
      },
    },
  },

  hi: {
    onbTechnician: {
      title: 'तकनीशियन के रूप में जुड़िए',
      subtitle: 'चार चरण। यहाँ आप जो साबित कर पाते हैं, उसी से तय होता है कि कौन से काम आपको मिलेंगे।',
      step: {
        personal: 'आपकी जानकारी',
        skills: 'हुनर और प्रमाणपत्र',
        insurance: 'बीमा कवर',
        sop: 'सुरक्षा वचन',
      },
      field: {
        fullName: 'पूरा नाम',
        phone: 'मोबाइल नंबर',
        city: 'शहर',
        years: 'कितने साल का काम',
        yearsHint: 'लिफ़्ट के काम में आप लगभग कितने समय से हैं।',
        expiry: 'पॉलिसी की समाप्ति तिथि',
        expiryHint: 'हम इस तारीख़ से एक महीना पहले याद दिला देते हैं, ताकि काम के बीच कवर ख़त्म न हो।',
      },
      skill: {
        heading: 'आप किस पर काम कर सकते हैं?',
        body: 'जो-जो आप करते हैं, सब चालू कीजिए और उसका प्रमाणपत्र लगाइए। काम इसी सूची के आधार पर मिलते हैं।',
        required: 'आगे बढ़ने के लिए कम से कम एक हुनर चालू कीजिए।',
        certificate: 'इस हुनर का प्रमाणपत्र',
        unverifiedNote:
          'प्रमाणपत्र के बिना यह हुनर असत्यापित माना जाता है, इसलिए इससे जुड़े काम अभी आपको नहीं मिलेंगे। सबूत बाद में भी जोड़ सकते हैं।',
        manualReview: 'यह प्रमाणपत्र अंग्रेज़ी में नहीं है',
        manualReviewHint:
          'यह टिक कीजिए, एडमिन इसे ख़ुद पढ़ेगा। दूसरी भाषा में होने की वजह से यह अस्वीकार नहीं होगा।',
        name: {
          mechanical: 'मैकेनिकल',
          electrical: 'इलेक्ट्रिकल',
          hydraulic: 'हाइड्रोलिक सिस्टम',
          mrl_gearless: 'MRL / गियरलेस',
          safety_rescue: 'सुरक्षा और बचाव',
        },
      },
      insurance: {
        heading: 'आपका देयता बीमा',
        body: 'AIEC आपको नौकरी पर नहीं रखता, काम का संचालन करता है — इसलिए दुर्घटना और देयता बीमा आपका अपना होता है। हम बस देखते रहते हैं कि वह चालू है।',
        doc: 'बीमा पॉलिसी दस्तावेज़',
        status: {
          missing: 'दिया नहीं गया',
          expired: 'समाप्त',
          expiringSoon: 'जल्द समाप्त',
          valid: 'चालू',
        },
        expiredBlock:
          'यह पॉलिसी समाप्त हो चुकी है। चालू पॉलिसी अपलोड कीजिए — बिना जीवित कवर के हम आपको साइट पर नहीं भेज सकते।',
        inProgressNote:
          'अगर काम के बीच कवर ख़त्म हो जाए, तो वह काम आप पूरा करेंगे। रुकते सिर्फ़ नए काम हैं, जब तक आप नवीनीकरण नहीं कराते।',
      },
      sop: {
        heading: 'साइट पर हम कैसे काम करते हैं',
        body: 'हर बात पढ़कर टिक कीजिए। यही वे कदम हैं जो आपको और इमारत को सुरक्षित रखते हैं, और हर काम में इनकी जाँच होती है।',
        required: 'भेजने के लिए हर पंक्ति टिक कीजिए।',
        item: {
          lockout: 'शाफ़्ट या पिट में काम से पहले मैं बिजली अलग करके लॉक कर दूँगा।',
          ppe: 'हर साइट पर, हर बार, मैं हार्नेस, हेलमेट और सुरक्षा जूते पहनूँगा।',
          loadTest: 'जो लोड या सुरक्षा-गियर टेस्ट मैंने ख़ुद नहीं किया, उस पर मैं हस्ताक्षर नहीं करूँगा।',
          evidence: 'हर सुरक्षा-चरण पर मैं सबूत के तौर पर असली फ़ोटो लगाऊँगा।',
          escalate: 'समस्या पर जुगाड़ करने के बजाय मैं काम रोककर आगे रिपोर्ट करूँगा।',
        },
      },
      invalid: {
        fullName: 'अपना पूरा नाम वैसे ही लिखिए जैसे प्रमाणपत्रों पर है।',
        phone: '10 अंकों का भारतीय मोबाइल नंबर डालिए।',
        expiryPast: 'यह तारीख़ बीत चुकी है। ऐसी पॉलिसी अपलोड कीजिए जो अभी चालू हो।',
      },
    },
  },

  mr: {
    onbTechnician: {
      title: 'तंत्रज्ञ म्हणून सामील व्हा',
      subtitle: 'चार टप्पे. इथे तुम्ही जे सिद्ध करू शकता, त्यावरच कोणती कामे मिळतील हे ठरते.',
      step: {
        personal: 'तुमची माहिती',
        skills: 'कौशल्ये आणि प्रमाणपत्रे',
        insurance: 'विमा संरक्षण',
        sop: 'सुरक्षा वचन',
      },
      field: {
        fullName: 'पूर्ण नाव',
        phone: 'मोबाइल क्रमांक',
        city: 'शहर',
        years: 'किती वर्षांचा अनुभव',
        yearsHint: 'लिफ्टच्या कामात तुम्ही साधारण किती काळापासून आहात.',
        expiry: 'पॉलिसी संपण्याची तारीख',
        expiryHint: 'या तारखेच्या महिनाभर आधी आम्ही आठवण करून देतो, म्हणजे कामाच्या मध्ये संरक्षण संपत नाही.',
      },
      skill: {
        heading: 'तुम्ही कशावर काम करू शकता?',
        body: 'तुम्ही जे जे करता ते सर्व चालू करा आणि त्याचे प्रमाणपत्र जोडा. कामे याच यादीवरून दिली जातात.',
        required: 'पुढे जाण्यासाठी किमान एक कौशल्य चालू करा.',
        certificate: 'या कौशल्याचे प्रमाणपत्र',
        unverifiedNote:
          'प्रमाणपत्राशिवाय हे कौशल्य अपडताळलेले मानले जाते, त्यामुळे त्याची कामे तुम्हाला अजून मिळणार नाहीत. पुरावा नंतरही जोडता येईल.',
        manualReview: 'हे प्रमाणपत्र इंग्रजीत नाही',
        manualReviewHint:
          'हे टिक करा, प्रशासक ते स्वतः वाचेल. दुसऱ्या भाषेत असल्यामुळे ते नाकारले जाणार नाही.',
        name: {
          mechanical: 'यांत्रिक',
          electrical: 'विद्युत',
          hydraulic: 'हायड्रॉलिक यंत्रणा',
          mrl_gearless: 'MRL / गिअरलेस',
          safety_rescue: 'सुरक्षा आणि बचाव',
        },
      },
      insurance: {
        heading: 'तुमचे दायित्व संरक्षण',
        body: 'AIEC तुम्हाला नोकरीवर ठेवत नाही, कामाचे संचालन करते — त्यामुळे अपघात आणि दायित्व विमा तुमचा स्वतःचा असतो. तो चालू आहे एवढेच आम्ही पाहतो.',
        doc: 'विमा पॉलिसीचे कागदपत्र',
        status: {
          missing: 'दिलेले नाही',
          expired: 'संपलेले',
          expiringSoon: 'लवकरच संपणार',
          valid: 'चालू',
        },
        expiredBlock:
          'ही पॉलिसी संपलेली आहे. चालू पॉलिसी अपलोड करा — जिवंत संरक्षणाशिवाय आम्ही तुम्हाला साइटवर पाठवू शकत नाही.',
        inProgressNote:
          'कामाच्या मध्ये संरक्षण संपले, तर ते काम तुम्ही पूर्ण कराल. थांबतात ती फक्त नवीन कामे, जोपर्यंत तुम्ही नूतनीकरण करत नाही.',
      },
      sop: {
        heading: 'साइटवर आम्ही कसे काम करतो',
        body: 'प्रत्येक ओळ वाचून टिक करा. हेच ते टप्पे आहेत जे तुम्हाला आणि इमारतीला सुरक्षित ठेवतात, आणि प्रत्येक कामात ते तपासले जातात.',
        required: 'पाठवण्यासाठी प्रत्येक ओळ टिक करा.',
        item: {
          lockout: 'शाफ्ट किंवा पिटमध्ये काम करण्यापूर्वी मी वीज वेगळी करून लॉक करेन.',
          ppe: 'प्रत्येक साइटवर, प्रत्येक वेळी, मी हार्नेस, हेल्मेट आणि सुरक्षा बूट घालेन.',
          loadTest: 'जी लोड किंवा सुरक्षा-गिअर चाचणी मी स्वतः केली नाही, तिच्यावर मी सही करणार नाही.',
          evidence: 'प्रत्येक सुरक्षा-टप्प्यावर मी पुरावा म्हणून खरे फोटो जोडेन.',
          escalate: 'अडचणीवर जुगाड करण्याऐवजी मी काम थांबवून वर कळवेन.',
        },
      },
      invalid: {
        fullName: 'प्रमाणपत्रांवर आहे तसेच तुमचे पूर्ण नाव लिहा.',
        phone: '१० अंकी भारतीय मोबाइल क्रमांक टाका.',
        expiryPast: 'ही तारीख उलटून गेली आहे. सध्या चालू असलेली पॉलिसी अपलोड करा.',
      },
    },
  },
};

export default translations;
