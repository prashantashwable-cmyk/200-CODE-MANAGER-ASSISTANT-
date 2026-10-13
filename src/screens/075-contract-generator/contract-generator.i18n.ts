import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    contractGenerator: {
      title: 'Digital Contract Generator',
      loading: 'Loading contract',
      error: { title: 'Could not load the contract', body: 'Check your connection and try again.' },

      notConfirmed: {
        title: 'Not ready to generate yet',
        body: 'Both internal staff and the customer must confirm the deal terms first.',
        goToTerms: 'Go to Deal Terms Finalization',
      },

      readyToGenerate: {
        title: 'Terms confirmed — ready to generate',
        body: 'The contract will be built from the confirmed deal terms, AIEC’s standard terms, and the applicable state Lift Act clause.',
      },

      clause: {
        scope: 'Scope of work',
        price_and_payment: 'Price and payment',
        installation_and_liability: 'Installation and liability',
        warranty_and_amc: 'Warranty and AMC',
        state_compliance: 'Regulatory compliance',
      },

      legalTextLabel: 'Full legal text',
      fallbackBanner: 'A state-specific Lift Act clause set has not yet been configured for this location — the national default was used, and this has been flagged for Admin.',
      versionLabel: 'Version {{n}}',
      generatedOn: 'Generated {{date}}',

      priorVersions: {
        heading: 'Prior versions',
        supersededLabel: 'Superseded',
      },

      addenda: {
        heading: 'Addenda',
        empty: 'No custom addenda attached.',
        addButton: 'Add a custom addendum',
        sheetTitle: 'Add a custom addendum',
        sheetHint: 'Attached alongside the generated contract — the standard clauses above stay unchanged.',
        noteLabel: 'Addendum text',
        submit: 'Add addendum',
        addedBy: 'Added {{date}}',
      },

      actions: {
        generate: 'Generate contract',
        regenerate: 'Regenerate',
        proceedToSignature: 'Proceed to e-signature',
      },

      toast: {
        generated: 'Contract generated',
        regenerated: 'A new version was generated, superseding the prior one',
        addendumAdded: 'Addendum added',
        error: 'Something went wrong. Please try again.',
      },
    },
  },
  hi: {
    contractGenerator: {
      title: 'डिजिटल अनुबंध जेनरेटर',
      loading: 'अनुबंध लोड हो रहा है',
      error: { title: 'अनुबंध लोड नहीं हो सका', body: 'अपना कनेक्शन जांचें और फिर से कोशिश करें।' },

      notConfirmed: {
        title: 'अभी तैयार करने के लिए तैयार नहीं',
        body: 'पहले आंतरिक स्टाफ़ और ग्राहक, दोनों को डील की शर्तों की पुष्टि करनी होगी।',
        goToTerms: 'डील शर्तें अंतिम रूप पर जाएं',
      },

      readyToGenerate: {
        title: 'शर्तों की पुष्टि हो गई — तैयार करने के लिए तैयार',
        body: 'यह अनुबंध पुष्टि की गई डील शर्तों, AIEC की मानक शर्तों, और लागू राज्य लिफ्ट अधिनियम के प्रावधान से बनेगा।',
      },

      clause: {
        scope: 'कार्य का दायरा',
        price_and_payment: 'कीमत और भुगतान',
        installation_and_liability: 'इंस्टॉलेशन और दायित्व',
        warranty_and_amc: 'वारंटी और एएमसी',
        state_compliance: 'नियामक अनुपालन',
      },

      legalTextLabel: 'पूरा कानूनी पाठ',
      fallbackBanner: 'इस स्थान के लिए राज्य-विशिष्ट लिफ्ट अधिनियम प्रावधान अभी तय नहीं है — राष्ट्रीय डिफ़ॉल्ट का उपयोग किया गया है, और इसे एडमिन के लिए फ़्लैग किया गया है।',
      versionLabel: 'वर्शन {{n}}',
      generatedOn: '{{date}} को तैयार किया गया',

      priorVersions: {
        heading: 'पुराने वर्शन',
        supersededLabel: 'बदल दिया गया',
      },

      addenda: {
        heading: 'परिशिष्ट',
        empty: 'कोई कस्टम परिशिष्ट संलग्न नहीं है।',
        addButton: 'एक कस्टम परिशिष्ट जोड़ें',
        sheetTitle: 'एक कस्टम परिशिष्ट जोड़ें',
        sheetHint: 'तैयार अनुबंध के साथ संलग्न किया जाता है — ऊपर की मानक शर्तें अपरिवर्तित रहती हैं।',
        noteLabel: 'परिशिष्ट का पाठ',
        submit: 'परिशिष्ट जोड़ें',
        addedBy: '{{date}} को जोड़ा गया',
      },

      actions: {
        generate: 'अनुबंध तैयार करें',
        regenerate: 'फिर से तैयार करें',
        proceedToSignature: 'ई-हस्ताक्षर पर आगे बढ़ें',
      },

      toast: {
        generated: 'अनुबंध तैयार हो गया',
        regenerated: 'एक नया वर्शन तैयार हुआ, जिसने पुराने वर्शन की जगह ले ली',
        addendumAdded: 'परिशिष्ट जोड़ा गया',
        error: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
      },
    },
  },
  mr: {
    contractGenerator: {
      title: 'डिजिटल करार जनरेटर',
      loading: 'करार लोड होत आहे',
      error: { title: 'करार लोड होऊ शकला नाही', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },

      notConfirmed: {
        title: 'अजून तयार करण्यासाठी सज्ज नाही',
        body: 'आधी अंतर्गत स्टाफ आणि ग्राहक या दोघांनीही डीलच्या अटींची पुष्टी करणे आवश्यक आहे.',
        goToTerms: 'डील अटी अंतिम करण्याकडे जा',
      },

      readyToGenerate: {
        title: 'अटींची पुष्टी झाली — तयार करण्यासाठी सज्ज',
        body: 'हा करार पुष्टी झालेल्या डील अटी, AIEC च्या मानक अटी आणि लागू राज्य लिफ्ट कायद्याच्या तरतुदीतून तयार होईल.',
      },

      clause: {
        scope: 'कामाची व्याप्ती',
        price_and_payment: 'किंमत आणि पेमेंट',
        installation_and_liability: 'इन्स्टॉलेशन आणि जबाबदारी',
        warranty_and_amc: 'वॉरंटी आणि एएमसी',
        state_compliance: 'नियामक अनुपालन',
      },

      legalTextLabel: 'संपूर्ण कायदेशीर मजकूर',
      fallbackBanner: 'या ठिकाणासाठी राज्य-विशिष्ट लिफ्ट कायदा तरतूद अजून सेट केलेली नाही — राष्ट्रीय डीफॉल्ट वापरला गेला आहे, आणि हे अ‍ॅडमिनसाठी फ्लॅग केले आहे.',
      versionLabel: 'आवृत्ती {{n}}',
      generatedOn: '{{date}} रोजी तयार केले',

      priorVersions: {
        heading: 'आधीच्या आवृत्त्या',
        supersededLabel: 'बदलले गेले',
      },

      addenda: {
        heading: 'परिशिष्टे',
        empty: 'कोणतेही कस्टम परिशिष्ट जोडलेले नाही.',
        addButton: 'एक कस्टम परिशिष्ट जोडा',
        sheetTitle: 'एक कस्टम परिशिष्ट जोडा',
        sheetHint: 'तयार केलेल्या करारासोबत जोडले जाते — वरील मानक अटी बदलत नाहीत.',
        noteLabel: 'परिशिष्टाचा मजकूर',
        submit: 'परिशिष्ट जोडा',
        addedBy: '{{date}} रोजी जोडले',
      },

      actions: {
        generate: 'करार तयार करा',
        regenerate: 'पुन्हा तयार करा',
        proceedToSignature: 'ई-स्वाक्षरीकडे पुढे जा',
      },

      toast: {
        generated: 'करार तयार झाला',
        regenerated: 'नवीन आवृत्ती तयार झाली, आधीच्या आवृत्तीची जागा घेतली',
        addendumAdded: 'परिशिष्ट जोडले',
        error: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
