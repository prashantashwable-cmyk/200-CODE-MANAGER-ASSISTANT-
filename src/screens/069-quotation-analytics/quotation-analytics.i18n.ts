import type { ScreenTranslations } from '@/i18n/types';

/** Screen 069 owns the shared `priceBand.*` key set — reused by any later
 *  screen that shows a quote's price band (e.g. Pricing Rules, screen 070). */
const translations: ScreenTranslations = {
  en: {
    priceBand: {
      under10L: 'Under ₹10L',
      '10to25L': '₹10L–25L',
      '25to50L': '₹25L–50L',
      above50L: 'Above ₹50L',
    },
    quotationAnalytics: {
      title: 'Win/Loss Analytics',
      subtitle: 'Which packages, price points and territories are actually winning.',
      loading: 'Loading analytics',
      error: { title: 'Could not load analytics', body: 'Check your connection and try again.' },
      empty: { title: 'No sent quotations yet', body: 'Analytics appear once at least one quotation has been sent to a customer.' },

      segment: { all: 'All', residential: 'Residential', commercial: 'Commercial' },

      kpi: {
        overallWinRate: 'Overall win rate',
        overallWinRateCaption: '{{count}} quotations decided',
        totalQuotes: 'Quotations sent',
        avgDecisionDaysWon: 'Avg. days to win',
        avgDecisionDaysLost: 'Avg. days to lose',
        daysUnit: '{{count}} days',
      },

      section: {
        packageTier: 'By package tier',
        driveType: 'By drive type',
        priceBand: 'By price band',
        territory: 'By territory',
        lossFactors: 'Common loss factors',
      },

      packageTierLabel: {
        standard: 'Standard (single quote)',
        basic: 'Basic',
        premium: 'Premium',
        luxury: 'Luxury',
      },

      rowSummary: '{{won}} won of {{total}} sent',
      lowSampleBadge: 'Low sample',
      lowSampleNote: 'Rows marked "Low sample" have too few decided quotes for the win rate to be meaningful yet.',

      drillSheet: {
        quoteLine: '{{code}} · {{price}}',
        noQuotes: 'No quotations here yet.',
      },
    },
  },

  hi: {
    priceBand: {
      under10L: '₹10 लाख से कम',
      '10to25L': '₹10–25 लाख',
      '25to50L': '₹25–50 लाख',
      above50L: '₹50 लाख से अधिक',
    },
    quotationAnalytics: {
      title: 'जीत/हार विश्लेषण',
      subtitle: 'कौन-से पैकेज, कीमत स्तर और क्षेत्र वास्तव में जीत रहे हैं।',
      loading: 'विश्लेषण लोड हो रहा है',
      error: { title: 'विश्लेषण लोड नहीं हो सका', body: 'अपना कनेक्शन जांचें और फिर से प्रयास करें।' },
      empty: { title: 'अभी तक कोई कोटेशन नहीं भेजा गया', body: 'कम से कम एक कोटेशन ग्राहक को भेजे जाने के बाद विश्लेषण दिखाई देगा।' },

      segment: { all: 'सभी', residential: 'आवासीय', commercial: 'वाणिज्यिक' },

      kpi: {
        overallWinRate: 'कुल जीत दर',
        overallWinRateCaption: '{{count}} कोटेशन तय हुए',
        totalQuotes: 'भेजे गए कोटेशन',
        avgDecisionDaysWon: 'जीतने में औसत दिन',
        avgDecisionDaysLost: 'हारने में औसत दिन',
        daysUnit: '{{count}} दिन',
      },

      section: {
        packageTier: 'पैकेज स्तर के अनुसार',
        driveType: 'ड्राइव प्रकार के अनुसार',
        priceBand: 'कीमत स्तर के अनुसार',
        territory: 'क्षेत्र के अनुसार',
        lossFactors: 'हार के सामान्य कारण',
      },

      packageTierLabel: {
        standard: 'मानक (एकल कोटेशन)',
        basic: 'बेसिक',
        premium: 'प्रीमियम',
        luxury: 'लक्ज़री',
      },

      rowSummary: '{{total}} में से {{won}} जीते',
      lowSampleBadge: 'कम नमूना',
      lowSampleNote: '"कम नमूना" चिह्नित पंक्तियों में जीत दर सार्थक होने के लिए पर्याप्त तय कोटेशन नहीं हैं।',

      drillSheet: {
        quoteLine: '{{code}} · {{price}}',
        noQuotes: 'यहाँ अभी कोई कोटेशन नहीं है।',
      },
    },
  },

  mr: {
    priceBand: {
      under10L: '₹10 लाखांपेक्षा कमी',
      '10to25L': '₹10–25 लाख',
      '25to50L': '₹25–50 लाख',
      above50L: '₹50 लाखांपेक्षा जास्त',
    },
    quotationAnalytics: {
      title: 'जय/पराजय विश्लेषण',
      subtitle: 'कोणते पॅकेज, किंमत पातळी आणि प्रदेश प्रत्यक्षात जिंकत आहेत.',
      loading: 'विश्लेषण लोड होत आहे',
      error: { title: 'विश्लेषण लोड होऊ शकले नाही', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'अद्याप कोणतेही कोटेशन पाठवलेले नाही', body: 'किमान एक कोटेशन ग्राहकाला पाठवल्यानंतर विश्लेषण दिसेल.' },

      segment: { all: 'सर्व', residential: 'निवासी', commercial: 'व्यावसायिक' },

      kpi: {
        overallWinRate: 'एकूण जिंकण्याचा दर',
        overallWinRateCaption: '{{count}} कोटेशन निकाली',
        totalQuotes: 'पाठवलेले कोटेशन',
        avgDecisionDaysWon: 'जिंकण्यासाठी सरासरी दिवस',
        avgDecisionDaysLost: 'गमावण्यासाठी सरासरी दिवस',
        daysUnit: '{{count}} दिवस',
      },

      section: {
        packageTier: 'पॅकेज स्तरानुसार',
        driveType: 'ड्राइव्ह प्रकारानुसार',
        priceBand: 'किंमत पातळीनुसार',
        territory: 'प्रदेशानुसार',
        lossFactors: 'पराभवाची सामान्य कारणे',
      },

      packageTierLabel: {
        standard: 'मानक (एकल कोटेशन)',
        basic: 'बेसिक',
        premium: 'प्रीमियम',
        luxury: 'लक्झरी',
      },

      rowSummary: '{{total}} पैकी {{won}} जिंकले',
      lowSampleBadge: 'कमी नमुना',
      lowSampleNote: '"कमी नमुना" चिन्हांकित रांगांमध्ये जिंकण्याचा दर अर्थपूर्ण होण्यासाठी पुरेसे निकाली कोटेशन नाहीत.',

      drillSheet: {
        quoteLine: '{{code}} · {{price}}',
        noQuotes: 'इथे अद्याप कोणतेही कोटेशन नाही.',
      },
    },
  },
};

export default translations;
