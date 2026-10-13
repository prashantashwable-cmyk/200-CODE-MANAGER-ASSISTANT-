import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    siteVisitVerify: {
      title: 'Site visit checks',
      subtitle: 'Only the ones that need a human. Everything clean clears itself.',
      loading: 'Loading submissions',
      miniMapLabel: 'Where the photo was actually taken',
      filter: { needsReview: 'Needs you', autoCleared: 'Cleared itself', all: 'Everything' },
      autoCleared: 'Cleared automatically',
      autoClearedNote:
        'A visit clears on its own when the GPS, photo count, timestamps and time on site all line up. You only see the rest.',
      bulkApprove: 'Approve all {{count}} clean visits',
      bulkApproved: 'Clean visits approved',
      approve: 'Approve',
      flag: 'Flag',
      reject: 'Reject',
      confidence: 'Confidence this was taken on site',
      verdict: { clean: 'Clean', borderline: 'Worth a look', mismatch: 'Does not match' },
      reason: {
        largeDrift: 'Photo taken {{drift}} m from the recorded site.',
        poorAccuracy:
          'The phone itself only claimed ±{{accuracy}} m accuracy, so this gap is within its own margin of error — likely a tall-building signal problem, not a false claim.',
        tooFewPhotos: 'Only {{photos}} photos — fewer than a real survey usually produces.',
        timestampsInvalid: 'Photo timestamps are missing or inconsistent.',
        tooBrief: 'Only {{minutes}} minutes on site.',
        largeSiteOverride:
          'This site is registered as a large one, so a wider radius was allowed before flagging.',
      },
      field: {
        drift: 'Distance off',
        accuracy: 'GPS accuracy',
        photos: 'Photos',
        dwell: 'On site',
        surveyor: 'Surveyor',
        checkedIn: 'Checked in',
      },
      photoPlaceholder: 'Site photo',
      exifNote:
        'Photo metadata was missing, so the app’s own location log was used instead. Some sharing apps strip it — that alone is not suspicious.',
      surveyorTold: 'The surveyor has been told exactly what was wrong.',
      empty: {
        title: 'Nothing waiting on you',
        body: 'Every submission has either cleared automatically or already been decided. New visits will land here.',
      },
      error: {
        title: 'Could not load submissions',
        body: 'We could not reach the verification queue. Check your connection and try again.',
      },
    },
  },

  hi: {
    siteVisitVerify: {
      title: 'साइट विज़िट जाँच',
      subtitle: 'सिर्फ़ वही जिनमें इंसान चाहिए। साफ़-सुथरी सब अपने आप निपट जाती हैं।',
      loading: 'सबमिशन लोड हो रहे हैं',
      miniMapLabel: 'फ़ोटो असल में कहाँ ली गई',
      filter: { needsReview: 'आपकी ज़रूरत', autoCleared: 'अपने आप निपटी', all: 'सब कुछ' },
      autoCleared: 'अपने आप मंज़ूर',
      autoClearedNote:
        'जब GPS, फ़ोटो की गिनती, समय-मुहर और साइट पर बिताया समय — सब मेल खाते हैं, तो विज़िट अपने आप निपट जाती है। आपको बाक़ी ही दिखती हैं।',
      bulkApprove: 'सभी {{count}} साफ़ विज़िट मंज़ूर करें',
      bulkApproved: 'साफ़ विज़िट मंज़ूर हो गईं',
      approve: 'मंज़ूर',
      flag: 'निशान लगाएँ',
      reject: 'अस्वीकार',
      confidence: 'यह साइट पर ही ली गई, इसका भरोसा',
      verdict: { clean: 'साफ़', borderline: 'देखने लायक', mismatch: 'मेल नहीं खाता' },
      reason: {
        largeDrift: 'फ़ोटो दर्ज साइट से {{drift}} मीटर दूर ली गई।',
        poorAccuracy:
          'फ़ोन ने ख़ुद सिर्फ़ ±{{accuracy}} मीटर सटीकता बताई थी, यानी यह फ़ासला उसकी अपनी त्रुटि-सीमा के भीतर है — शायद ऊँची इमारतों की सिग्नल दिक़्क़त, झूठा दावा नहीं।',
        tooFewPhotos: 'सिर्फ़ {{photos}} फ़ोटो — असली सर्वे में आमतौर पर इससे ज़्यादा होती हैं।',
        timestampsInvalid: 'फ़ोटो की समय-मुहर ग़ायब है या मेल नहीं खाती।',
        tooBrief: 'साइट पर सिर्फ़ {{minutes}} मिनट।',
        largeSiteOverride:
          'यह साइट बड़ी के रूप में दर्ज है, इसलिए निशान लगाने से पहले ज़्यादा बड़ा दायरा मान्य किया गया।',
      },
      field: {
        drift: 'कितनी दूर',
        accuracy: 'GPS सटीकता',
        photos: 'फ़ोटो',
        dwell: 'साइट पर',
        surveyor: 'सर्वेक्षक',
        checkedIn: 'चेक-इन',
      },
      photoPlaceholder: 'साइट फ़ोटो',
      exifNote:
        'फ़ोटो का मेटाडेटा नहीं मिला, इसलिए ऐप का अपना लोकेशन रिकॉर्ड इस्तेमाल हुआ। कुछ शेयरिंग ऐप इसे हटा देते हैं — सिर्फ़ इससे शक नहीं करना चाहिए।',
      surveyorTold: 'सर्वेक्षक को ठीक-ठीक बता दिया गया है कि क्या ग़लत था।',
      empty: {
        title: 'आपके लिए कुछ बाक़ी नहीं',
        body: 'हर सबमिशन या तो अपने आप निपट गया या उस पर फ़ैसला हो चुका है। नई विज़िट यहीं आएँगी।',
      },
      error: {
        title: 'सबमिशन लोड नहीं हो पाए',
        body: 'हम जाँच-क़तार तक नहीं पहुँच पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
    },
  },

  mr: {
    siteVisitVerify: {
      title: 'साइट भेट तपासणी',
      subtitle: 'फक्त ज्यांना माणूस लागतो त्याच. स्वच्छ असलेल्या आपोआप निकाली निघतात.',
      loading: 'नोंदी लोड होत आहेत',
      miniMapLabel: 'फोटो प्रत्यक्षात कुठे काढला',
      filter: { needsReview: 'तुमची गरज', autoCleared: 'आपोआप निकाली', all: 'सर्व काही' },
      autoCleared: 'आपोआप मंजूर',
      autoClearedNote:
        'GPS, फोटोंची संख्या, वेळेच्या नोंदी आणि साइटवरचा वेळ — सर्व जुळले की भेट आपोआप निकाली निघते. तुम्हाला उरलेल्याच दिसतात.',
      bulkApprove: 'सर्व {{count}} स्वच्छ भेटी मंजूर करा',
      bulkApproved: 'स्वच्छ भेटी मंजूर झाल्या',
      approve: 'मंजूर',
      flag: 'खूण करा',
      reject: 'नाकारा',
      confidence: 'ही साइटवरच घेतली याचा विश्वास',
      verdict: { clean: 'स्वच्छ', borderline: 'पाहण्यासारखे', mismatch: 'जुळत नाही' },
      reason: {
        largeDrift: 'फोटो नोंदलेल्या साइटपासून {{drift}} मीटर दूर काढला.',
        poorAccuracy:
          'फोननेच फक्त ±{{accuracy}} मीटर अचूकता सांगितली होती, म्हणजे हे अंतर त्याच्या स्वतःच्या चुकीच्या मर्यादेतच आहे — बहुधा उंच इमारतींची सिग्नल अडचण, खोटा दावा नाही.',
        tooFewPhotos: 'फक्त {{photos}} फोटो — खऱ्या सर्वेक्षणात सहसा यापेक्षा जास्त असतात.',
        timestampsInvalid: 'फोटोंच्या वेळेच्या नोंदी नाहीत किंवा जुळत नाहीत.',
        tooBrief: 'साइटवर फक्त {{minutes}} मिनिटे.',
        largeSiteOverride:
          'ही साइट मोठी म्हणून नोंदलेली आहे, त्यामुळे खूण करण्यापूर्वी अधिक मोठी त्रिज्या ग्राह्य धरली.',
      },
      field: {
        drift: 'किती दूर',
        accuracy: 'GPS अचूकता',
        photos: 'फोटो',
        dwell: 'साइटवर',
        surveyor: 'सर्वेक्षक',
        checkedIn: 'चेक-इन',
      },
      photoPlaceholder: 'साइट फोटो',
      exifNote:
        'फोटोचा मेटाडेटा मिळाला नाही, म्हणून ॲपची स्वतःची स्थान नोंद वापरली. काही शेअरिंग ॲप्स तो काढून टाकतात — एवढ्यावरून संशय घेऊ नये.',
      surveyorTold: 'सर्वेक्षकाला नेमके काय चुकले ते सांगितले आहे.',
      empty: {
        title: 'तुमच्यासाठी काही बाकी नाही',
        body: 'प्रत्येक नोंद एकतर आपोआप निकाली निघाली आहे किंवा तिच्यावर निर्णय झाला आहे. नवीन भेटी इथेच येतील.',
      },
      error: {
        title: 'नोंदी लोड होऊ शकल्या नाहीत',
        body: 'आम्ही तपासणी रांगेपर्यंत पोहोचू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
