import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    invoiceGenerator: {
      title: 'Invoices',
      loading: 'Loading invoices',
      notFound: { title: 'Invoices not available', body: "This link doesn't match your account, or the deal no longer exists." },
      error: { title: 'Could not load invoices', body: 'Check your connection and try again.' },
      empty: { title: 'No invoices yet', body: 'An invoice is generated automatically the moment a payment stage clears.' },

      hero: {
        agreedPrice: 'Agreed price (GST-inclusive)',
        allPaid: 'All stages paid',
      },

      gstin: {
        heading: 'GSTIN',
        aiec: 'AIEC',
        customer: 'Customer',
        notSet: 'Not on file',
        add: 'Add GSTIN',
        inputLabel: 'Customer GSTIN',
        save: 'Save',
      },

      finalInvoice: {
        heading: 'Consolidated final invoice',
        body: 'Covers the full agreed price in one document, once every stage has paid.',
        notReady: 'Available once every stage has been paid.',
        generate: 'Generate final invoice',
      },

      type: {
        stage: 'Stage invoice',
        final: 'Final invoice',
        credit_note: 'Credit note',
        reissue: 'Reissued invoice',
      },

      list: {
        heading: 'Invoices',
        superseded: 'Superseded',
      },

      detail: {
        billedTo: 'Billed to',
        gstinLabel: 'GSTIN',
        issuedOn: 'Issued on',
        stageLine: '{{stage}} — payment stage',
        finalLine: 'Full deal — consolidated final invoice',
        creditNoteLine: 'Credit note against {{code}}',
        reissueLine: 'Reissued — supersedes {{code}}',
        taxableValue: 'Taxable value',
        gstAt: 'GST @ {{percent}}%',
        total: 'Total',
        supersededNote: 'This invoice has been superseded by a reissued version — kept here only for the audit trail.',
        referencesNote: 'This credit note is issued against the invoice above.',
        print: 'Print / Save as PDF',
        issueCreditNote: 'Issue credit note',
        reissue: 'Reissue this invoice',
      },

      creditNoteSheet: {
        title: 'Issue a credit note',
        hint: 'For a partial or full refund after invoicing — this creates a new, linked document rather than editing the original.',
        amountLabel: 'Amount to credit (₹, GST-inclusive)',
        reasonLabel: 'Reason',
        submit: 'Issue credit note',
      },

      reissueSheet: {
        title: 'Reissue this invoice',
        hint: "For a name or address correction discovered after issue. The amount stays the same — only the customer's details are refreshed. The original is kept, marked superseded.",
        reasonLabel: 'Reason',
        submit: 'Reissue',
      },

      toast: {
        generated: 'Final invoice generated',
        gstinSaved: 'GSTIN saved',
        creditNoted: 'Credit note issued',
        reissued: 'Invoice reissued',
        error: 'Something went wrong. Please try again.',
      },
    },
  },
  hi: {
    invoiceGenerator: {
      title: 'इनवॉइस',
      loading: 'इनवॉइस लोड हो रहे हैं',
      notFound: { title: 'इनवॉइस उपलब्ध नहीं हैं', body: 'यह लिंक आपके खाते से मेल नहीं खाता, या यह डील अब मौजूद नहीं है।' },
      error: { title: 'इनवॉइस लोड नहीं हो सके', body: 'अपना कनेक्शन जांचें और फिर से कोशिश करें।' },
      empty: { title: 'अभी कोई इनवॉइस नहीं', body: 'भुगतान चरण पूरा होते ही इनवॉइस अपने आप बन जाता है।' },

      hero: {
        agreedPrice: 'सहमत मूल्य (GST सहित)',
        allPaid: 'सभी चरण भुगतान हो चुके',
      },

      gstin: {
        heading: 'GSTIN',
        aiec: 'AIEC',
        customer: 'ग्राहक',
        notSet: 'दर्ज नहीं है',
        add: 'GSTIN जोड़ें',
        inputLabel: 'ग्राहक GSTIN',
        save: 'सेव करें',
      },

      finalInvoice: {
        heading: 'समेकित अंतिम इनवॉइस',
        body: 'हर चरण का भुगतान हो जाने के बाद पूरे सहमत मूल्य को एक ही दस्तावेज़ में कवर करता है।',
        notReady: 'यह तभी उपलब्ध होगा जब हर चरण का भुगतान हो चुका हो।',
        generate: 'अंतिम इनवॉइस बनाएं',
      },

      type: {
        stage: 'चरण इनवॉइस',
        final: 'अंतिम इनवॉइस',
        credit_note: 'क्रेडिट नोट',
        reissue: 'पुनः जारी इनवॉइस',
      },

      list: {
        heading: 'इनवॉइस',
        superseded: 'बदल दिया गया',
      },

      detail: {
        billedTo: 'बिल किसके नाम',
        gstinLabel: 'GSTIN',
        issuedOn: 'जारी किया गया',
        stageLine: '{{stage}} — भुगतान चरण',
        finalLine: 'पूरी डील — समेकित अंतिम इनवॉइस',
        creditNoteLine: '{{code}} के विरुद्ध क्रेडिट नोट',
        reissueLine: 'पुनः जारी — {{code}} की जगह लेता है',
        taxableValue: 'कर योग्य मूल्य',
        gstAt: '{{percent}}% पर GST',
        total: 'कुल',
        supersededNote: 'इस इनवॉइस की जगह एक पुनः जारी संस्करण ने ले ली है — यह केवल ऑडिट रिकॉर्ड के लिए रखा गया है।',
        referencesNote: 'यह क्रेडिट नोट ऊपर दिए गए इनवॉइस के विरुद्ध जारी किया गया है।',
        print: 'प्रिंट करें / PDF के रूप में सेव करें',
        issueCreditNote: 'क्रेडिट नोट जारी करें',
        reissue: 'यह इनवॉइस पुनः जारी करें',
      },

      creditNoteSheet: {
        title: 'क्रेडिट नोट जारी करें',
        hint: 'इनवॉइस के बाद आंशिक या पूर्ण रिफंड के लिए — यह मूल दस्तावेज़ को बदलने के बजाय एक नया, जुड़ा हुआ दस्तावेज़ बनाता है।',
        amountLabel: 'क्रेडिट करने की राशि (₹, GST सहित)',
        reasonLabel: 'कारण',
        submit: 'क्रेडिट नोट जारी करें',
      },

      reissueSheet: {
        title: 'यह इनवॉइस पुनः जारी करें',
        hint: 'जारी होने के बाद पता चली नाम या पते की गलती के लिए। राशि वही रहती है — केवल ग्राहक का विवरण अपडेट होता है। मूल इनवॉइस सुरक्षित रहता है, बस बदला हुआ चिह्नित किया जाता है।',
        reasonLabel: 'कारण',
        submit: 'पुनः जारी करें',
      },

      toast: {
        generated: 'अंतिम इनवॉइस बन गया',
        gstinSaved: 'GSTIN सेव हो गया',
        creditNoted: 'क्रेडिट नोट जारी हो गया',
        reissued: 'इनवॉइस पुनः जारी हो गया',
        error: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
      },
    },
  },
  mr: {
    invoiceGenerator: {
      title: 'इनव्हॉइस',
      loading: 'इनव्हॉइस लोड होत आहेत',
      notFound: { title: 'इनव्हॉइस उपलब्ध नाहीत', body: 'ही लिंक तुमच्या खात्याशी जुळत नाही, किंवा ही डील आता अस्तित्वात नाही.' },
      error: { title: 'इनव्हॉइस लोड होऊ शकले नाहीत', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'अजून कोणतेही इनव्हॉइस नाही', body: 'पेमेंट टप्पा पूर्ण होताच इनव्हॉइस आपोआप तयार होते.' },

      hero: {
        agreedPrice: 'मान्य किंमत (GST सह)',
        allPaid: 'सर्व टप्प्यांचे पेमेंट झाले',
      },

      gstin: {
        heading: 'GSTIN',
        aiec: 'AIEC',
        customer: 'ग्राहक',
        notSet: 'नोंदवलेले नाही',
        add: 'GSTIN जोडा',
        inputLabel: 'ग्राहक GSTIN',
        save: 'सेव्ह करा',
      },

      finalInvoice: {
        heading: 'एकत्रित अंतिम इनव्हॉइस',
        body: 'प्रत्येक टप्प्याचे पेमेंट झाल्यावर संपूर्ण मान्य किंमत एकाच दस्तऐवजात कव्हर करते.',
        notReady: 'हे फक्त प्रत्येक टप्प्याचे पेमेंट झाल्यावरच उपलब्ध होईल.',
        generate: 'अंतिम इनव्हॉइस तयार करा',
      },

      type: {
        stage: 'टप्पा इनव्हॉइस',
        final: 'अंतिम इनव्हॉइस',
        credit_note: 'क्रेडिट नोट',
        reissue: 'पुन्हा जारी केलेले इनव्हॉइस',
      },

      list: {
        heading: 'इनव्हॉइस',
        superseded: 'बदलले गेले',
      },

      detail: {
        billedTo: 'बिल कोणाच्या नावे',
        gstinLabel: 'GSTIN',
        issuedOn: 'जारी केले',
        stageLine: '{{stage}} — पेमेंट टप्पा',
        finalLine: 'संपूर्ण डील — एकत्रित अंतिम इनव्हॉइस',
        creditNoteLine: '{{code}} विरुद्ध क्रेडिट नोट',
        reissueLine: 'पुन्हा जारी — {{code}} ची जागा घेते',
        taxableValue: 'करपात्र मूल्य',
        gstAt: '{{percent}}% वर GST',
        total: 'एकूण',
        supersededNote: 'या इनव्हॉइसची जागा पुन्हा जारी केलेल्या आवृत्तीने घेतली आहे — हे फक्त ऑडिट नोंदीसाठी ठेवले आहे.',
        referencesNote: 'ही क्रेडिट नोट वरील इनव्हॉइस विरुद्ध जारी केली आहे.',
        print: 'प्रिंट करा / PDF म्हणून सेव्ह करा',
        issueCreditNote: 'क्रेडिट नोट जारी करा',
        reissue: 'हे इनव्हॉइस पुन्हा जारी करा',
      },

      creditNoteSheet: {
        title: 'क्रेडिट नोट जारी करा',
        hint: 'इनव्हॉइसनंतर अंशतः किंवा पूर्ण परताव्यासाठी — हे मूळ दस्तऐवज बदलण्याऐवजी नवीन, जोडलेले दस्तऐवज तयार करते.',
        amountLabel: 'क्रेडिट करायची रक्कम (₹, GST सह)',
        reasonLabel: 'कारण',
        submit: 'क्रेडिट नोट जारी करा',
      },

      reissueSheet: {
        title: 'हे इनव्हॉइस पुन्हा जारी करा',
        hint: 'जारी झाल्यानंतर लक्षात आलेल्या नाव किंवा पत्ता चुकीसाठी. रक्कम तशीच राहते — फक्त ग्राहकाचे तपशील अद्ययावत होतात. मूळ इनव्हॉइस जपले जाते, फक्त बदलले म्हणून चिन्हांकित केले जाते.',
        reasonLabel: 'कारण',
        submit: 'पुन्हा जारी करा',
      },

      toast: {
        generated: 'अंतिम इनव्हॉइस तयार झाले',
        gstinSaved: 'GSTIN सेव्ह झाले',
        creditNoted: 'क्रेडिट नोट जारी झाली',
        reissued: 'इनव्हॉइस पुन्हा जारी झाले',
        error: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
