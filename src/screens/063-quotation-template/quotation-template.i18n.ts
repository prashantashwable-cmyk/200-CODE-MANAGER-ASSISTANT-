import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    quotationTemplate: {
      title: 'Templates & branding',
      subtitle: 'Every quotation pulls its layout and legal terms from here — never retyped per quote.',
      loading: 'Loading templates',
      error: { title: 'Could not load templates', body: 'Check your connection and try again.' },
      variant: {
        residential_standard: 'Residential Standard',
        premium_luxury: 'Premium / Luxury',
        commercial_bulk: 'Commercial Bulk',
      },
      listRow: {
        version: 'v{{version}}',
        validity: 'Valid {{days}} days',
      },
      form: {
        logoHeading: 'Logo',
        logoLabel: 'Company logo',
        logoHint: 'Appears on every quotation using this template — a low-resolution image will be flagged before it is accepted.',
        taglineLabel: 'Footer tagline',
        validityLabel: 'Validity period (days)',
        validityHint: 'Becomes an enforced expiry on every quote sent with this template.',
        boilerplateHeading: 'Legal boilerplate',
        nationalLabel: 'National default',
        stateOverrideLabel: '{{state}} override (layered on top of the national default)',
        stateOverrideHint: 'For jurisdiction-specific clauses — state Lift Act references vary.',
        openQuotesNote: 'Editing this only affects quotes generated after you save — a quote already open with a customer keeps the version it was sent with.',
        save: 'Save template',
      },
      preview: {
        heading: 'Live preview',
        validUntil: 'Valid until {{date}}',
      },
      toast: {
        saved: 'Template saved',
        error: 'Could not save — try again.',
      },
    },
  },

  hi: {
    quotationTemplate: {
      title: 'टेम्पलेट और ब्रांडिंग',
      subtitle: 'हर कोटेशन अपना लेआउट और कानूनी शर्तें यहीं से लेता है — हर कोटेशन पर दोबारा नहीं टाइप की जातीं।',
      loading: 'टेम्पलेट लोड हो रहे हैं',
      error: { title: 'टेम्पलेट लोड नहीं हो पाए', body: 'नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।' },
      variant: {
        residential_standard: 'रेज़िडेंशियल स्टैंडर्ड',
        premium_luxury: 'प्रीमियम / लक्ज़री',
        commercial_bulk: 'कमर्शियल बल्क',
      },
      listRow: {
        version: 'v{{version}}',
        validity: '{{days}} दिन मान्य',
      },
      form: {
        logoHeading: 'लोगो',
        logoLabel: 'कंपनी लोगो',
        logoHint: 'इस टेम्पलेट का उपयोग करने वाले हर कोटेशन पर दिखता है — कम-रिज़ॉल्यूशन छवि स्वीकार करने से पहले चिह्नित की जाएगी।',
        taglineLabel: 'फ़ुटर टैगलाइन',
        validityLabel: 'मान्यता अवधि (दिन)',
        validityHint: 'इस टेम्पलेट से भेजे गए हर कोटेशन पर एक तय समाप्ति बन जाती है।',
        boilerplateHeading: 'कानूनी बॉयलरप्लेट',
        nationalLabel: 'राष्ट्रीय डिफ़ॉल्ट',
        stateOverrideLabel: '{{state}} ओवरराइड (राष्ट्रीय डिफ़ॉल्ट के ऊपर जोड़ा गया)',
        stateOverrideHint: 'राज्य-विशिष्ट शर्तों के लिए — राज्य लिफ़्ट अधिनियम के संदर्भ अलग-अलग होते हैं।',
        openQuotesNote: 'इसे संपादित करने से केवल सहेजने के बाद बने कोटेशन प्रभावित होते हैं — ग्राहक के पास पहले से खुला कोटेशन उसी वर्शन में रहता है जिसमें भेजा गया था।',
        save: 'टेम्पलेट सहेजें',
      },
      preview: {
        heading: 'लाइव पूर्वावलोकन',
        validUntil: '{{date}} तक मान्य',
      },
      toast: {
        saved: 'टेम्पलेट सहेजा गया',
        error: 'सहेजा नहीं जा सका — दोबारा कोशिश करें।',
      },
    },
  },

  mr: {
    quotationTemplate: {
      title: 'टेम्पलेट्स आणि ब्रँडिंग',
      subtitle: 'प्रत्येक कोटेशन आपला लेआउट आणि कायदेशीर अटी इथूनच घेते — प्रत्येक कोटेशनवर पुन्हा टाइप केल्या जात नाहीत.',
      loading: 'टेम्पलेट्स लोड होत आहेत',
      error: { title: 'टेम्पलेट्स लोड होऊ शकले नाहीत', body: 'नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.' },
      variant: {
        residential_standard: 'रेसिडेन्शियल स्टँडर्ड',
        premium_luxury: 'प्रीमियम / लक्झरी',
        commercial_bulk: 'कमर्शियल बल्क',
      },
      listRow: {
        version: 'v{{version}}',
        validity: '{{days}} दिवस वैध',
      },
      form: {
        logoHeading: 'लोगो',
        logoLabel: 'कंपनी लोगो',
        logoHint: 'हे टेम्पलेट वापरणाऱ्या प्रत्येक कोटेशनवर दिसते — कमी-रिझोल्यूशन प्रतिमा स्वीकारण्यापूर्वी नोंदवली जाईल.',
        taglineLabel: 'फूटर टॅगलाइन',
        validityLabel: 'वैधता कालावधी (दिवस)',
        validityHint: 'या टेम्पलेटसह पाठवलेल्या प्रत्येक कोटेशनवर एक निश्चित मुदत बनते.',
        boilerplateHeading: 'कायदेशीर बॉयलरप्लेट',
        nationalLabel: 'राष्ट्रीय डीफॉल्ट',
        stateOverrideLabel: '{{state}} ओव्हरराइड (राष्ट्रीय डीफॉल्टवर जोडलेले)',
        stateOverrideHint: 'राज्य-विशिष्ट कलमांसाठी — राज्य लिफ्ट कायद्याचे संदर्भ वेगवेगळे असतात.',
        openQuotesNote: 'हे संपादित केल्याने फक्त जतन केल्यानंतर तयार होणाऱ्या कोटेशनवर परिणाम होतो — ग्राहकाकडे आधीच उघडे असलेले कोटेशन ज्या आवृत्तीत पाठवले होते तीच ठेवते.',
        save: 'टेम्पलेट जतन करा',
      },
      preview: {
        heading: 'लाइव्ह पूर्वावलोकन',
        validUntil: '{{date}} पर्यंत वैध',
      },
      toast: {
        saved: 'टेम्पलेट जतन झाले',
        error: 'जतन करता आले नाही — पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
