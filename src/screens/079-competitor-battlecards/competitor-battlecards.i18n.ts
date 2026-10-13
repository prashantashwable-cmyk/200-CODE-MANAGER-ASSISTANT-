import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    competitorBattlecards: {
      title: 'Competitor Battlecards',
      subtitle: 'Internal sales reference — never customer-facing',
      internalOnlyBanner: 'Internal use only. This content is structurally unavailable to any customer-facing message — never copy it into a customer conversation.',
      loading: 'Loading battlecards',
      error: { title: 'Could not load battlecards', body: 'Check your connection and try again.' },
      empty: { title: 'No competitors added yet', body: 'Add a battlecard for a competitor to build the library.' },
      noResults: { title: 'No matching competitors', body: 'Try a different keyword.' },
      searchPlaceholder: 'Search by competitor name or keyword',

      pricePosition: {
        premium: 'Premium',
        comparable: 'Comparable',
        budget: 'Budget',
      },

      row: {
        flagged: 'Flagged for review',
        lastReviewed: 'Last reviewed',
      },

      detail: {
        strengthsHeading: 'Their genuine strengths',
        differentiationHeading: 'Where AIEC differs',
        lastReviewedLine: 'Last reviewed by {{name}} on {{date}}',
        flaggedBanner: 'Flagged for review',
        flaggedByLine: 'Flagged by {{name}} on {{date}}',
        versionHistoryHeading: 'Update history',
        versionRow: 'v{{version}} · {{editor}} · {{date}}',
        edit: 'Edit',
        flagForReview: 'Flag for review',
        goToObjectionScripts: 'Open "comparison to bigger players" scripts',
      },

      editForm: {
        priceSummaryLabel: 'Price positioning summary',
        strengthsLabel: 'Their genuine strengths',
        strengthsHint: 'One per line.',
        differentiationLabel: 'Where AIEC differs',
        differentiationHint: 'One per line — keep it factual and grounded in AIEC\'s real capabilities.',
        save: 'Save new version',
        cancel: 'Cancel',
      },

      flagSheet: {
        title: 'Flag for review',
        hint: 'Tell Admin what looks stale or inaccurate — this doesn\'t change the content itself, just raises it for review.',
        reasonLabel: 'What did you notice?',
        submit: 'Submit flag',
      },

      addCompetitor: {
        button: 'Add competitor',
        sheetTitle: 'Add a competitor',
        nameLabel: 'Competitor name',
        pricePositionLabel: 'Price position',
        submit: 'Add',
      },

      toast: {
        saved: 'New version saved',
        flagged: 'Flagged for review',
        created: 'Competitor added',
        error: 'Something went wrong. Please try again.',
      },
    },
  },
  hi: {
    competitorBattlecards: {
      title: 'प्रतिस्पर्धी बैटलकार्ड',
      subtitle: 'आंतरिक बिक्री संदर्भ — कभी भी ग्राहक को नहीं दिखाया जाता',
      internalOnlyBanner: 'केवल आंतरिक उपयोग के लिए। यह सामग्री संरचनात्मक रूप से किसी भी ग्राहक-संदेश में उपलब्ध नहीं है — इसे कभी भी ग्राहक बातचीत में कॉपी न करें।',
      loading: 'बैटलकार्ड लोड हो रहे हैं',
      error: { title: 'बैटलकार्ड लोड नहीं हो सके', body: 'अपना कनेक्शन जांचें और फिर से कोशिश करें।' },
      empty: { title: 'अभी कोई प्रतिस्पर्धी नहीं जोड़ा गया', body: 'लाइब्रेरी बनाने के लिए किसी प्रतिस्पर्धी का बैटलकार्ड जोड़ें।' },
      noResults: { title: 'कोई मेल खाता प्रतिस्पर्धी नहीं', body: 'कोई अलग शब्द आज़माएं।' },
      searchPlaceholder: 'प्रतिस्पर्धी के नाम या शब्द से खोजें',

      pricePosition: {
        premium: 'प्रीमियम',
        comparable: 'समान',
        budget: 'बजट',
      },

      row: {
        flagged: 'समीक्षा के लिए चिह्नित',
        lastReviewed: 'आखिरी बार समीक्षा',
      },

      detail: {
        strengthsHeading: 'उनकी वास्तविक ताकतें',
        differentiationHeading: 'AIEC कहां अलग है',
        lastReviewedLine: '{{name}} द्वारा {{date}} को आखिरी बार समीक्षा',
        flaggedBanner: 'समीक्षा के लिए चिह्नित',
        flaggedByLine: '{{name}} द्वारा {{date}} को चिह्नित',
        versionHistoryHeading: 'अपडेट इतिहास',
        versionRow: 'v{{version}} · {{editor}} · {{date}}',
        edit: 'संपादित करें',
        flagForReview: 'समीक्षा के लिए चिह्नित करें',
        goToObjectionScripts: '"बड़े ब्रांड से तुलना" स्क्रिप्ट खोलें',
      },

      editForm: {
        priceSummaryLabel: 'कीमत स्थिति सारांश',
        strengthsLabel: 'उनकी वास्तविक ताकतें',
        strengthsHint: 'हर पंक्ति में एक।',
        differentiationLabel: 'AIEC कहां अलग है',
        differentiationHint: 'हर पंक्ति में एक — तथ्यात्मक रखें और AIEC की वास्तविक क्षमताओं पर आधारित।',
        save: 'नया संस्करण सहेजें',
        cancel: 'रद्द करें',
      },

      flagSheet: {
        title: 'समीक्षा के लिए चिह्नित करें',
        hint: 'बताएं कि क्या पुराना या गलत लग रहा है — इससे सामग्री खुद नहीं बदलती, बस समीक्षा के लिए उठाई जाती है।',
        reasonLabel: 'आपने क्या देखा?',
        submit: 'चिह्न भेजें',
      },

      addCompetitor: {
        button: 'प्रतिस्पर्धी जोड़ें',
        sheetTitle: 'एक प्रतिस्पर्धी जोड़ें',
        nameLabel: 'प्रतिस्पर्धी का नाम',
        pricePositionLabel: 'कीमत स्थिति',
        submit: 'जोड़ें',
      },

      toast: {
        saved: 'नया संस्करण सहेजा गया',
        flagged: 'समीक्षा के लिए चिह्नित किया गया',
        created: 'प्रतिस्पर्धी जोड़ा गया',
        error: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
      },
    },
  },
  mr: {
    competitorBattlecards: {
      title: 'स्पर्धक बॅटलकार्ड',
      subtitle: 'अंतर्गत विक्री संदर्भ — कधीही ग्राहकांना दाखवले जात नाही',
      internalOnlyBanner: 'फक्त अंतर्गत वापरासाठी. ही सामग्री संरचनात्मकदृष्ट्या कोणत्याही ग्राहक-संदेशात उपलब्ध नाही — ती कधीही ग्राहकाशी संभाषणात कॉपी करू नका.',
      loading: 'बॅटलकार्ड लोड होत आहेत',
      error: { title: 'बॅटलकार्ड लोड होऊ शकले नाहीत', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'अजून कोणताही स्पर्धक जोडलेला नाही', body: 'लायब्ररी तयार करण्यासाठी एखाद्या स्पर्धकाचे बॅटलकार्ड जोडा.' },
      noResults: { title: 'जुळणारा स्पर्धक नाही', body: 'वेगळा शब्द वापरून पहा.' },
      searchPlaceholder: 'स्पर्धकाच्या नावाने किंवा शब्दाने शोधा',

      pricePosition: {
        premium: 'प्रीमियम',
        comparable: 'तुलनीय',
        budget: 'बजेट',
      },

      row: {
        flagged: 'पुनरावलोकनासाठी चिन्हांकित',
        lastReviewed: 'शेवटचे पुनरावलोकन',
      },

      detail: {
        strengthsHeading: 'त्यांची खरी बलस्थाने',
        differentiationHeading: 'AIEC कुठे वेगळे आहे',
        lastReviewedLine: '{{name}} यांनी {{date}} रोजी शेवटचे पुनरावलोकन केले',
        flaggedBanner: 'पुनरावलोकनासाठी चिन्हांकित',
        flaggedByLine: '{{name}} यांनी {{date}} रोजी चिन्हांकित केले',
        versionHistoryHeading: 'अद्यतन इतिहास',
        versionRow: 'v{{version}} · {{editor}} · {{date}}',
        edit: 'संपादित करा',
        flagForReview: 'पुनरावलोकनासाठी चिन्हांकित करा',
        goToObjectionScripts: '"मोठ्या ब्रँडशी तुलना" स्क्रिप्ट उघडा',
      },

      editForm: {
        priceSummaryLabel: 'किंमत स्थिती सारांश',
        strengthsLabel: 'त्यांची खरी बलस्थाने',
        strengthsHint: 'प्रत्येक ओळीत एक.',
        differentiationLabel: 'AIEC कुठे वेगळे आहे',
        differentiationHint: 'प्रत्येक ओळीत एक — तथ्यात्मक ठेवा आणि AIEC च्या खऱ्या क्षमतांवर आधारित.',
        save: 'नवीन आवृत्ती जतन करा',
        cancel: 'रद्द करा',
      },

      flagSheet: {
        title: 'पुनरावलोकनासाठी चिन्हांकित करा',
        hint: 'काय जुने किंवा चुकीचे वाटते ते सांगा — यामुळे सामग्री स्वतः बदलत नाही, फक्त पुनरावलोकनासाठी उचलली जाते.',
        reasonLabel: 'तुम्ही काय पाहिले?',
        submit: 'चिन्ह सादर करा',
      },

      addCompetitor: {
        button: 'स्पर्धक जोडा',
        sheetTitle: 'स्पर्धक जोडा',
        nameLabel: 'स्पर्धकाचे नाव',
        pricePositionLabel: 'किंमत स्थिती',
        submit: 'जोडा',
      },

      toast: {
        saved: 'नवीन आवृत्ती जतन झाली',
        flagged: 'पुनरावलोकनासाठी चिन्हांकित केले',
        created: 'स्पर्धक जोडला',
        error: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
