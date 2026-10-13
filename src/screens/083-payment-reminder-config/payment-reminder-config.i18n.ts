import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    paymentReminderConfig: {
      title: 'Payment Reminder Settings',
      subtitle: 'The one cadence every reminder in the app follows',
      loading: 'Loading reminder settings',
      error: { title: 'Could not load reminder settings', body: 'Check your connection and try again.' },

      tier: {
        friendly: 'Friendly nudge',
        firm: 'Firm follow-up',
        call_task: 'Call task for Admin',
      },

      cadence: {
        heading: 'Reminder cadence',
        dayLabel: 'Days from due date',
        dayBefore: '{{count}} days before due',
        dayOf: 'On the due date',
        dayAfter: '{{count}} days after due',
        tierLabel: 'Tone',
        channelLabel: 'Channel',
        templateLabel: 'Template',
        callTaskNote: 'Creates a call task for the deal\'s owner instead of sending a customer message — this step never gets skipped for an opt-out.',
        remove: 'Remove step',
        addStep: 'Add step',
      },

      sendWindow: {
        heading: 'Send window',
        body: 'A reminder due outside this window waits for it to open, the same courtesy every other message in the app follows.',
        startLabel: 'From',
        endLabel: 'Until',
        holidayNote: 'Public holidays are not checked yet — no holiday calendar exists in this build.',
      },

      preview: {
        heading: 'Preview timeline',
        sampleLabel: 'Sample payment stage',
        outcome: {
          sent_in_past: 'Would already have fired',
          due_today: 'Due today',
          upcoming: 'Upcoming',
          skipped_opted_out: 'Skipped — opted out',
          skipped_paused: 'Skipped — deal paused',
        },
        empty: 'No outstanding payment stages to preview against yet.',
      },

      runNow: {
        heading: 'Run reminders now',
        body: 'This build has no background scheduler — use this to actually send every reminder due today, right now, through the real channels.',
        button: 'Run due reminders',
        resultSent: '{{count}} messages sent',
        resultCallTasks: '{{count}} call tasks created',
        resultSkippedOptedOut: '{{count}} skipped — opted out',
        resultSkippedPaused: '{{count}} skipped — deal paused',
        resultSkippedWindow: '{{count}} skipped — outside send window',
      },

      pauses: {
        heading: 'Paused deals',
        empty: 'No deal has its reminders paused right now.',
        longStanding: 'Paused for a while — worth checking whether this is still needed.',
        pausedLine: 'Paused by {{name}} on {{date}}',
        resume: 'Resume',
        addPause: 'Pause a deal',
      },

      pauseSheet: {
        title: 'Pause a deal\'s reminders',
        hint: 'A deliberate, logged override — never a silent mute. Every stage on this deal stops getting automated reminders until resumed.',
        dealLabel: 'Deal',
        reasonLabel: 'Reason',
        submit: 'Pause reminders',
      },

      actionBar: {
        save: 'Save cadence',
      },

      toast: {
        saved: 'Reminder cadence saved',
        paused: 'Reminders paused for this deal',
        resumed: 'Reminders resumed',
        ranNow: 'Reminders run',
        error: 'Something went wrong. Please try again.',
      },
    },
  },
  hi: {
    paymentReminderConfig: {
      title: 'भुगतान याद-दिलाना सेटिंग्स',
      subtitle: 'ऐप में हर याद-दिलाना जिस एक क्रम का पालन करता है',
      loading: 'याद-दिलाना सेटिंग्स लोड हो रही हैं',
      error: { title: 'याद-दिलाना सेटिंग्स लोड नहीं हो सकीं', body: 'अपना कनेक्शन जांचें और फिर से कोशिश करें।' },

      tier: {
        friendly: 'सामान्य याद-दिलाना',
        firm: 'सख्त फ़ॉलो-अप',
        call_task: 'एडमिन के लिए कॉल टास्क',
      },

      cadence: {
        heading: 'याद-दिलाना क्रम',
        dayLabel: 'देय तिथि से दिन',
        dayBefore: 'देय से {{count}} दिन पहले',
        dayOf: 'देय तिथि पर',
        dayAfter: 'देय के {{count}} दिन बाद',
        tierLabel: 'लहजा',
        channelLabel: 'चैनल',
        templateLabel: 'टेम्पलेट',
        callTaskNote: 'ग्राहक संदेश भेजने के बजाय डील के मालिक के लिए एक कॉल टास्क बनाता है — यह चरण ऑप्ट-आउट के लिए कभी नहीं छोड़ा जाता।',
        remove: 'चरण हटाएं',
        addStep: 'चरण जोड़ें',
      },

      sendWindow: {
        heading: 'भेजने की समय-सीमा',
        body: 'इस समय-सीमा के बाहर देय याद-दिलाना इसके खुलने का इंतज़ार करता है, ठीक वैसे ही जैसे ऐप का हर दूसरा संदेश करता है।',
        startLabel: 'से',
        endLabel: 'तक',
        holidayNote: 'सार्वजनिक अवकाश अभी जांचे नहीं जाते — इस बिल्ड में कोई अवकाश कैलेंडर नहीं है।',
      },

      preview: {
        heading: 'पूर्वावलोकन समयरेखा',
        sampleLabel: 'नमूना भुगतान चरण',
        outcome: {
          sent_in_past: 'पहले ही भेजा जा चुका होता',
          due_today: 'आज देय',
          upcoming: 'आगामी',
          skipped_opted_out: 'छोड़ा गया — ऑप्ट-आउट',
          skipped_paused: 'छोड़ा गया — डील रुकी हुई है',
        },
        empty: 'पूर्वावलोकन के लिए अभी कोई बकाया भुगतान चरण नहीं है।',
      },

      runNow: {
        heading: 'अभी याद-दिलाना चलाएं',
        body: 'इस बिल्ड में कोई बैकग्राउंड शेड्यूलर नहीं है — आज देय हर याद-दिलाना अभी, वास्तविक चैनलों के माध्यम से भेजने के लिए इसका उपयोग करें।',
        button: 'देय याद-दिलाना चलाएं',
        resultSent: '{{count}} संदेश भेजे गए',
        resultCallTasks: '{{count}} कॉल टास्क बनाए गए',
        resultSkippedOptedOut: '{{count}} छोड़े गए — ऑप्ट-आउट',
        resultSkippedPaused: '{{count}} छोड़े गए — डील रुकी हुई',
        resultSkippedWindow: '{{count}} छोड़े गए — समय-सीमा के बाहर',
      },

      pauses: {
        heading: 'रुकी हुई डील्स',
        empty: 'अभी किसी डील के याद-दिलाना रुके हुए नहीं हैं।',
        longStanding: 'काफी समय से रुका हुआ है — जांचना उचित होगा कि क्या यह अभी भी ज़रूरी है।',
        pausedLine: '{{name}} द्वारा {{date}} को रोका गया',
        resume: 'फिर से शुरू करें',
        addPause: 'एक डील रोकें',
      },

      pauseSheet: {
        title: 'डील के याद-दिलाना रोकें',
        hint: 'एक जानबूझकर, दर्ज किया गया ओवरराइड — कभी चुपचाप म्यूट नहीं। फिर से शुरू होने तक इस डील के हर चरण के लिए स्वचालित याद-दिलाना रुक जाता है।',
        dealLabel: 'डील',
        reasonLabel: 'कारण',
        submit: 'याद-दिलाना रोकें',
      },

      actionBar: {
        save: 'क्रम सहेजें',
      },

      toast: {
        saved: 'याद-दिलाना क्रम सहेजा गया',
        paused: 'इस डील के लिए याद-दिलाना रोक दिए गए',
        resumed: 'याद-दिलाना फिर से शुरू',
        ranNow: 'याद-दिलाना चलाए गए',
        error: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
      },
    },
  },
  mr: {
    paymentReminderConfig: {
      title: 'पेमेंट स्मरणपत्र सेटिंग्ज',
      subtitle: 'अ‍ॅपमधील प्रत्येक स्मरणपत्र ज्या एका क्रमाचे पालन करते',
      loading: 'स्मरणपत्र सेटिंग्ज लोड होत आहेत',
      error: { title: 'स्मरणपत्र सेटिंग्ज लोड होऊ शकल्या नाहीत', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },

      tier: {
        friendly: 'सौम्य स्मरणपत्र',
        firm: 'ठाम फॉलो-अप',
        call_task: 'अ‍ॅडमिनसाठी कॉल टास्क',
      },

      cadence: {
        heading: 'स्मरणपत्र क्रम',
        dayLabel: 'देय तारखेपासून दिवस',
        dayBefore: 'देयच्या {{count}} दिवस आधी',
        dayOf: 'देय तारखेला',
        dayAfter: 'देयच्या {{count}} दिवसांनी',
        tierLabel: 'सूर',
        channelLabel: 'चॅनेल',
        templateLabel: 'टेम्पलेट',
        callTaskNote: 'ग्राहक संदेश पाठवण्याऐवजी डीलच्या मालकासाठी कॉल टास्क तयार करते — हा टप्पा ऑप्ट-आउटसाठी कधीही वगळला जात नाही.',
        remove: 'टप्पा काढा',
        addStep: 'टप्पा जोडा',
      },

      sendWindow: {
        heading: 'पाठवण्याची वेळ',
        body: 'या वेळेबाहेर देय असलेले स्मरणपत्र ती वेळ सुरू होण्याची वाट पाहते, अ‍ॅपमधील इतर प्रत्येक संदेशाप्रमाणेच.',
        startLabel: 'पासून',
        endLabel: 'पर्यंत',
        holidayNote: 'सार्वजनिक सुट्ट्या अजून तपासल्या जात नाहीत — या बिल्डमध्ये सुट्टी कॅलेंडर नाही.',
      },

      preview: {
        heading: 'पूर्वावलोकन कालरेषा',
        sampleLabel: 'नमुना पेमेंट टप्पा',
        outcome: {
          sent_in_past: 'आधीच पाठवले गेले असते',
          due_today: 'आज देय',
          upcoming: 'आगामी',
          skipped_opted_out: 'वगळले — ऑप्ट-आउट',
          skipped_paused: 'वगळले — डील थांबवलेली',
        },
        empty: 'पूर्वावलोकनासाठी अजून कोणताही थकीत पेमेंट टप्पा नाही.',
      },

      runNow: {
        heading: 'आता स्मरणपत्रे चालवा',
        body: 'या बिल्डमध्ये बॅकग्राउंड शेड्युलर नाही — आज देय असलेले प्रत्येक स्मरणपत्र आत्ता, खऱ्या चॅनेलद्वारे पाठवण्यासाठी हे वापरा.',
        button: 'देय स्मरणपत्रे चालवा',
        resultSent: '{{count}} संदेश पाठवले',
        resultCallTasks: '{{count}} कॉल टास्क तयार झाले',
        resultSkippedOptedOut: '{{count}} वगळले — ऑप्ट-आउट',
        resultSkippedPaused: '{{count}} वगळले — डील थांबवलेली',
        resultSkippedWindow: '{{count}} वगळले — वेळेबाहेर',
      },

      pauses: {
        heading: 'थांबवलेल्या डील्स',
        empty: 'सध्या कोणत्याही डीलचे स्मरणपत्र थांबवलेले नाही.',
        longStanding: 'बराच काळ थांबवलेले आहे — हे अजूनही आवश्यक आहे का ते तपासणे योग्य ठरेल.',
        pausedLine: '{{name}} यांनी {{date}} रोजी थांबवले',
        resume: 'पुन्हा सुरू करा',
        addPause: 'डील थांबवा',
      },

      pauseSheet: {
        title: 'डीलचे स्मरणपत्र थांबवा',
        hint: 'एक जाणीवपूर्वक, नोंदवलेला ओव्हरराइड — कधीही शांतपणे म्यूट नाही. पुन्हा सुरू होईपर्यंत या डीलच्या प्रत्येक टप्प्यासाठी स्वयंचलित स्मरणपत्रे थांबतात.',
        dealLabel: 'डील',
        reasonLabel: 'कारण',
        submit: 'स्मरणपत्रे थांबवा',
      },

      actionBar: {
        save: 'क्रम जतन करा',
      },

      toast: {
        saved: 'स्मरणपत्र क्रम जतन झाला',
        paused: 'या डीलसाठी स्मरणपत्रे थांबवली',
        resumed: 'स्मरणपत्रे पुन्हा सुरू झाली',
        ranNow: 'स्मरणपत्रे चालवली',
        error: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
