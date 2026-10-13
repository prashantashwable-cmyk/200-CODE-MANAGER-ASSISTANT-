import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    captureConfirm: {
      title: 'Ready to submit',
      subtitle: 'One last look before this goes in.',
      summary: {
        heading: 'What you captured',
        location: 'Site',
        photos: '{{count}} photos',
        contact: 'Contact',
        building: 'Building',
        edit: 'Edit',
        flaggedNote: 'This will be submitted flagged for a quick admin review, as you chose on the duplicate check.',
      },
      incentive: {
        heading: 'What this could earn you',
        base: 'For capturing this lead',
        baseNote: 'Paid the moment this is accepted.',
        conversion: 'If this converts to a sale',
        conversionNote: '1.5% of the estimated deal value, minimum ₹5,000.',
        estimateNote: 'Both figures are estimates. The final payout is confirmed once the deal actually closes — see it any time in My Earnings.',
      },
      submit: 'Submit lead',
      submitting: 'Submitting…',
      offlineQueued: {
        title: 'No signal — queued to send',
        body: 'Everything is saved on this device and will submit the moment you are back online. No need to stay on this screen.',
      },
      success: {
        title: 'Lead submitted',
        body: 'This is now in the pipeline. Follow-up starts automatically.',
        code: 'AIEC code {{code}}',
        captureAnother: 'Capture another lead',
        backHome: 'Back to home',
        milestone: {
          captured: 'Captured',
          locked: 'Locked as evidence',
          pipeline: 'In the pipeline',
        },
      },
      error: {
        title: 'Could not submit',
        body: 'Nothing has been lost — everything you captured is still saved on this device.',
        retry: 'Try again',
      },
    },
  },

  hi: {
    captureConfirm: {
      title: 'भेजने के लिए तैयार',
      subtitle: 'भेजने से पहले आख़िरी नज़र।',
      summary: {
        heading: 'आपने क्या दर्ज किया',
        location: 'साइट',
        photos: '{{count}} फ़ोटो',
        contact: 'संपर्क',
        building: 'इमारत',
        edit: 'बदलें',
        flaggedNote: 'यह उसी तरह चिह्नित होकर भेजा जाएगा जैसा आपने डुप्लिकेट जाँच में चुना — जल्दी एडमिन समीक्षा के लिए।',
      },
      incentive: {
        heading: 'इससे आप क्या कमा सकते हैं',
        base: 'यह लीड दर्ज करने के लिए',
        baseNote: 'स्वीकार होते ही मिल जाता है।',
        conversion: 'अगर यह बिक्री में बदलता है',
        conversionNote: 'अनुमानित सौदा मूल्य का 1.5%, कम से कम ₹5,000।',
        estimateNote: 'दोनों आँकड़े अनुमान हैं। असली भुगतान सौदा पक्का होने पर तय होता है — इसे कभी भी मेरी कमाई में देख सकते हैं।',
      },
      submit: 'लीड भेजें',
      submitting: 'भेजा जा रहा है…',
      offlineQueued: {
        title: 'सिग्नल नहीं — भेजने के लिए क़तार में',
        body: 'सब कुछ इस डिवाइस पर सहेज लिया गया है और नेटवर्क वापस आते ही भेज दिया जाएगा। इस स्क्रीन पर रुकने की ज़रूरत नहीं।',
      },
      success: {
        title: 'लीड भेज दिया गया',
        body: 'यह अब पाइपलाइन में है। फ़ॉलो-अप अपने आप शुरू होता है।',
        code: 'AIEC कोड {{code}}',
        captureAnother: 'एक और लीड दर्ज करें',
        backHome: 'होम पर वापस',
        milestone: {
          captured: 'दर्ज हुआ',
          locked: 'सबूत के रूप में लॉक',
          pipeline: 'पाइपलाइन में',
        },
      },
      error: {
        title: 'भेजा नहीं जा सका',
        body: 'कुछ भी खोया नहीं — जो भी दर्ज किया वह अब भी इस डिवाइस पर सहेजा है।',
        retry: 'दोबारा कोशिश करें',
      },
    },
  },

  mr: {
    captureConfirm: {
      title: 'पाठवण्यासाठी तयार',
      subtitle: 'पाठवण्यापूर्वी शेवटचा दृष्टिक्षेप.',
      summary: {
        heading: 'तुम्ही काय नोंदवले',
        location: 'साइट',
        photos: '{{count}} फोटो',
        contact: 'संपर्क',
        building: 'इमारत',
        edit: 'बदला',
        flaggedNote: 'हे तुम्ही डुप्लिकेट तपासणीत निवडले तसेच चिन्हांकित होऊन पाठवले जाईल — जलद प्रशासक आढाव्यासाठी.',
      },
      incentive: {
        heading: 'यातून तुम्ही काय कमवू शकता',
        base: 'हा लीड नोंदवण्यासाठी',
        baseNote: 'स्वीकारताच मिळते.',
        conversion: 'हे विक्रीत बदलल्यास',
        conversionNote: 'अंदाजित व्यवहार मूल्याच्या 1.5%, किमान ₹5,000.',
        estimateNote: 'दोन्ही आकडे अंदाज आहेत. व्यवहार प्रत्यक्ष पूर्ण झाल्यावर अंतिम पैसे निश्चित होतात — हे तुम्ही केव्हाही माझी कमाई मध्ये पाहू शकता.',
      },
      submit: 'लीड पाठवा',
      submitting: 'पाठवत आहे…',
      offlineQueued: {
        title: 'सिग्नल नाही — पाठवण्यासाठी रांगेत',
        body: 'सर्व काही या डिव्हाइसवर जतन झाले आहे आणि नेटवर्क परत येताच पाठवले जाईल. या स्क्रीनवर थांबण्याची गरज नाही.',
      },
      success: {
        title: 'लीड पाठवला',
        body: 'हा आता पाइपलाइनमध्ये आहे. पाठपुरावा आपोआप सुरू होतो.',
        code: 'AIEC कोड {{code}}',
        captureAnother: 'आणखी एक लीड नोंदवा',
        backHome: 'होमवर परत',
        milestone: {
          captured: 'नोंदवले',
          locked: 'पुरावा म्हणून लॉक',
          pipeline: 'पाइपलाइनमध्ये',
        },
      },
      error: {
        title: 'पाठवता आले नाही',
        body: 'काहीही हरवलेले नाही — जे नोंदवले ते अजूनही या डिव्हाइसवर जतन आहे.',
        retry: 'पुन्हा प्रयत्न करा',
      },
    },
  },
};

export default translations;
