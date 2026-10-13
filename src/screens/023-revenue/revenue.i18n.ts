import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    revenue: {
      title: 'Revenue & profit',
      subtitle: 'What was booked, what actually landed, and what it cost.',
      loading: 'Loading the numbers',
      period: { '7': '7 days', '30': '30 days', '90': '90 days' },
      card: {
        booked: 'Revenue booked',
        collected: 'Revenue collected',
        cogs: 'Supplier cost',
        margin: 'Gross margin',
      },
      marginTrend: 'Margin over time',
      targetBand: 'The shaded band is the target range: {{low}}%–{{high}}%.',
      byRegion: 'By region',
      wonVsLost: 'Won vs lost',
      won: 'Deals won',
      lost: 'Deals lost',
      avgDeal: 'Average deal size',
      smallSample: 'small sample',
      bookedVsCollectedNote:
        'Booked counts the moment a contract is signed. Collected counts only what has actually cleared through the payment stages — the gap between them is money still owed, not money lost.',
      liveSourceNote:
        'Every figure here reads from the same deal and payment records as the Quotation and Payment modules — nothing is a separate manual estimate.',
      export: 'Export',
      exported: 'Report downloaded',
      column: { region: 'Region', booked: 'Booked', collected: 'Collected', margin: 'Margin', deals: 'Deals' },
      error: {
        title: 'Could not load revenue',
        body: 'We could not reach the financial data. Check your connection and try again.',
      },
    },
  },

  hi: {
    revenue: {
      title: 'राजस्व और मुनाफ़ा',
      subtitle: 'क्या बुक हुआ, असल में क्या आया, और उसकी लागत क्या रही।',
      loading: 'आँकड़े लोड हो रहे हैं',
      period: { '7': '7 दिन', '30': '30 दिन', '90': '90 दिन' },
      card: {
        booked: 'बुक हुआ राजस्व',
        collected: 'मिला राजस्व',
        cogs: 'आपूर्तिकर्ता लागत',
        margin: 'सकल मार्जिन',
      },
      marginTrend: 'समय के साथ मार्जिन',
      targetBand: 'रंगीन पट्टी लक्ष्य दायरा है: {{low}}%–{{high}}%।',
      byRegion: 'इलाक़े के हिसाब से',
      wonVsLost: 'जीते बनाम हारे',
      won: 'जीते सौदे',
      lost: 'हारे सौदे',
      avgDeal: 'औसत सौदा आकार',
      smallSample: 'छोटा नमूना',
      bookedVsCollectedNote:
        'बुक होना अनुबंध पर हस्ताक्षर होते ही गिना जाता है। मिलना सिर्फ़ वही गिना जाता है जो भुगतान चरणों से सचमुच निकल चुका है — दोनों का अंतर बकाया पैसा है, खोया हुआ नहीं।',
      liveSourceNote:
        'यहाँ हर आँकड़ा उन्हीं सौदे और भुगतान रिकॉर्ड से आता है जो कोटेशन और भुगतान मॉड्यूल इस्तेमाल करते हैं — कुछ भी अलग से अंदाज़ा नहीं लगाया गया।',
      export: 'एक्सपोर्ट',
      exported: 'रिपोर्ट डाउनलोड हो गई',
      column: { region: 'इलाक़ा', booked: 'बुक हुआ', collected: 'मिला', margin: 'मार्जिन', deals: 'सौदे' },
      error: {
        title: 'राजस्व लोड नहीं हो पाया',
        body: 'हम वित्तीय डेटा तक नहीं पहुँच पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
    },
  },

  mr: {
    revenue: {
      title: 'महसूल आणि नफा',
      subtitle: 'काय नोंदले गेले, प्रत्यक्षात काय मिळाले, आणि त्याची किंमत काय होती.',
      loading: 'आकडे लोड होत आहेत',
      period: { '7': '7 दिवस', '30': '30 दिवस', '90': '90 दिवस' },
      card: {
        booked: 'नोंदलेला महसूल',
        collected: 'मिळालेला महसूल',
        cogs: 'पुरवठादार खर्च',
        margin: 'एकूण नफा',
      },
      marginTrend: 'काळानुसार नफा',
      targetBand: 'रंगीत पट्टी लक्ष्य श्रेणी आहे: {{low}}%–{{high}}%.',
      byRegion: 'भागानुसार',
      wonVsLost: 'जिंकलेले विरुद्ध गमावलेले',
      won: 'जिंकलेले व्यवहार',
      lost: 'गमावलेले व्यवहार',
      avgDeal: 'सरासरी व्यवहार आकार',
      smallSample: 'लहान नमुना',
      bookedVsCollectedNote:
        'करारावर सही होताच नोंद होते. मिळाले फक्त तेच मोजले जाते जे पैसे टप्प्यांतून प्रत्यक्षात निघाले — दोघांमधील फरक थकीत पैसे आहेत, गमावलेले नाहीत.',
      liveSourceNote:
        'इथला प्रत्येक आकडा कोटेशन आणि पेमेंट विभाग वापरतात त्याच व्यवहार आणि पेमेंट नोंदींमधून येतो — काहीही वेगळे अंदाजे नाही.',
      export: 'एक्सपोर्ट',
      exported: 'अहवाल डाउनलोड झाला',
      column: { region: 'भाग', booked: 'नोंदले', collected: 'मिळाले', margin: 'नफा', deals: 'व्यवहार' },
      error: {
        title: 'महसूल लोड होऊ शकला नाही',
        body: 'आम्ही आर्थिक माहितीपर्यंत पोहोचू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
