import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    leadScoring: {
      title: 'Lead scoring',
      subtitle: 'Where sales attention should go first.',
      loading: 'Loading scored leads',
      error: { title: 'Could not load scores', body: 'Check your connection and try again.' },
      empty: { title: 'No active leads to score', body: 'Scores appear once leads are in the active pipeline.' },
      showBreakdown: 'Show score breakdown',
      hideBreakdown: 'Hide score breakdown',
      breakdownNote: 'No breakdown recorded for this lead yet.',
      factor: {
        buildingSize: 'Building size',
        constructionReadiness: 'Construction readiness',
        responsiveness: 'Contact responsiveness',
        territoryHistory: 'Territory conversion history',
      },
      weighting: {
        heading: 'Scoring weights',
        body: 'Admin-adjustable — changes apply to the active pipeline going forward. Closed leads keep the score they were computed under, unchanged.',
        totalNote: 'Total: {{total}}% — normalized automatically on save.',
        save: 'Save weights',
        reset: 'Reset',
        reshuffleWarning: 'This would meaningfully reshuffle the active pipeline’s order. Tap again to apply anyway.',
        confirmApply: 'Apply anyway',
        updatedAt: 'Weights last changed {{date}}',
      },
      toast: {
        saved: 'Weights saved — active scores recalculated',
        error: 'Could not save — try again',
      },
    },
  },

  hi: {
    leadScoring: {
      title: 'लीड स्कोरिंग',
      subtitle: 'सेल्स का ध्यान सबसे पहले कहाँ जाना चाहिए।',
      loading: 'स्कोर किए गए लीड लोड हो रहे हैं',
      error: { title: 'स्कोर लोड नहीं हो पाए', body: 'नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।' },
      empty: { title: 'स्कोर करने के लिए कोई सक्रिय लीड नहीं', body: 'लीड सक्रिय पाइपलाइन में आते ही स्कोर दिखने लगते हैं।' },
      showBreakdown: 'स्कोर का ब्यौरा दिखाएँ',
      hideBreakdown: 'स्कोर का ब्यौरा छिपाएँ',
      breakdownNote: 'इस लीड के लिए अभी कोई ब्यौरा दर्ज नहीं है।',
      factor: {
        buildingSize: 'बिल्डिंग साइज़',
        constructionReadiness: 'निर्माण तैयारी',
        responsiveness: 'संपर्क प्रतिक्रिया',
        territoryHistory: 'टेरिटरी रूपांतरण इतिहास',
      },
      weighting: {
        heading: 'स्कोरिंग वेट',
        body: 'एडमिन द्वारा बदलने योग्य — बदलाव आगे से सक्रिय पाइपलाइन पर लागू होते हैं। बंद हो चुके लीड का स्कोर जिस वेट पर बना था, वही रहता है।',
        totalNote: 'कुल: {{total}}% — सहेजते समय अपने आप सामान्यीकृत हो जाता है।',
        save: 'वेट सहेजें',
        reset: 'रीसेट',
        reshuffleWarning: 'इससे सक्रिय पाइपलाइन का क्रम काफ़ी बदल जाएगा। फिर भी लागू करने के लिए दोबारा दबाएँ।',
        confirmApply: 'फिर भी लागू करें',
        updatedAt: 'वेट आख़िरी बार {{date}} को बदला गया',
      },
      toast: {
        saved: 'वेट सहेजे गए — सक्रिय स्कोर फिर से गिने गए',
        error: 'सहेजा नहीं जा सका — दोबारा कोशिश करें',
      },
    },
  },

  mr: {
    leadScoring: {
      title: 'लीड स्कोअरिंग',
      subtitle: 'सेल्सचे लक्ष आधी कुठे जायला हवे.',
      loading: 'स्कोअर केलेले लीड लोड होत आहेत',
      error: { title: 'स्कोअर लोड होऊ शकले नाहीत', body: 'नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'स्कोअर करण्यासाठी कोणतेही सक्रिय लीड नाहीत', body: 'लीड सक्रिय पाइपलाइनमध्ये येताच स्कोअर दिसू लागतात.' },
      showBreakdown: 'स्कोअरचा तपशील दाखवा',
      hideBreakdown: 'स्कोअरचा तपशील लपवा',
      breakdownNote: 'या लीडसाठी अजून कोणताही तपशील नोंदवलेला नाही.',
      factor: {
        buildingSize: 'इमारतीचा आकार',
        constructionReadiness: 'बांधकाम तयारी',
        responsiveness: 'संपर्क प्रतिसाद',
        territoryHistory: 'टेरिटरी रूपांतर इतिहास',
      },
      weighting: {
        heading: 'स्कोअरिंग वेट',
        body: 'अ‍ॅडमिनद्वारे बदलण्यायोग्य — बदल यापुढे सक्रिय पाइपलाइनला लागू होतील. बंद झालेल्या लीडचा स्कोअर ज्या वेटखाली मोजला गेला तोच राहतो.',
        totalNote: 'एकूण: {{total}}% — जतन करताना आपोआप सामान्यीकृत होते.',
        save: 'वेट जतन करा',
        reset: 'रीसेट',
        reshuffleWarning: 'यामुळे सक्रिय पाइपलाइनचा क्रम लक्षणीयरीत्या बदलेल. तरीही लागू करण्यासाठी पुन्हा दाबा.',
        confirmApply: 'तरीही लागू करा',
        updatedAt: 'वेट शेवटचे {{date}} रोजी बदलले',
      },
      toast: {
        saved: 'वेट जतन झाले — सक्रिय स्कोअर पुन्हा मोजले गेले',
        error: 'जतन करता आले नाही — पुन्हा प्रयत्न करा',
      },
    },
  },
};

export default translations;
