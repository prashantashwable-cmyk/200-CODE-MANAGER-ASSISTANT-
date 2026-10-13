import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    execKpi: {
      title: 'Good day',
      subtitle: 'Here is the business, right now.',
      loading: 'Loading your dashboard',
      revenueTrend: 'Revenue, last 30 days',
      range: { today: 'Today', week: 'This week', month: 'This month', quarter: 'This quarter' },
      card: {
        leads: 'Leads',
        conversion: 'Conversion',
        revenue: 'Revenue booked',
        margin: 'Average deal',
        activeJobs: 'Installations running',
        overdue: 'Overdue payments',
      },
      noData: 'No data yet',
      smallSample: 'Small sample — read this trend with caution',
      funnelHeading: 'Where the business is thick and thin',
      funnelSubtitle: 'Every lead currently sitting at each stage.',
      alertsHeading: 'Needs attention',
      alertsCta: 'Open alerts',
      quickLinks: 'Go deeper',
      link: {
        map: 'Live map',
        funnel: 'Sales funnel',
        finance: 'Cash flow',
        automation: 'Automation health',
      },
      sameDataNote: 'Every card above reads from these same records — nothing here is entered separately.',
      error: {
        title: 'Could not load your dashboard',
        body: 'We could not reach the business data. Check your connection and try again.',
      },
    },
  },

  hi: {
    execKpi: {
      title: 'नमस्ते',
      subtitle: 'यह रहा कारोबार, अभी इस वक़्त।',
      loading: 'आपका डैशबोर्ड लोड हो रहा है',
      revenueTrend: 'राजस्व, पिछले 30 दिन',
      range: { today: 'आज', week: 'इस हफ़्ते', month: 'इस महीने', quarter: 'इस तिमाही' },
      card: {
        leads: 'लीड',
        conversion: 'रूपांतरण',
        revenue: 'बुक हुआ राजस्व',
        margin: 'औसत सौदा',
        activeJobs: 'चल रहे इंस्टॉलेशन',
        overdue: 'बकाया भुगतान',
      },
      noData: 'अभी कोई डेटा नहीं',
      smallSample: 'छोटा नमूना — इस रुझान को सावधानी से पढ़िए',
      funnelHeading: 'कारोबार कहाँ घना है, कहाँ पतला',
      funnelSubtitle: 'हर लीड जो अभी जिस चरण में है।',
      alertsHeading: 'ध्यान चाहिए',
      alertsCta: 'चेतावनियाँ खोलें',
      quickLinks: 'और गहराई में जाएँ',
      link: {
        map: 'लाइव नक्शा',
        funnel: 'बिक्री फ़नल',
        finance: 'नक़दी प्रवाह',
        automation: 'ऑटोमेशन सेहत',
      },
      sameDataNote: 'ऊपर हर कार्ड इन्हीं रिकॉर्ड से पढ़ता है — यहाँ कुछ भी अलग से दर्ज नहीं होता।',
      error: {
        title: 'आपका डैशबोर्ड लोड नहीं हो पाया',
        body: 'हम कारोबार डेटा तक नहीं पहुँच पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
    },
  },

  mr: {
    execKpi: {
      title: 'नमस्कार',
      subtitle: 'हा आहे व्यवसाय, आत्ता याक्षणी.',
      loading: 'तुमचा डॅशबोर्ड लोड होत आहे',
      revenueTrend: 'महसूल, गेले ३० दिवस',
      range: { today: 'आज', week: 'या आठवड्यात', month: 'या महिन्यात', quarter: 'या तिमाहीत' },
      card: {
        leads: 'लीड',
        conversion: 'रूपांतर',
        revenue: 'नोंदलेला महसूल',
        margin: 'सरासरी व्यवहार',
        activeJobs: 'चालू बसवणुका',
        overdue: 'थकीत पैसे',
      },
      noData: 'अजून माहिती नाही',
      smallSample: 'लहान नमुना — हा कल सावधपणे वाचा',
      funnelHeading: 'व्यवसाय कुठे दाट आहे, कुठे विरळ',
      funnelSubtitle: 'सध्या प्रत्येक टप्प्यावर असलेला प्रत्येक लीड.',
      alertsHeading: 'लक्ष हवे',
      alertsCta: 'सूचना उघडा',
      quickLinks: 'अधिक खोलात जा',
      link: {
        map: 'थेट नकाशा',
        funnel: 'विक्री फनेल',
        finance: 'रोख प्रवाह',
        automation: 'स्वयंचलन आरोग्य',
      },
      sameDataNote: 'वरील प्रत्येक कार्ड याच नोंदींमधून वाचते — इथे काहीही वेगळे नोंदवलेले नाही.',
      error: {
        title: 'तुमचा डॅशबोर्ड लोड होऊ शकला नाही',
        body: 'आम्ही व्यवसाय माहितीपर्यंत पोहोचू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
