import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    leadSourceAttribution: {
      title: 'Source & campaign attribution',
      subtitle: 'Where to invest the next unit of acquisition effort.',
      loading: 'Loading attribution',
      error: { title: 'Could not load attribution', body: 'Check your connection and try again.' },
      empty: { title: 'No leads yet', body: 'Source data appears once leads start coming in.' },
      leadCount: 'Leads',
      conversionRate: 'Conversion',
      avgDealValue: 'Avg deal value',
      costPerConversion: 'Cost per conversion',
      noCost: 'No direct cost',
      lowSampleLabel: 'Low sample',
      trendHeading: 'Weekly volume',
      immutableNote: 'Source is set once at capture and never changes afterward, however far a lead travels through the pipeline — these figures stay historically accurate.',
    },
  },

  hi: {
    leadSourceAttribution: {
      title: 'स्रोत और कैंपेन एट्रिब्यूशन',
      subtitle: 'अगला अधिग्रहण प्रयास कहाँ लगाना है।',
      loading: 'एट्रिब्यूशन लोड हो रहा है',
      error: { title: 'एट्रिब्यूशन लोड नहीं हो पाया', body: 'नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।' },
      empty: { title: 'अभी कोई लीड नहीं', body: 'लीड आने शुरू होते ही स्रोत डेटा दिखने लगेगा।' },
      leadCount: 'लीड',
      conversionRate: 'रूपांतरण',
      avgDealValue: 'औसत डील मूल्य',
      costPerConversion: 'प्रति रूपांतरण लागत',
      noCost: 'कोई सीधी लागत नहीं',
      lowSampleLabel: 'कम नमूना',
      trendHeading: 'साप्ताहिक मात्रा',
      immutableNote: 'स्रोत सिर्फ़ दर्ज होते समय तय होता है और बाद में कभी नहीं बदलता, चाहे लीड पाइपलाइन में कितनी भी दूर चला जाए — ये आँकड़े हमेशा ऐतिहासिक रूप से सटीक रहते हैं।',
    },
  },

  mr: {
    leadSourceAttribution: {
      title: 'स्रोत आणि कॅम्पेन अ‍ॅट्रिब्यूशन',
      subtitle: 'पुढचा अधिग्रहण प्रयत्न कुठे करायचा.',
      loading: 'अ‍ॅट्रिब्यूशन लोड होत आहे',
      error: { title: 'अ‍ॅट्रिब्यूशन लोड होऊ शकले नाही', body: 'नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'अजून कोणतेही लीड नाहीत', body: 'लीड येऊ लागताच स्रोत डेटा दिसेल.' },
      leadCount: 'लीड',
      conversionRate: 'रूपांतर',
      avgDealValue: 'सरासरी डील मूल्य',
      costPerConversion: 'प्रति रूपांतर खर्च',
      noCost: 'थेट खर्च नाही',
      lowSampleLabel: 'कमी नमुना',
      trendHeading: 'साप्ताहिक प्रमाण',
      immutableNote: 'स्रोत फक्त नोंदणीच्या वेळी ठरतो आणि नंतर कधीही बदलत नाही, लीड पाइपलाइनमध्ये कितीही पुढे गेला तरी — हे आकडे नेहमी ऐतिहासिकदृष्ट्या अचूक राहतात.',
    },
  },
};

export default translations;
