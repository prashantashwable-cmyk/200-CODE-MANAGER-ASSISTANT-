import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    pendingScreen: {
      name: 'Name',
      phone: 'Phone',
      appliedAs: 'Applied as',
    },
    modulePending: {
      title: '{{role}} home',
      signedInAs: 'Signed in as {{name}} · {{mode}}',
      modeDemo: 'Demo Mode',
      modeReal: 'Real account',
      body: 'This role\'s full experience is Module {{number}} of the 20-module build. The prompt files for that module are not in this folder yet — only Modules 1 to 4 (screens 001-040) are. Rather than show you a dashboard that is not really wired to anything, this screen says so plainly.',
      progressTitle: 'Where this build is',
      checkTitle: 'What you can check right here',
      checkBody:
        'Switch language and appearance from Settings and watch this screen change instantly — including the Devanagari font pairing in Hindi and Marathi. That confirms the foundation works for this role, not just for Admin and Surveyor.',
      step: {
        foundation: 'Foundation',
        foundationMeta: 'Shell, roles, data model, 7 themes, 3 languages',
        built: 'Modules 1-4 built',
        builtMeta: 'Screens 001-040 — onboarding, command centre, analytics, lead capture',
        thisModule: 'Module {{number}} — this role',
        thisModuleMeta: 'Prompt files not present in this folder',
        remaining: 'Modules 5-20',
        remainingMeta: 'Screens 041-200, still to be written',
      },
    },
  },
  hi: {
    pendingScreen: {
      name: 'नाम',
      phone: 'फ़ोन',
      appliedAs: 'किस रूप में आवेदन किया',
    },
    modulePending: {
      title: '{{role}} होम',
      signedInAs: '{{name}} के रूप में साइन इन · {{mode}}',
      modeDemo: 'डेमो मोड',
      modeReal: 'असली खाता',
      body: 'इस भूमिका का पूरा अनुभव 20 मॉड्यूल वाले इस निर्माण का मॉड्यूल {{number}} है। उस मॉड्यूल की प्रॉम्प्ट फ़ाइलें अभी इस फ़ोल्डर में नहीं हैं — सिर्फ़ मॉड्यूल 1 से 4 (स्क्रीन 001-040) मौजूद हैं। ऐसा डैशबोर्ड दिखाने के बजाय जो असल में किसी चीज़ से जुड़ा नहीं है, यह स्क्रीन साफ़-साफ़ यही बताती है।',
      progressTitle: 'यह निर्माण कहाँ तक पहुँचा है',
      checkTitle: 'आप यहीं क्या जाँच सकते हैं',
      checkBody:
        'सेटिंग से भाषा और रंग-रूप बदलिए और देखिए यह स्क्रीन तुरंत बदल जाती है — हिंदी और मराठी में देवनागरी फ़ॉन्ट जोड़ी समेत। इससे पक्का होता है कि नींव सिर्फ़ प्रशासक और सर्वेक्षक के लिए नहीं, इस भूमिका के लिए भी काम करती है।',
      step: {
        foundation: 'नींव',
        foundationMeta: 'शेल, भूमिकाएँ, डेटा मॉडल, 7 थीम, 3 भाषाएँ',
        built: 'मॉड्यूल 1-4 बन गए',
        builtMeta: 'स्क्रीन 001-040 — ऑनबोर्डिंग, कमांड सेंटर, विश्लेषण, लीड कैप्चर',
        thisModule: 'मॉड्यूल {{number}} — यह भूमिका',
        thisModuleMeta: 'प्रॉम्प्ट फ़ाइलें इस फ़ोल्डर में नहीं हैं',
        remaining: 'मॉड्यूल 5-20',
        remainingMeta: 'स्क्रीन 041-200, अभी लिखी जानी हैं',
      },
    },
  },
  mr: {
    pendingScreen: {
      name: 'नाव',
      phone: 'फोन',
      appliedAs: 'कोणत्या भूमिकेसाठी अर्ज',
    },
    modulePending: {
      title: '{{role}} होम',
      signedInAs: '{{name}} म्हणून साइन इन · {{mode}}',
      modeDemo: 'डेमो मोड',
      modeReal: 'खरे खाते',
      body: 'या भूमिकेचा संपूर्ण अनुभव म्हणजे २० मॉड्यूलच्या या बांधणीतील मॉड्यूल {{number}}. त्या मॉड्यूलच्या प्रॉम्प्ट फाइल्स अजून या फोल्डरमध्ये नाहीत — फक्त मॉड्यूल १ ते ४ (स्क्रीन 001-040) आहेत. प्रत्यक्षात कशाशीही जोडलेले नसलेले डॅशबोर्ड दाखवण्याऐवजी ही स्क्रीन ते स्पष्टपणे सांगते.',
      progressTitle: 'ही बांधणी कुठवर आली आहे',
      checkTitle: 'तुम्ही इथेच काय तपासू शकता',
      checkBody:
        'सेटिंगमधून भाषा आणि रंगरूप बदला आणि ही स्क्रीन लगेच बदलताना पहा — हिंदी आणि मराठीतील देवनागरी फॉन्ट जोडीसह. यावरून पाया फक्त प्रशासक आणि सर्वेक्षकासाठी नव्हे, तर या भूमिकेसाठीही चालतो हे पक्के होते.',
      step: {
        foundation: 'पाया',
        foundationMeta: 'शेल, भूमिका, डेटा मॉडेल, ७ थीम, ३ भाषा',
        built: 'मॉड्यूल १-४ पूर्ण',
        builtMeta: 'स्क्रीन 001-040 — ऑनबोर्डिंग, कमांड सेंटर, विश्लेषण, लीड कॅप्चर',
        thisModule: 'मॉड्यूल {{number}} — ही भूमिका',
        thisModuleMeta: 'प्रॉम्प्ट फाइल्स या फोल्डरमध्ये नाहीत',
        remaining: 'मॉड्यूल ५-२०',
        remainingMeta: 'स्क्रीन 041-200, अजून लिहायच्या आहेत',
      },
    },
  },
};

export default translations;
