import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    packageComparison: {
      title: 'Package comparison',
      subtitle: 'Basic, Premium and Luxury — generated from one shared building spec, a genuine apples-to-apples comparison.',
      loading: 'Loading comparisons',
      error: { title: 'Could not load comparisons', body: 'Check your connection and try again.' },
      empty: { title: 'No comparisons yet', body: 'Generate one above for any lead.' },
      newComparison: {
        heading: 'New comparison',
        pickLead: 'Choose a lead',
        generate: 'Generate comparison',
      },
      pastSets: { heading: 'Past comparisons' },
      tier: { basic: 'Basic', premium: 'Premium', luxury: 'Luxury' },
      recommended: 'Recommended',
      safetyIncludedNote: 'ARD (Automatic Rescue Device) and door sensors are included on every tier — safety is never the differentiator.',
      priceGapWarning: 'The gap between tiers here is unusually small — worth a review before presenting this comparison.',
      feature: {
        price: 'Price',
        finish: 'Cabin finish',
        warranty: 'Warranty',
        warrantyValue: '{{count}} yr',
        amc: 'AMC (annual)',
      },
      select: 'Select this package',
      customize: 'Customize from here',
      toast: {
        generated: 'Comparison generated',
        error: 'Could not generate — try again.',
      },
    },
  },

  hi: {
    packageComparison: {
      title: 'पैकेज तुलना',
      subtitle: 'बेसिक, प्रीमियम और लक्ज़री — एक साझा बिल्डिंग स्पेक से बनाए गए, एक वास्तविक बराबर-दर-बराबर तुलना।',
      loading: 'तुलनाएँ लोड हो रही हैं',
      error: { title: 'तुलनाएँ लोड नहीं हो पाईं', body: 'नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।' },
      empty: { title: 'अभी कोई तुलना नहीं', body: 'किसी भी लीड के लिए ऊपर से एक बनाएँ।' },
      newComparison: {
        heading: 'नई तुलना',
        pickLead: 'एक लीड चुनें',
        generate: 'तुलना बनाएँ',
      },
      pastSets: { heading: 'पिछली तुलनाएँ' },
      tier: { basic: 'बेसिक', premium: 'प्रीमियम', luxury: 'लक्ज़री' },
      recommended: 'अनुशंसित',
      safetyIncludedNote: 'ARD (ऑटोमैटिक रेस्क्यू डिवाइस) और डोर सेंसर हर स्तर पर शामिल हैं — सुरक्षा कभी अंतर की वजह नहीं होती।',
      priceGapWarning: 'यहाँ स्तरों के बीच का अंतर असामान्य रूप से कम है — यह तुलना दिखाने से पहले समीक्षा लायक है।',
      feature: {
        price: 'कीमत',
        finish: 'केबिन फ़िनिश',
        warranty: 'वारंटी',
        warrantyValue: '{{count}} वर्ष',
        amc: 'AMC (वार्षिक)',
      },
      select: 'यह पैकेज चुनें',
      customize: 'यहाँ से कस्टमाइज़ करें',
      toast: {
        generated: 'तुलना बनाई गई',
        error: 'बनाई नहीं जा सकी — दोबारा कोशिश करें।',
      },
    },
  },

  mr: {
    packageComparison: {
      title: 'पॅकेज तुलना',
      subtitle: 'बेसिक, प्रीमियम आणि लक्झरी — एका सामायिक इमारत स्पेकमधून तयार केलेली, खरी समान-ते-समान तुलना.',
      loading: 'तुलना लोड होत आहेत',
      error: { title: 'तुलना लोड होऊ शकल्या नाहीत', body: 'नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'अजून कोणतीही तुलना नाही', body: 'कोणत्याही लीडसाठी वर एक तयार करा.' },
      newComparison: {
        heading: 'नवीन तुलना',
        pickLead: 'एक लीड निवडा',
        generate: 'तुलना तयार करा',
      },
      pastSets: { heading: 'मागील तुलना' },
      tier: { basic: 'बेसिक', premium: 'प्रीमियम', luxury: 'लक्झरी' },
      recommended: 'शिफारस केलेले',
      safetyIncludedNote: 'ARD (ऑटोमॅटिक रेस्क्यू डिव्हाइस) आणि डोअर सेन्सर प्रत्येक स्तरावर समाविष्ट आहेत — सुरक्षितता कधीही फरक करणारा घटक नसतो.',
      priceGapWarning: 'इथे स्तरांमधील फरक असामान्यपणे कमी आहे — ही तुलना सादर करण्यापूर्वी पुनरावलोकन करण्यायोग्य आहे.',
      feature: {
        price: 'किंमत',
        finish: 'केबिन फिनिश',
        warranty: 'वॉरंटी',
        warrantyValue: '{{count}} वर्ष',
        amc: 'AMC (वार्षिक)',
      },
      select: 'हे पॅकेज निवडा',
      customize: 'इथून सानुकूलित करा',
      toast: {
        generated: 'तुलना तयार झाली',
        error: 'तयार करता आले नाही — पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
