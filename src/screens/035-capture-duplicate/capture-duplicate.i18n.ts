import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    captureDuplicate: {
      title: 'One quick check',
      subtitle: 'Making sure this is not already captured.',
      checking: 'Checking nearby leads…',
      clear: {
        title: 'No matches nearby',
        body: 'Nothing already on file close to this location or these details. You are clear to continue.',
      },
      radiusExplainer: 'We compare this site against every lead within {{radius}} m, or with a matching phone number or site name — dense areas may use a tighter radius than open ones.',
      reason: {
        proximity: 'This is only {{distance}} m from an existing lead.',
        phone: 'This exact phone number is already on a lead.',
        name: 'A lead with a very similar site name already exists.',
      },
      compare: {
        heading: 'Compare',
        existing: 'Already on file',
        new: 'What you just captured',
        capturedBy: 'Captured by {{name}}',
        capturedOn: 'On {{date}}',
        distance: 'Distance',
      },
      ownLead: {
        banner: 'This looks like your own earlier lead.',
        updateAction: 'Update that lead instead',
      },
      decision: {
        isDuplicate: 'Yes, this is the same site — cancel my capture',
        isDifferent: 'No, this is genuinely different — continue',
        isDifferentHint: 'If you are confident this is a separate, real site, you can proceed. It will be flagged for a quick admin check, but you are not blocked.',
      },
      confirmCancel: {
        title: 'Cancel this capture?',
        body: 'Your photos and location for this attempt will be discarded. The existing lead is unaffected either way.',
        confirm: 'Yes, cancel',
        back: 'No, go back',
      },
      flaggedNote: 'Proceeding here does not slow you down — it just adds a light admin review, so your commission stays protected either way.',
      error: {
        title: 'Could not run the check',
        body: 'We could not compare this against existing leads. Check your connection and try again.',
      },
    },
  },

  hi: {
    captureDuplicate: {
      title: 'एक छोटी जाँच',
      subtitle: 'पक्का कर रहे हैं कि यह पहले से दर्ज तो नहीं।',
      checking: 'आस-पास के लीड जाँचे जा रहे हैं…',
      clear: {
        title: 'आस-पास कोई मेल नहीं',
        body: 'इस जगह या इन जानकारियों के पास पहले से कुछ दर्ज नहीं है। आप आगे बढ़ सकते हैं।',
      },
      radiusExplainer: 'हम इस साइट को {{radius}} मीटर के भीतर हर लीड से, या मेल खाते फ़ोन नंबर या साइट नाम से मिलाते हैं — घने इलाक़ों में दायरा खुले इलाक़ों से छोटा हो सकता है।',
      reason: {
        proximity: 'यह किसी मौजूदा लीड से सिर्फ़ {{distance}} मीटर दूर है।',
        phone: 'यह फ़ोन नंबर पहले से किसी लीड पर दर्ज है।',
        name: 'बहुत मिलता-जुलता साइट नाम वाला लीड पहले से मौजूद है।',
      },
      compare: {
        heading: 'तुलना',
        existing: 'पहले से दर्ज',
        new: 'अभी जो दर्ज किया',
        capturedBy: '{{name}} ने दर्ज किया',
        capturedOn: '{{date}} को',
        distance: 'दूरी',
      },
      ownLead: {
        banner: 'यह आपका अपना पुराना लीड लगता है।',
        updateAction: 'इसके बजाय वह लीड अपडेट करें',
      },
      decision: {
        isDuplicate: 'हाँ, यह वही साइट है — मेरा कैप्चर रद्द करें',
        isDifferent: 'नहीं, यह सचमुच अलग है — आगे बढ़ें',
        isDifferentHint: 'अगर आपको यक़ीन है कि यह अलग, असली साइट है, तो आगे बढ़ सकते हैं। इसे जल्दी एडमिन जाँच के लिए चिह्नित किया जाएगा, पर आप रुकते नहीं।',
      },
      confirmCancel: {
        title: 'यह कैप्चर रद्द करें?',
        body: 'इस कोशिश की आपकी फ़ोटो और लोकेशन मिटा दी जाएँगी। मौजूदा लीड पर कोई असर नहीं पड़ेगा।',
        confirm: 'हाँ, रद्द करें',
        back: 'नहीं, वापस जाएँ',
      },
      flaggedNote: 'यहाँ आगे बढ़ने से आप रुकते नहीं — बस एक हल्की एडमिन जाँच जुड़ जाती है, ताकि आपका कमीशन दोनों तरह से सुरक्षित रहे।',
      error: {
        title: 'जाँच नहीं हो पाई',
        body: 'हम इसे मौजूदा लीड से मिला नहीं पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
    },
  },

  mr: {
    captureDuplicate: {
      title: 'एक छोटी तपासणी',
      subtitle: 'हे आधीच नोंदलेले नाही याची खात्री करत आहोत.',
      checking: 'जवळचे लीड तपासत आहे…',
      clear: {
        title: 'जवळपास कोणतीही जुळणी नाही',
        body: 'या ठिकाणी किंवा या माहितीजवळ आधीच काहीही नोंदलेले नाही. तुम्ही पुढे जाऊ शकता.',
      },
      radiusExplainer: 'आम्ही ही साइट {{radius}} मीटरच्या आत असलेल्या प्रत्येक लीडशी, किंवा जुळणारा फोन क्रमांक किंवा साइट नावाशी ताडून पाहतो — दाट भागांत त्रिज्या मोकळ्या भागांपेक्षा लहान असू शकते.',
      reason: {
        proximity: 'हे एका सध्याच्या लीडपासून फक्त {{distance}} मीटर दूर आहे.',
        phone: 'हा फोन क्रमांक आधीच एका लीडवर नोंदलेला आहे.',
        name: 'खूप मिळताजुळता साइट नाव असलेला लीड आधीच अस्तित्वात आहे.',
      },
      compare: {
        heading: 'तुलना',
        existing: 'आधीच नोंदलेले',
        new: 'आत्ता जे नोंदवले',
        capturedBy: '{{name}} ने नोंदवले',
        capturedOn: '{{date}} रोजी',
        distance: 'अंतर',
      },
      ownLead: {
        banner: 'हा तुमचाच आधीचा लीड वाटतो.',
        updateAction: 'त्याऐवजी तो लीड अद्ययावत करा',
      },
      decision: {
        isDuplicate: 'होय, ही तीच साइट आहे — माझी नोंद रद्द करा',
        isDifferent: 'नाही, ही खरोखर वेगळी आहे — पुढे जा',
        isDifferentHint: 'ही वेगळी, खरी साइट आहे याची खात्री असेल, तर तुम्ही पुढे जाऊ शकता. ती जलद प्रशासक तपासणीसाठी चिन्हांकित होईल, पण तुम्ही अडत नाही.',
      },
      confirmCancel: {
        title: 'ही नोंद रद्द करायची?',
        body: 'या प्रयत्नाचे फोटो आणि ठिकाण काढून टाकले जातील. सध्याच्या लीडवर कोणताही परिणाम होणार नाही.',
        confirm: 'होय, रद्द करा',
        back: 'नाही, मागे जा',
      },
      flaggedNote: 'इथे पुढे गेल्याने तुम्ही अडत नाही — फक्त एक हलकी प्रशासक तपासणी जोडली जाते, म्हणजे तुमचे कमिशन दोन्ही प्रकारे सुरक्षित राहते.',
      error: {
        title: 'तपासणी होऊ शकली नाही',
        body: 'आम्ही हे सध्याच्या लीडशी ताडून पाहू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
