import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    paymentScheduleSetup: {
      title: 'Payment Schedule Setup',
      loading: 'Loading the payment schedule',
      error: { title: 'Could not load this schedule', body: 'Check your connection and try again.' },
      notReady: { title: 'Not ready yet', body: 'Both parties need to confirm deal terms before a payment schedule can be set up.' },

      scheduleType: {
        heading: 'Schedule type',
        standard: 'Standard',
        custom: 'Custom',
        bank_guarantee: 'Bank guarantee',
        noteLabel: 'Bank guarantee note',
        noteHint: 'Required — flags this schedule for direct Admin oversight rather than the standard flow.',
      },

      reconcile: {
        heading: 'Reconciliation',
        target: 'Must total',
        current: 'Stages total',
        ok: 'Reconciles exactly — ready to activate.',
        short: '{{amount}} short of the total.',
        over: '{{amount}} over the total.',
      },

      stage: {
        heading: 'Stages',
        presetLabel: 'Stage',
        nameLabel: 'Display name',
        amountLabel: 'Amount (₹)',
        triggerLabel: 'Due when',
        triggerFixed: 'A fixed date',
        triggerMilestone: 'A milestone fires',
        dueDateLabel: 'Due date',
        milestoneLabel: 'Milestone',
        milestoneResolved: 'Resolved — due {{date}}',
        milestonePending: 'Not yet reached — no due date until it fires',
        noDateSet: 'No due date set',
        moveUp: 'Move up',
        moveDown: 'Move down',
        remove: 'Remove stage',
        addStage: 'Add stage',
      },

      preview: {
        heading: 'Customer preview',
        subtitle: 'Exactly what the customer will see in their portal.',
      },

      activated: {
        banner: 'Activated',
        by: 'Activated by {{name}} on {{date}}',
      },

      actionBar: {
        activate: 'Activate schedule',
        savedDraft: 'Draft saved',
      },

      toast: {
        saved: 'Draft saved',
        activated: 'Schedule activated',
        reconcileError: 'Stage amounts must reconcile before activating',
        error: 'Something went wrong. Please try again.',
      },
    },
  },
  hi: {
    paymentScheduleSetup: {
      title: 'भुगतान अनुसूची सेटअप',
      loading: 'भुगतान अनुसूची लोड हो रही है',
      error: { title: 'यह अनुसूची लोड नहीं हो सकी', body: 'अपना कनेक्शन जांचें और फिर से कोशिश करें।' },
      notReady: { title: 'अभी तैयार नहीं', body: 'भुगतान अनुसूची सेट करने से पहले दोनों पक्षों को डील शर्तों की पुष्टि करनी होगी।' },

      scheduleType: {
        heading: 'अनुसूची प्रकार',
        standard: 'मानक',
        custom: 'कस्टम',
        bank_guarantee: 'बैंक गारंटी',
        noteLabel: 'बैंक गारंटी नोट',
        noteHint: 'आवश्यक — यह अनुसूची मानक प्रक्रिया के बजाय सीधे एडमिन निगरानी के लिए चिह्नित करता है।',
      },

      reconcile: {
        heading: 'मिलान',
        target: 'कुल होना चाहिए',
        current: 'चरणों का कुल',
        ok: 'सटीक मिलान — सक्रिय करने के लिए तैयार।',
        short: 'कुल से {{amount}} कम।',
        over: 'कुल से {{amount}} ज़्यादा।',
      },

      stage: {
        heading: 'चरण',
        presetLabel: 'चरण',
        nameLabel: 'प्रदर्शन नाम',
        amountLabel: 'राशि (₹)',
        triggerLabel: 'कब देय',
        triggerFixed: 'एक निश्चित तारीख',
        triggerMilestone: 'एक माइलस्टोन पूरा होने पर',
        dueDateLabel: 'देय तिथि',
        milestoneLabel: 'माइलस्टोन',
        milestoneResolved: 'तय हो गया — देय {{date}}',
        milestonePending: 'अभी नहीं पहुंचा — पूरा होने तक कोई देय तिथि नहीं',
        noDateSet: 'कोई देय तिथि सेट नहीं',
        moveUp: 'ऊपर ले जाएं',
        moveDown: 'नीचे ले जाएं',
        remove: 'चरण हटाएं',
        addStage: 'चरण जोड़ें',
      },

      preview: {
        heading: 'ग्राहक पूर्वावलोकन',
        subtitle: 'ग्राहक को उनके पोर्टल में ठीक यही दिखेगा।',
      },

      activated: {
        banner: 'सक्रिय',
        by: '{{name}} द्वारा {{date}} को सक्रिय किया गया',
      },

      actionBar: {
        activate: 'अनुसूची सक्रिय करें',
        savedDraft: 'ड्राफ्ट सहेजा गया',
      },

      toast: {
        saved: 'ड्राफ्ट सहेजा गया',
        activated: 'अनुसूची सक्रिय हो गई',
        reconcileError: 'सक्रिय करने से पहले चरण राशियों का मिलान होना चाहिए',
        error: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
      },
    },
  },
  mr: {
    paymentScheduleSetup: {
      title: 'पेमेंट वेळापत्रक सेटअप',
      loading: 'पेमेंट वेळापत्रक लोड होत आहे',
      error: { title: 'हे वेळापत्रक लोड होऊ शकले नाही', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },
      notReady: { title: 'अजून तयार नाही', body: 'पेमेंट वेळापत्रक सेट करण्यापूर्वी दोन्ही पक्षांनी डील अटींची पुष्टी करणे आवश्यक आहे.' },

      scheduleType: {
        heading: 'वेळापत्रक प्रकार',
        standard: 'मानक',
        custom: 'कस्टम',
        bank_guarantee: 'बँक हमी',
        noteLabel: 'बँक हमी नोंद',
        noteHint: 'आवश्यक — हे वेळापत्रक मानक प्रक्रियेऐवजी थेट अ‍ॅडमिन देखरेखीसाठी चिन्हांकित करते.',
      },

      reconcile: {
        heading: 'जुळणी',
        target: 'एकूण असणे आवश्यक',
        current: 'टप्प्यांची बेरीज',
        ok: 'अचूक जुळते — सक्रिय करण्यासाठी तयार.',
        short: 'एकूणपेक्षा {{amount}} कमी.',
        over: 'एकूणपेक्षा {{amount}} जास्त.',
      },

      stage: {
        heading: 'टप्पे',
        presetLabel: 'टप्पा',
        nameLabel: 'प्रदर्शन नाव',
        amountLabel: 'रक्कम (₹)',
        triggerLabel: 'कधी देय',
        triggerFixed: 'एक निश्चित तारीख',
        triggerMilestone: 'एक टप्पा पूर्ण झाल्यावर',
        dueDateLabel: 'देय तारीख',
        milestoneLabel: 'टप्पा (माइलस्टोन)',
        milestoneResolved: 'निश्चित झाले — देय {{date}}',
        milestonePending: 'अजून पोहोचलेले नाही — पूर्ण होईपर्यंत देय तारीख नाही',
        noDateSet: 'कोणतीही देय तारीख सेट नाही',
        moveUp: 'वर हलवा',
        moveDown: 'खाली हलवा',
        remove: 'टप्पा काढा',
        addStage: 'टप्पा जोडा',
      },

      preview: {
        heading: 'ग्राहक पूर्वावलोकन',
        subtitle: 'ग्राहकाला त्यांच्या पोर्टलमध्ये नेमके हेच दिसेल.',
      },

      activated: {
        banner: 'सक्रिय',
        by: '{{name}} यांनी {{date}} रोजी सक्रिय केले',
      },

      actionBar: {
        activate: 'वेळापत्रक सक्रिय करा',
        savedDraft: 'ड्राफ्ट जतन झाला',
      },

      toast: {
        saved: 'ड्राफ्ट जतन झाला',
        activated: 'वेळापत्रक सक्रिय झाले',
        reconcileError: 'सक्रिय करण्यापूर्वी टप्प्यांच्या रकमांची जुळणी होणे आवश्यक आहे',
        error: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
