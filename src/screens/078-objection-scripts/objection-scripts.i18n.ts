import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    objectionScripts: {
      title: 'Customer Objection & Concern Scripts',
      subtitle: 'One approved, honest response for every common concern',
      loading: 'Loading scripts',
      error: { title: 'Could not load the script library', body: 'Check your connection and try again.' },
      empty: { title: 'No scripts here yet', body: 'Approved scripts you add will appear in this tab.' },
      noResults: { title: 'No matching scripts', body: 'Try a different keyword or category.' },
      searchPlaceholder: 'Search by keyword or category',

      statusTab: {
        approved: 'Approved',
        suggested: 'Suggested',
        archived: 'Archived',
      },

      category: {
        safety_new_brand: 'Safety of a newer brand',
        installation_disruption: 'Installation disruption',
        timeline_worry: 'Timeline worries',
        competitor_comparison: 'Comparison to bigger players',
        price_too_high: 'Price is too high',
        wants_to_delay: 'Wants to delay',
        other: 'Other / emerging',
      },

      effectiveness: {
        score: '{{score}}% effective',
        earlyData: 'Not enough uses yet for a reliable score.',
        noData: 'No data yet',
        usageCount: 'Used {{count}} times',
      },

      row: {
        copy: 'Copy',
        usedByBot: 'Also used by the Auto-Negotiation Bot',
      },

      detail: {
        citedStandards: 'Cited standards',
        territoryHeading: 'Effectiveness by territory',
        territoryRow: '{{count}} uses · {{score}}%',
        versionHistoryHeading: 'Update history',
        versionRow: 'v{{version}} · {{editor}} · {{date}}',
        sourceNoteLabel: 'Where this came from',
        usedByBotBanner: 'This category also drives the Auto-Negotiation Bot\'s Objection Scenario Map — keep the wording here and there consistent.',
        goToBotConfig: 'Open bot configuration',
        copyResponse: 'Copy response',
        editResponse: 'Edit',
        responseLabel: 'Response text',
        saveEdit: 'Save new version',
        approve: 'Approve',
        archive: 'Archive',
        restore: 'Restore',
      },

      addScript: {
        button: 'Add script',
        sheetTitle: 'Add a script',
        sheetHint: 'New scripts are saved as Suggested until an admin reviews and approves them.',
        categoryLabel: 'Concern category',
        responseLabel: 'Approved response text',
        sourceNoteLabel: 'Where did this come from?',
        sourceNoteHint: 'E.g. a specific Reply Inbox conversation or negotiation thread — so the pattern isn\'t lost.',
        submit: 'Submit for review',
      },

      toast: {
        copied: 'Response copied',
        saved: 'New version saved',
        approved: 'Script approved',
        archived: 'Script archived',
        restored: 'Script restored',
        created: 'Suggested script added for review',
        error: 'Something went wrong. Please try again.',
      },
    },
  },
  hi: {
    objectionScripts: {
      title: 'ग्राहक आपत्ति और चिंता स्क्रिप्ट',
      subtitle: 'हर आम चिंता के लिए एक स्वीकृत, ईमानदार जवाब',
      loading: 'स्क्रिप्ट लोड हो रही हैं',
      error: { title: 'स्क्रिप्ट लाइब्रेरी लोड नहीं हो सकी', body: 'अपना कनेक्शन जांचें और फिर से कोशिश करें।' },
      empty: { title: 'यहां अभी कोई स्क्रिप्ट नहीं है', body: 'आपके जोड़े गए स्वीकृत स्क्रिप्ट इस टैब में दिखेंगे।' },
      noResults: { title: 'कोई मेल खाती स्क्रिप्ट नहीं', body: 'कोई अलग शब्द या श्रेणी आज़माएं।' },
      searchPlaceholder: 'शब्द या श्रेणी से खोजें',

      statusTab: {
        approved: 'स्वीकृत',
        suggested: 'सुझाई गई',
        archived: 'संग्रहीत',
      },

      category: {
        safety_new_brand: 'नए ब्रांड की सुरक्षा',
        installation_disruption: 'इंस्टॉलेशन में रुकावट',
        timeline_worry: 'समय-सीमा की चिंता',
        competitor_comparison: 'बड़े ब्रांड से तुलना',
        price_too_high: 'कीमत ज़्यादा लगना',
        wants_to_delay: 'फैसला टालना चाहता है',
        other: 'अन्य / नई चिंता',
      },

      effectiveness: {
        score: '{{score}}% प्रभावी',
        earlyData: 'विश्वसनीय स्कोर के लिए अभी पर्याप्त उपयोग नहीं हुआ है।',
        noData: 'अभी डेटा नहीं है',
        usageCount: '{{count}} बार उपयोग हुआ',
      },

      row: {
        copy: 'कॉपी करें',
        usedByBot: 'ऑटो-नेगोशिएशन बॉट भी इसका उपयोग करता है',
      },

      detail: {
        citedStandards: 'संदर्भित मानक',
        territoryHeading: 'क्षेत्र के अनुसार प्रभावशीलता',
        territoryRow: '{{count}} उपयोग · {{score}}%',
        versionHistoryHeading: 'अपडेट इतिहास',
        versionRow: 'v{{version}} · {{editor}} · {{date}}',
        sourceNoteLabel: 'यह कहां से आया',
        usedByBotBanner: 'यह श्रेणी ऑटो-नेगोशिएशन बॉट के ऑब्जेक्शन सिनेरियो मैप को भी चलाती है — यहां और वहां की भाषा एक जैसी रखें।',
        goToBotConfig: 'बॉट कॉन्फ़िगरेशन खोलें',
        copyResponse: 'जवाब कॉपी करें',
        editResponse: 'संपादित करें',
        responseLabel: 'जवाब का पाठ',
        saveEdit: 'नया संस्करण सहेजें',
        approve: 'स्वीकृत करें',
        archive: 'संग्रहीत करें',
        restore: 'पुनर्स्थापित करें',
      },

      addScript: {
        button: 'स्क्रिप्ट जोड़ें',
        sheetTitle: 'एक स्क्रिप्ट जोड़ें',
        sheetHint: 'नई स्क्रिप्ट "सुझाई गई" के रूप में सहेजी जाती है जब तक एक एडमिन इसकी समीक्षा करके स्वीकृत न कर दे।',
        categoryLabel: 'चिंता की श्रेणी',
        responseLabel: 'स्वीकृत जवाब का पाठ',
        sourceNoteLabel: 'यह कहां से देखा गया?',
        sourceNoteHint: 'जैसे कोई खास रिप्लाई इनबॉक्स बातचीत या नेगोशिएशन थ्रेड — ताकि यह पैटर्न खो न जाए।',
        submit: 'समीक्षा के लिए भेजें',
      },

      toast: {
        copied: 'जवाब कॉपी हो गया',
        saved: 'नया संस्करण सहेजा गया',
        approved: 'स्क्रिप्ट स्वीकृत हो गई',
        archived: 'स्क्रिप्ट संग्रहीत हो गई',
        restored: 'स्क्रिप्ट पुनर्स्थापित हो गई',
        created: 'समीक्षा के लिए सुझाई गई स्क्रिप्ट जोड़ी गई',
        error: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
      },
    },
  },
  mr: {
    objectionScripts: {
      title: 'ग्राहक आक्षेप आणि चिंता स्क्रिप्ट',
      subtitle: 'प्रत्येक सामान्य चिंतेसाठी एक मान्यताप्राप्त, प्रामाणिक उत्तर',
      loading: 'स्क्रिप्ट लोड होत आहेत',
      error: { title: 'स्क्रिप्ट लायब्ररी लोड होऊ शकली नाही', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'इथे अजून कोणतीही स्क्रिप्ट नाही', body: 'तुम्ही जोडलेल्या मान्यताप्राप्त स्क्रिप्ट या टॅबमध्ये दिसतील.' },
      noResults: { title: 'जुळणारी स्क्रिप्ट नाही', body: 'वेगळा शब्द किंवा श्रेणी वापरून पहा.' },
      searchPlaceholder: 'शब्द किंवा श्रेणीने शोधा',

      statusTab: {
        approved: 'मान्यताप्राप्त',
        suggested: 'सुचवलेली',
        archived: 'संग्रहित',
      },

      category: {
        safety_new_brand: 'नवीन ब्रँडची सुरक्षितता',
        installation_disruption: 'इन्स्टॉलेशनमधील अडथळा',
        timeline_worry: 'कालमर्यादेची चिंता',
        competitor_comparison: 'मोठ्या ब्रँडशी तुलना',
        price_too_high: 'किंमत जास्त वाटणे',
        wants_to_delay: 'निर्णय पुढे ढकलू इच्छितो',
        other: 'इतर / नवीन चिंता',
      },

      effectiveness: {
        score: '{{score}}% प्रभावी',
        earlyData: 'विश्वासार्ह स्कोअरसाठी अजून पुरेसा वापर झालेला नाही.',
        noData: 'अजून डेटा नाही',
        usageCount: '{{count}} वेळा वापरले',
      },

      row: {
        copy: 'कॉपी करा',
        usedByBot: 'ऑटो-निगोशिएशन बॉट देखील याचा वापर करतो',
      },

      detail: {
        citedStandards: 'संदर्भित मानके',
        territoryHeading: 'प्रदेशानुसार परिणामकारकता',
        territoryRow: '{{count}} वापर · {{score}}%',
        versionHistoryHeading: 'अद्यतन इतिहास',
        versionRow: 'v{{version}} · {{editor}} · {{date}}',
        sourceNoteLabel: 'हे कुठून आले',
        usedByBotBanner: 'ही श्रेणी ऑटो-निगोशिएशन बॉटच्या ऑब्जेक्शन सिनेरिओ मॅपलाही चालवते — इथली आणि तिथली भाषा सुसंगत ठेवा.',
        goToBotConfig: 'बॉट कॉन्फिगरेशन उघडा',
        copyResponse: 'उत्तर कॉपी करा',
        editResponse: 'संपादित करा',
        responseLabel: 'उत्तराचा मजकूर',
        saveEdit: 'नवीन आवृत्ती जतन करा',
        approve: 'मान्य करा',
        archive: 'संग्रहित करा',
        restore: 'पुनर्संचयित करा',
      },

      addScript: {
        button: 'स्क्रिप्ट जोडा',
        sheetTitle: 'स्क्रिप्ट जोडा',
        sheetHint: 'नवीन स्क्रिप्ट अ‍ॅडमिनने पुनरावलोकन करून मान्य करेपर्यंत "सुचवलेली" म्हणून जतन होते.',
        categoryLabel: 'चिंतेची श्रेणी',
        responseLabel: 'मान्यताप्राप्त उत्तराचा मजकूर',
        sourceNoteLabel: 'हे कुठे दिसले?',
        sourceNoteHint: 'उदा. एखादे विशिष्ट रिप्लाय इनबॉक्स संभाषण किंवा निगोशिएशन थ्रेड — जेणेकरून हा नमुना हरवणार नाही.',
        submit: 'पुनरावलोकनासाठी सादर करा',
      },

      toast: {
        copied: 'उत्तर कॉपी झाले',
        saved: 'नवीन आवृत्ती जतन झाली',
        approved: 'स्क्रिप्ट मान्य झाली',
        archived: 'स्क्रिप्ट संग्रहित झाली',
        restored: 'स्क्रिप्ट पुनर्संचयित झाली',
        created: 'पुनरावलोकनासाठी सुचवलेली स्क्रिप्ट जोडली',
        error: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
