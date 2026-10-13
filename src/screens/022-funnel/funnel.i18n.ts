import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    funnel: {
      title: 'Sales funnel',
      subtitle: 'Where leads are right now, and where they stop moving.',
      loading: 'Building the funnel',
      breakdown: {
        label: 'Break down by',
        none: 'Whole business',
        surveyor: 'By surveyor',
        territory: 'By territory',
        source: 'By source',
      },
      biggestDrop: 'The biggest drop-off is moving into {{stage}} — start there.',
      avgDays: 'Average {{days}} days in this stage',
      smallSample: 'small sample',
      lostHeading: 'Why deals are lost',
      lostReason: {
        price: 'Price',
        timeline: 'Timeline',
        competitor: 'Competitor',
        siteNotReady: 'Site not ready',
        other: 'Other',
      },
      reopenedNote: 'A reopened negotiation shows at its current stage here — its full history, including the reopen, lives on the lead itself.',
      skipStageNote: 'A lead that skipped a stage (auto-quoted and closed the same day) is still counted correctly at every stage it actually passed through.',
      sheetTitle: 'Lost to {{reason}}',
      currentStateNote: 'This is a current-state view — one lead counts once, at its stage right now.',
      error: {
        title: 'Could not build the funnel',
        body: 'We could not reach the lead data. Check your connection and try again.',
      },
    },
  },

  hi: {
    funnel: {
      title: 'बिक्री फ़नल',
      subtitle: 'लीड अभी कहाँ हैं, और कहाँ आगे बढ़ना रुक जाता है।',
      loading: 'फ़नल बन रहा है',
      breakdown: {
        label: 'किस हिसाब से बाँटें',
        none: 'पूरा कारोबार',
        surveyor: 'सर्वेक्षक के हिसाब से',
        territory: 'इलाक़े के हिसाब से',
        source: 'स्रोत के हिसाब से',
      },
      biggestDrop: 'सबसे बड़ी गिरावट {{stage}} में जाते समय है — वहीं से शुरू कीजिए।',
      avgDays: 'इस चरण में औसतन {{days}} दिन',
      smallSample: 'छोटा नमूना',
      lostHeading: 'सौदे क्यों हाथ से जाते हैं',
      lostReason: {
        price: 'क़ीमत',
        timeline: 'समय-सीमा',
        competitor: 'प्रतिस्पर्धी',
        siteNotReady: 'साइट तैयार नहीं',
        other: 'अन्य',
      },
      reopenedNote: 'दोबारा खुली बातचीत यहाँ अपने मौजूदा चरण में दिखती है — दोबारा खुलने समेत उसका पूरा इतिहास ख़ुद लीड पर मौजूद है।',
      skipStageNote: 'जो लीड कोई चरण छोड़ गई (उसी दिन ऑटो-कोटेशन बनकर बंद हो गई), वह भी हर उस चरण में सही गिनी जाती है जिससे वह सचमुच गुज़री।',
      sheetTitle: '{{reason}} की वजह से गया',
      currentStateNote: 'यह मौजूदा स्थिति का दृश्य है — हर लीड एक बार गिनी जाती है, अभी जिस चरण में है वहीं।',
      error: {
        title: 'फ़नल नहीं बन पाया',
        body: 'हम लीड डेटा तक नहीं पहुँच पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
    },
  },

  mr: {
    funnel: {
      title: 'विक्री फनेल',
      subtitle: 'लीड सध्या कुठे आहेत, आणि कुठे पुढे जाणे थांबते.',
      loading: 'फनेल तयार होत आहे',
      breakdown: {
        label: 'कशानुसार विभागा',
        none: 'संपूर्ण व्यवसाय',
        surveyor: 'सर्वेक्षकानुसार',
        territory: 'भागानुसार',
        source: 'स्रोतानुसार',
      },
      biggestDrop: 'सर्वात मोठी घट {{stage}} मध्ये जाताना आहे — तिथूनच सुरुवात करा.',
      avgDays: 'या टप्प्यात सरासरी {{days}} दिवस',
      smallSample: 'लहान नमुना',
      lostHeading: 'व्यवहार का गमावले जातात',
      lostReason: {
        price: 'किंमत',
        timeline: 'वेळापत्रक',
        competitor: 'स्पर्धक',
        siteNotReady: 'साइट तयार नाही',
        other: 'इतर',
      },
      reopenedNote: 'पुन्हा उघडलेली वाटाघाट इथे तिच्या सध्याच्या टप्प्यावर दिसते — पुन्हा उघडण्यासह तिचा संपूर्ण इतिहास स्वतः लीडवर आहे.',
      skipStageNote: 'जो लीड एखादा टप्पा वगळून गेला (त्याच दिवशी ऑटो-कोटेशन होऊन बंद झाला), तोही तो प्रत्यक्षात ज्या-ज्या टप्प्यातून गेला त्या प्रत्येकात बरोबर मोजला जातो.',
      sheetTitle: '{{reason}} मुळे गमावले',
      currentStateNote: 'हे सध्याच्या स्थितीचे दृश्य आहे — प्रत्येक लीड एकदाच मोजला जातो, आत्ता आहे त्या टप्प्यावर.',
      error: {
        title: 'फनेल तयार होऊ शकला नाही',
        body: 'आम्ही लीड माहितीपर्यंत पोहोचू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
