import type { ScreenTranslations } from '@/i18n/types';

/**
 * This screen owns the installation SOP step names (`job.step.*`) because it is
 * the first screen to render them. They are referenced by `JobStep.labelKey`
 * on every job record, so any other screen showing SOP progress reuses these.
 */
const translations: ScreenTranslations = {
  en: {
    job: {
      step: {
        siteReadiness: 'Site readiness check',
        materialsReceived: 'Materials received and counted',
        guideRails: 'Guide rails aligned',
        machineMount: 'Machine mounted and secured',
        carAssembly: 'Car assembled',
        doorOperator: 'Door operator fitted',
        wiringControl: 'Wiring and control panel',
        safetyGearTest: 'Safety gear test',
        loadTest: 'Load test',
        finishHandover: 'Finishing and handover check',
      },
    },
    trackTechnician: {
      title: 'Technician detail',
      loading: 'Loading the job',
      mapLabel: 'Job site and the technician’s current position',
      safety: 'Safety checks',
      issues: 'Field issues',
      escalate: 'Escalate this',
      openTimeline: 'Open the installation timeline',
      oneSourceNote:
        'This is the same step record the technician is working from — not a copy. What you see here is what they see.',
      stat: {
        checkIn: 'Checked in',
        checkOut: 'Checked out',
        hoursOnSite: 'On site',
        stepProgress: 'SOP steps',
        evidence: 'Photos attached',
        stillOnSite: 'Still on site',
      },
      sop: {
        heading: 'Installation steps',
        evidenceRequired: 'Photo proof required',
        evidenceCount: '{{count}} photos attached',
        noEvidence: 'No proof attached yet — this step cannot be signed off',
      },
      crew: {
        heading: 'Everyone on this site',
        checkedIn: 'On site',
        notCheckedIn: 'Not on site',
        away: '{{metres}} m from the site',
      },
      evidence: {
        heading: 'Evidence uploaded today',
        empty: 'Nothing has been photographed on this job yet.',
        note: 'Thumbnails are placeholders — image storage is not connected in this build.',
      },
      anomaly: {
        heading: 'Needs your attention',
        unscheduledCheckIn:
          'Checked in at a site with no visit scheduled for today. Either the schedule is wrong or someone is at the wrong address.',
        checkInOutOfRange:
          'GPS puts this technician outside the site boundary, so this check-in cannot be trusted as proof of attendance.',
        leftDuringCriticalStep:
          'They have moved away from the site while a safety-critical step is still open. Confirm nobody is working on a partly-tested lift.',
        checkoutIncomplete:
          'This job was checked out with SOP steps still unfinished. It has not been marked complete — it is waiting on your review.',
        blockedStepNoEvidence:
          'A safety-critical step is waiting on photo proof. It cannot be signed off until evidence is attached.',
        visitUnconfirmed: 'Still checked in from an earlier day. Their time on site is not counted until they say when they left. They have been asked.',
        signalLost: 'No location signal for {{context}} minutes while the job is still running.',
      },
      notFound: {
        title: 'Technician not found',
        body: 'No technician matches this link. They may have been removed, or the link may be out of date.',
      },
      noJob: {
        title: 'No installation running',
        body: 'This technician has no active job right now. When one is assigned and started, it will appear here live.',
      },
      error: {
        title: 'Could not load this job',
        body: 'We could not reach the installation data. Check your connection and try again.',
      },
    },
  },

  hi: {
    job: {
      step: {
        siteReadiness: 'साइट तैयार है या नहीं, जाँच',
        materialsReceived: 'सामान मिला और गिना गया',
        guideRails: 'गाइड रेल सीध में',
        machineMount: 'मशीन लगी और कसी गई',
        carAssembly: 'केबिन जोड़ा गया',
        doorOperator: 'दरवाज़े का ऑपरेटर लगा',
        wiringControl: 'वायरिंग और कंट्रोल पैनल',
        safetyGearTest: 'सुरक्षा गियर की जाँच',
        loadTest: 'भार परीक्षण',
        finishHandover: 'फ़िनिशिंग और हैंडओवर जाँच',
      },
    },
    trackTechnician: {
      title: 'तकनीशियन विवरण',
      loading: 'काम लोड हो रहा है',
      mapLabel: 'काम की साइट और तकनीशियन की मौजूदा जगह',
      safety: 'सुरक्षा जाँचें',
      issues: 'फ़ील्ड की समस्याएँ',
      escalate: 'इसे आगे बढ़ाएँ',
      openTimeline: 'इंस्टॉलेशन टाइमलाइन खोलें',
      oneSourceNote:
        'यह वही चरण-रिकॉर्ड है जिस पर तकनीशियन काम कर रहा है — इसकी नक़ल नहीं। जो आपको दिख रहा है, वही उसे भी दिखता है।',
      stat: {
        checkIn: 'चेक-इन',
        checkOut: 'चेक-आउट',
        hoursOnSite: 'साइट पर',
        stepProgress: 'SOP चरण',
        evidence: 'लगी फ़ोटो',
        stillOnSite: 'अभी साइट पर ही',
      },
      sop: {
        heading: 'इंस्टॉलेशन के चरण',
        evidenceRequired: 'फ़ोटो सबूत ज़रूरी',
        evidenceCount: '{{count}} फ़ोटो लगी',
        noEvidence: 'अभी कोई सबूत नहीं लगा — यह चरण पूरा नहीं माना जा सकता',
      },
      crew: {
        heading: 'इस साइट पर सब लोग',
        checkedIn: 'साइट पर',
        notCheckedIn: 'साइट पर नहीं',
        away: 'साइट से {{metres}} मीटर दूर',
      },
      evidence: {
        heading: 'आज अपलोड हुए सबूत',
        empty: 'इस काम में अभी तक कोई फ़ोटो नहीं ली गई।',
        note: 'ये थंबनेल सिर्फ़ जगह भरने के लिए हैं — इस बिल्ड में इमेज स्टोरेज जुड़ा नहीं है।',
      },
      anomaly: {
        heading: 'आपके ध्यान की ज़रूरत',
        unscheduledCheckIn:
          'ऐसी साइट पर चेक-इन हुआ जहाँ आज कोई विज़िट तय नहीं थी। या तो शेड्यूल ग़लत है, या कोई ग़लत पते पर है।',
        checkInOutOfRange:
          'GPS के हिसाब से यह तकनीशियन साइट की सीमा के बाहर है, इसलिए इस चेक-इन को उपस्थिति का सबूत नहीं माना जा सकता।',
        leftDuringCriticalStep:
          'सुरक्षा-चरण अभी खुला है और वे साइट से दूर चले गए हैं। पक्का कीजिए कि अधूरी जाँच वाली लिफ़्ट पर कोई काम नहीं कर रहा।',
        checkoutIncomplete:
          'SOP चरण अधूरे रहते हुए इस काम से चेक-आउट हुआ है। इसे पूरा नहीं माना गया — यह आपकी समीक्षा का इंतज़ार कर रहा है।',
        blockedStepNoEvidence:
          'एक सुरक्षा-चरण फ़ोटो सबूत का इंतज़ार कर रहा है। सबूत लगे बिना उसे पूरा नहीं किया जा सकता।',
        visitUnconfirmed: 'किसी पिछले दिन से अभी भी चेक-इन दिख रहे हैं। जब तक वे नहीं बताते कि कब निकले, उनका साइट पर समय गिना नहीं जाता। उनसे पूछा जा चुका है।',
        signalLost: 'काम चालू रहते हुए {{context}} मिनट से कोई लोकेशन सिग्नल नहीं।',
      },
      notFound: {
        title: 'तकनीशियन नहीं मिला',
        body: 'इस लिंक से कोई तकनीशियन मेल नहीं खाता। हो सकता है उन्हें हटा दिया गया हो, या लिंक पुराना हो।',
      },
      noJob: {
        title: 'कोई इंस्टॉलेशन नहीं चल रहा',
        body: 'इस तकनीशियन के पास अभी कोई सक्रिय काम नहीं है। काम मिलते और शुरू होते ही वह यहाँ लाइव दिखेगा।',
      },
      error: {
        title: 'यह काम लोड नहीं हो पाया',
        body: 'हम इंस्टॉलेशन डेटा तक नहीं पहुँच पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
    },
  },

  mr: {
    job: {
      step: {
        siteReadiness: 'साइट तयार आहे का, तपासणी',
        materialsReceived: 'साहित्य मिळाले आणि मोजले',
        guideRails: 'गाइड रेल सरळ रेषेत',
        machineMount: 'मशीन बसवली आणि घट्ट केली',
        carAssembly: 'केबिन जोडली',
        doorOperator: 'दरवाजाचा ऑपरेटर बसवला',
        wiringControl: 'वायरिंग आणि कंट्रोल पॅनेल',
        safetyGearTest: 'सुरक्षा गिअरची चाचणी',
        loadTest: 'भार चाचणी',
        finishHandover: 'फिनिशिंग आणि ताबा तपासणी',
      },
    },
    trackTechnician: {
      title: 'तंत्रज्ञ तपशील',
      loading: 'काम लोड होत आहे',
      mapLabel: 'कामाची साइट आणि तंत्रज्ञाची सध्याची जागा',
      safety: 'सुरक्षा तपासण्या',
      issues: 'फील्डमधील समस्या',
      escalate: 'हे वर कळवा',
      openTimeline: 'बसवणुकीची कालरेषा उघडा',
      oneSourceNote:
        'हीच ती टप्प्यांची नोंद आहे ज्यावर तंत्रज्ञ काम करत आहे — तिची प्रत नाही. तुम्हाला जे दिसते तेच त्यालाही दिसते.',
      stat: {
        checkIn: 'चेक-इन',
        checkOut: 'चेक-आउट',
        hoursOnSite: 'साइटवर',
        stepProgress: 'SOP टप्पे',
        evidence: 'जोडलेले फोटो',
        stillOnSite: 'अजून साइटवरच',
      },
      sop: {
        heading: 'बसवणुकीचे टप्पे',
        evidenceRequired: 'फोटो पुरावा आवश्यक',
        evidenceCount: '{{count}} फोटो जोडले',
        noEvidence: 'अजून पुरावा जोडलेला नाही — हा टप्पा पूर्ण मानता येणार नाही',
      },
      crew: {
        heading: 'या साइटवरील सर्वजण',
        checkedIn: 'साइटवर',
        notCheckedIn: 'साइटवर नाही',
        away: 'साइटपासून {{metres}} मीटर दूर',
      },
      evidence: {
        heading: 'आज अपलोड झालेले पुरावे',
        empty: 'या कामात अजून एकही फोटो घेतलेला नाही.',
        note: 'ही थंबनेल फक्त जागा भरण्यासाठी आहेत — या बिल्डमध्ये इमेज स्टोरेज जोडलेले नाही.',
      },
      anomaly: {
        heading: 'तुमचे लक्ष हवे',
        unscheduledCheckIn:
          'आज कोणतीही भेट ठरलेली नसताना साइटवर चेक-इन झाले. एकतर वेळापत्रक चुकीचे आहे, किंवा कोणीतरी चुकीच्या पत्त्यावर आहे.',
        checkInOutOfRange:
          'GPS नुसार हा तंत्रज्ञ साइटच्या हद्दीबाहेर आहे, त्यामुळे या चेक-इनला उपस्थितीचा पुरावा मानता येणार नाही.',
        leftDuringCriticalStep:
          'सुरक्षा-टप्पा अजून खुला असताना ते साइटपासून दूर गेले आहेत. अर्धवट तपासलेल्या लिफ्टवर कोणी काम करत नाही याची खात्री करा.',
        checkoutIncomplete:
          'SOP टप्पे अपूर्ण असताना या कामातून चेक-आउट झाले आहे. ते पूर्ण म्हणून नोंदलेले नाही — तुमच्या तपासणीची वाट पाहत आहे.',
        blockedStepNoEvidence:
          'एक सुरक्षा-टप्पा फोटो पुराव्याची वाट पाहत आहे. पुरावा जोडल्याशिवाय तो पूर्ण करता येणार नाही.',
        visitUnconfirmed: 'आधीच्या दिवसापासून अजूनही चेक-इन दिसत आहेत. ते कधी निघाले हे सांगेपर्यंत त्यांची साइटवरील वेळ मोजली जात नाही. त्यांना विचारले आहे.',
        signalLost: 'काम चालू असताना {{context}} मिनिटांपासून स्थानाचा सिग्नल नाही.',
      },
      notFound: {
        title: 'तंत्रज्ञ सापडला नाही',
        body: 'या दुव्याशी कोणताही तंत्रज्ञ जुळत नाही. कदाचित त्यांना काढले असेल, किंवा दुवा जुना असेल.',
      },
      noJob: {
        title: 'कोणतीही बसवणूक चालू नाही',
        body: 'या तंत्रज्ञाकडे सध्या कोणतेही सुरू असलेले काम नाही. काम मिळून सुरू होताच ते इथे थेट दिसेल.',
      },
      error: {
        title: 'हे काम लोड होऊ शकले नाही',
        body: 'आम्ही बसवणुकीच्या माहितीपर्यंत पोहोचू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
