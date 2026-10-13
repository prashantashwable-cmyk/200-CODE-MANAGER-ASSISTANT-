import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    pricingConfig: {
      title: 'Pricing Rules & Margin Configuration',
      subtitle: 'The one governed root every quotation price is calculated from.',
      loading: 'Loading pricing configuration',
      error: { title: 'Could not load pricing configuration', body: 'Check your connection and try again.' },

      governanceNote: "Changes here apply to quotes generated from this point forward — an already-sent quote keeps its own locked-in numbers.",

      section: {
        basePricing: 'Base pricing by drive type',
        marginFloor: 'Minimum margin floor',
        gst: 'GST rate',
        amc: 'AMC pricing tiers',
      },

      basePricing: {
        sheetTitle: '{{driveType}} pricing',
        baseLabel: 'Base price',
        perFloorLabel: '{{pct}} per additional floor',
        perFloorLabelInput: 'Per-floor increment (%)',
        perFloorHint: 'Typically 10-25% depending on drive type.',
        perFloorOutOfRange: 'Outside the typical 10-25% market range — double-check before saving.',
        save: 'Save base pricing',
      },

      marginFloor: {
        sheetTitle: 'Minimum margin floor',
        label: 'Margin floor (%)',
        riskWarning: 'This is the guardrail the Cost Breakdown screen enforces on every quote. Lowering it directly increases the risk of a loss-making deal.',
        mustBePositive: 'The margin floor must be greater than zero.',
        loweringConfirm: 'I understand this lowers the guaranteed profit floor on every future quote.',
        save: 'Save margin floor',
      },

      gst: {
        currentLabel: 'Current rate',
        scheduledLabel: 'Scheduled: {{pct}} from {{date}}',
        appliedLabel: 'Applied: {{pct}} from {{date}}',
        editSheetTitle: 'Update GST rate',
        externalNote: 'GST is set by the government, not a business lever — this should always match the officially notified rate.',
        newRateLabel: 'New rate (%)',
        effectiveDateLabel: 'Effective from (optional)',
        effectiveDateHint: 'Leave blank to apply immediately. A future date schedules the change to apply automatically on that day.',
        cancelScheduled: 'Cancel',
        save: 'Save GST rate',
      },

      amc: {
        sheetTitle: '{{tier}} AMC tier',
        priceLabel: 'Annual price',
        responseLabel: '{{hours}}h response time',
        responseHoursLabel: 'Response time (hours)',
        save: 'Save AMC tier',
      },

      amcTierLabel: { basic: 'Basic', standard: 'Standard', comprehensive: 'Comprehensive' },

      toast: {
        saved: 'Saved',
        scheduled: 'Change scheduled',
        cancelled: 'Scheduled change cancelled',
        error: 'Something went wrong — try again',
      },
    },
  },

  hi: {
    pricingConfig: {
      title: 'मूल्य नियम और मार्जिन कॉन्फ़िगरेशन',
      subtitle: 'वह एकमात्र नियंत्रित आधार जिससे हर कोटेशन की कीमत निकाली जाती है।',
      loading: 'मूल्य कॉन्फ़िगरेशन लोड हो रहा है',
      error: { title: 'मूल्य कॉन्फ़िगरेशन लोड नहीं हो सका', body: 'अपना कनेक्शन जांचें और फिर से प्रयास करें।' },

      governanceNote: 'यहां किए गए बदलाव अब से बनने वाले कोटेशन पर लागू होते हैं — पहले से भेजा गया कोटेशन अपनी तय संख्याएं बनाए रखता है।',

      section: {
        basePricing: 'ड्राइव प्रकार अनुसार आधार मूल्य',
        marginFloor: 'न्यूनतम मार्जिन सीमा',
        gst: 'जीएसटी दर',
        amc: 'एएमसी मूल्य स्तर',
      },

      basePricing: {
        sheetTitle: '{{driveType}} मूल्य',
        baseLabel: 'आधार मूल्य',
        perFloorLabel: 'प्रत्येक अतिरिक्त मंज़िल पर {{pct}}',
        perFloorLabelInput: 'प्रति-मंज़िल वृद्धि (%)',
        perFloorHint: 'ड्राइव प्रकार के अनुसार आमतौर पर 10-25%।',
        perFloorOutOfRange: 'सामान्य 10-25% बाज़ार सीमा से बाहर — सेव करने से पहले दोबारा जांचें।',
        save: 'आधार मूल्य सेव करें',
      },

      marginFloor: {
        sheetTitle: 'न्यूनतम मार्जिन सीमा',
        label: 'मार्जिन सीमा (%)',
        riskWarning: 'यह वही सुरक्षा सीमा है जिसे कॉस्ट ब्रेकडाउन स्क्रीन हर कोटेशन पर लागू करती है। इसे घटाने से नुकसान वाले सौदे का जोखिम सीधे बढ़ जाता है।',
        mustBePositive: 'मार्जिन सीमा शून्य से अधिक होनी चाहिए।',
        loweringConfirm: 'मैं समझता/समझती हूं कि इससे हर भविष्य के कोटेशन पर गारंटीशुदा लाभ सीमा घट जाएगी।',
        save: 'मार्जिन सीमा सेव करें',
      },

      gst: {
        currentLabel: 'मौजूदा दर',
        scheduledLabel: '{{date}} से {{pct}} शेड्यूल किया गया',
        appliedLabel: '{{date}} से {{pct}} लागू',
        editSheetTitle: 'जीएसटी दर अपडेट करें',
        externalNote: 'जीएसटी सरकार द्वारा तय की जाती है, यह कोई व्यावसायिक निर्णय नहीं है — यह हमेशा आधिकारिक रूप से अधिसूचित दर से मेल खानी चाहिए।',
        newRateLabel: 'नई दर (%)',
        effectiveDateLabel: 'इस तारीख से लागू (वैकल्पिक)',
        effectiveDateHint: 'तुरंत लागू करने के लिए खाली छोड़ें। भविष्य की तारीख उस दिन बदलाव अपने आप लागू कर देगी।',
        cancelScheduled: 'रद्द करें',
        save: 'जीएसटी दर सेव करें',
      },

      amc: {
        sheetTitle: '{{tier}} एएमसी स्तर',
        priceLabel: 'वार्षिक मूल्य',
        responseLabel: '{{hours}} घंटे प्रतिक्रिया समय',
        responseHoursLabel: 'प्रतिक्रिया समय (घंटे)',
        save: 'एएमसी स्तर सेव करें',
      },

      amcTierLabel: { basic: 'बेसिक', standard: 'स्टैंडर्ड', comprehensive: 'कॉम्प्रिहेंसिव' },

      toast: {
        saved: 'सेव हो गया',
        scheduled: 'बदलाव शेड्यूल हो गया',
        cancelled: 'शेड्यूल किया गया बदलाव रद्द किया गया',
        error: 'कुछ गलत हो गया — फिर से प्रयास करें',
      },
    },
  },

  mr: {
    pricingConfig: {
      title: 'किंमत नियम आणि मार्जिन कॉन्फिगरेशन',
      subtitle: 'प्रत्येक कोटेशनची किंमत ज्या एकमेव नियंत्रित आधारावरून काढली जाते.',
      loading: 'किंमत कॉन्फिगरेशन लोड होत आहे',
      error: { title: 'किंमत कॉन्फिगरेशन लोड होऊ शकले नाही', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },

      governanceNote: 'इथले बदल यापुढे तयार होणाऱ्या कोटेशनला लागू होतात — आधीच पाठवलेले कोटेशन स्वतःचे निश्चित आकडे कायम ठेवते.',

      section: {
        basePricing: 'ड्राइव्ह प्रकारानुसार मूळ किंमत',
        marginFloor: 'किमान मार्जिन मर्यादा',
        gst: 'जीएसटी दर',
        amc: 'एएमसी किंमत स्तर',
      },

      basePricing: {
        sheetTitle: '{{driveType}} किंमत',
        baseLabel: 'मूळ किंमत',
        perFloorLabel: 'प्रत्येक अतिरिक्त मजल्यासाठी {{pct}}',
        perFloorLabelInput: 'प्रति-मजला वाढ (%)',
        perFloorHint: 'ड्राइव्ह प्रकारानुसार साधारणपणे 10-25%.',
        perFloorOutOfRange: 'सर्वसाधारण 10-25% बाजार मर्यादेच्या बाहेर — सेव्ह करण्यापूर्वी पुन्हा तपासा.',
        save: 'मूळ किंमत सेव्ह करा',
      },

      marginFloor: {
        sheetTitle: 'किमान मार्जिन मर्यादा',
        label: 'मार्जिन मर्यादा (%)',
        riskWarning: 'ही तीच सुरक्षा मर्यादा आहे जी कॉस्ट ब्रेकडाउन स्क्रीन प्रत्येक कोटेशनवर लागू करते. ती कमी केल्यास तोट्याच्या व्यवहाराचा धोका थेट वाढतो.',
        mustBePositive: 'मार्जिन मर्यादा शून्यापेक्षा जास्त असणे आवश्यक आहे.',
        loweringConfirm: 'मला समजते की यामुळे यापुढील प्रत्येक कोटेशनवरील हमी नफा मर्यादा कमी होईल.',
        save: 'मार्जिन मर्यादा सेव्ह करा',
      },

      gst: {
        currentLabel: 'सध्याचा दर',
        scheduledLabel: '{{date}} पासून {{pct}} शेड्यूल केले',
        appliedLabel: '{{date}} पासून {{pct}} लागू',
        editSheetTitle: 'जीएसटी दर अद्ययावत करा',
        externalNote: 'जीएसटी सरकारद्वारे ठरवला जातो, हा व्यावसायिक निर्णय नाही — हा नेहमी अधिकृतपणे अधिसूचित दराशी जुळला पाहिजे.',
        newRateLabel: 'नवीन दर (%)',
        effectiveDateLabel: 'या तारखेपासून लागू (ऐच्छिक)',
        effectiveDateHint: 'लगेच लागू करण्यासाठी रिकामे ठेवा. भविष्यातील तारीख त्या दिवशी बदल आपोआप लागू करेल.',
        cancelScheduled: 'रद्द करा',
        save: 'जीएसटी दर सेव्ह करा',
      },

      amc: {
        sheetTitle: '{{tier}} एएमसी स्तर',
        priceLabel: 'वार्षिक किंमत',
        responseLabel: '{{hours}} तास प्रतिसाद वेळ',
        responseHoursLabel: 'प्रतिसाद वेळ (तास)',
        save: 'एएमसी स्तर सेव्ह करा',
      },

      amcTierLabel: { basic: 'बेसिक', standard: 'स्टँडर्ड', comprehensive: 'कॉम्प्रिहेन्सिव्ह' },

      toast: {
        saved: 'सेव्ह झाले',
        scheduled: 'बदल शेड्यूल झाला',
        cancelled: 'शेड्यूल केलेला बदल रद्द केला',
        error: 'काहीतरी चुकले — पुन्हा प्रयत्न करा',
      },
    },
  },
};

export default translations;
