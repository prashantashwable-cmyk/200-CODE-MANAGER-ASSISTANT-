import type { ScreenTranslations } from '@/i18n/types';

/**
 * Screen 068 owns the shared `quotationChannel.*` key set (whatsapp/email) —
 * `commChannel.*` (051) doesn't cover email, since email isn't a DND-style
 * opt-out channel elsewhere in the app.
 */
const translations: ScreenTranslations = {
  en: {
    quotationChannel: {
      whatsapp: 'WhatsApp',
      email: 'Email',
    },
    quotationSend: {
      title: 'Send Quotation',
      loading: 'Loading quotation',
      error: { title: 'Could not load this quotation', body: 'Check your connection and try again.' },

      supersededState: {
        title: 'This version is out of date',
        body: 'A newer version of this quotation replaced it — sending this one would put a stale price in front of the customer.',
        viewLatest: 'Go to the latest version',
      },

      noChannelState: {
        title: 'No delivery channel available',
        body: 'This customer has opted out of WhatsApp and has no email on file — add an email address or resolve the opt-out before sending.',
      },

      scheduledCard: {
        title: 'Send scheduled',
        scheduledFor: 'Going out on {{date}}',
        cancel: 'Cancel scheduled send',
      },

      composeForm: {
        heading: 'Compose the send',
        channelHeading: 'Delivery channel',
        whatsappOptedOutNote: "WhatsApp isn't offered — this contact has opted out.",
        noEmailNote: "Email isn't offered — no email address is on file for this contact.",
        messageLabel: 'Cover message',
        defaultMessage: 'Hi {{name}}, please find your elevator quotation {{code}} attached — happy to walk through it on a call.',
        messageRequired: 'A cover message is required.',
        scheduleToggleLabel: 'Schedule for later',
        scheduleToggleHint: 'Send at a specific time instead of right now.',
        scheduleTimeLabel: 'Send at',
        schedulePastError: 'Pick a time in the future.',
        sendNow: 'Send now',
        scheduleSend: 'Schedule send',
      },

      confirmation: {
        messageSentLabel: 'Message sent',
        allDelivered: 'Delivered on every selected channel.',
        allFailed: 'Delivery failed on every channel — call the customer directly.',
        mixedResult: 'Delivered on some channels, failed on others — see below.',
        channelStatus: {
          delivered: 'Delivered',
          sent: 'Sent',
          failed: 'Failed',
        },
        failureReason: {
          opted_out: 'This contact has opted out of WhatsApp.',
          not_on_whatsapp: "This number isn't registered on WhatsApp.",
          no_email_on_file: 'No email address is on file for this contact.',
        },
        viewTracking: {
          viewed: 'Viewed by the customer on {{date}}',
          sentNotViewed: 'Sent, not yet opened by the customer',
        },
      },

      toast: {
        sent: 'Quotation sent',
        scheduled: 'Send scheduled',
        cancelled: 'Scheduled send cancelled',
        error: 'Something went wrong — try again',
      },
    },
  },

  hi: {
    quotationChannel: {
      whatsapp: 'व्हाट्सऐप',
      email: 'ईमेल',
    },
    quotationSend: {
      title: 'कोटेशन भेजें',
      loading: 'कोटेशन लोड हो रहा है',
      error: { title: 'यह कोटेशन लोड नहीं हो सका', body: 'अपना कनेक्शन जांचें और फिर से प्रयास करें।' },

      supersededState: {
        title: 'यह वर्शन पुराना हो चुका है',
        body: 'इस कोटेशन का एक नया वर्शन इसकी जगह ले चुका है — इसे भेजने से ग्राहक को पुरानी कीमत मिल जाएगी।',
        viewLatest: 'नवीनतम वर्शन पर जाएं',
      },

      noChannelState: {
        title: 'कोई डिलीवरी चैनल उपलब्ध नहीं है',
        body: 'इस ग्राहक ने व्हाट्सऐप से ऑप्ट-आउट किया है और कोई ईमेल दर्ज नहीं है — भेजने से पहले ईमेल जोड़ें या ऑप्ट-आउट हल करें।',
      },

      scheduledCard: {
        title: 'भेजना शेड्यूल किया गया',
        scheduledFor: '{{date}} को भेजा जाएगा',
        cancel: 'शेड्यूल किया गया भेजना रद्द करें',
      },

      composeForm: {
        heading: 'भेजने का संदेश तैयार करें',
        channelHeading: 'डिलीवरी चैनल',
        whatsappOptedOutNote: 'व्हाट्सऐप उपलब्ध नहीं है — इस संपर्क ने ऑप्ट-आउट किया है।',
        noEmailNote: 'ईमेल उपलब्ध नहीं है — इस संपर्क के लिए कोई ईमेल दर्ज नहीं है।',
        messageLabel: 'साथ में भेजा जाने वाला संदेश',
        defaultMessage: 'नमस्ते {{name}}, आपका एलिवेटर कोटेशन {{code}} संलग्न है — कॉल पर इसे समझाने में खुशी होगी।',
        messageRequired: 'साथ में एक संदेश आवश्यक है।',
        scheduleToggleLabel: 'बाद के लिए शेड्यूल करें',
        scheduleToggleHint: 'अभी के बजाय किसी निश्चित समय पर भेजें।',
        scheduleTimeLabel: 'भेजने का समय',
        schedulePastError: 'भविष्य का समय चुनें।',
        sendNow: 'अभी भेजें',
        scheduleSend: 'भेजना शेड्यूल करें',
      },

      confirmation: {
        messageSentLabel: 'भेजा गया संदेश',
        allDelivered: 'सभी चुने गए चैनलों पर डिलीवर हो गया।',
        allFailed: 'सभी चैनलों पर डिलीवरी विफल रही — ग्राहक को सीधे कॉल करें।',
        mixedResult: 'कुछ चैनलों पर डिलीवर हुआ, कुछ पर विफल रहा — नीचे देखें।',
        channelStatus: {
          delivered: 'डिलीवर हो गया',
          sent: 'भेजा गया',
          failed: 'विफल',
        },
        failureReason: {
          opted_out: 'इस संपर्क ने व्हाट्सऐप से ऑप्ट-आउट किया है।',
          not_on_whatsapp: 'यह नंबर व्हाट्सऐप पर पंजीकृत नहीं है।',
          no_email_on_file: 'इस संपर्क के लिए कोई ईमेल पता दर्ज नहीं है।',
        },
        viewTracking: {
          viewed: 'ग्राहक ने {{date}} को देखा',
          sentNotViewed: 'भेजा गया, ग्राहक ने अभी तक नहीं देखा',
        },
      },

      toast: {
        sent: 'कोटेशन भेज दिया गया',
        scheduled: 'भेजना शेड्यूल हो गया',
        cancelled: 'शेड्यूल किया गया भेजना रद्द किया गया',
        error: 'कुछ गलत हो गया — फिर से प्रयास करें',
      },
    },
  },

  mr: {
    quotationChannel: {
      whatsapp: 'व्हाट्सअॅप',
      email: 'ईमेल',
    },
    quotationSend: {
      title: 'कोटेशन पाठवा',
      loading: 'कोटेशन लोड होत आहे',
      error: { title: 'हे कोटेशन लोड होऊ शकले नाही', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },

      supersededState: {
        title: 'ही आवृत्ती जुनी झाली आहे',
        body: 'या कोटेशनची नवीन आवृत्ती याची जागा घेत आहे — हे पाठवल्यास ग्राहकाला जुनी किंमत मिळेल.',
        viewLatest: 'नवीनतम आवृत्तीवर जा',
      },

      noChannelState: {
        title: 'कोणतेही डिलिव्हरी चॅनेल उपलब्ध नाही',
        body: 'या ग्राहकाने व्हाट्सअॅपमधून ऑप्ट-आउट केले आहे आणि कोणताही ईमेल नोंदवलेला नाही — पाठवण्यापूर्वी ईमेल जोडा किंवा ऑप्ट-आउट सोडवा.',
      },

      scheduledCard: {
        title: 'पाठवणे शेड्यूल केले आहे',
        scheduledFor: '{{date}} रोजी पाठवले जाईल',
        cancel: 'शेड्यूल केलेले पाठवणे रद्द करा',
      },

      composeForm: {
        heading: 'पाठवण्याचा मजकूर तयार करा',
        channelHeading: 'डिलिव्हरी चॅनेल',
        whatsappOptedOutNote: 'व्हाट्सअॅप उपलब्ध नाही — या संपर्काने ऑप्ट-आउट केले आहे.',
        noEmailNote: 'ईमेल उपलब्ध नाही — या संपर्कासाठी कोणताही ईमेल नोंदवलेला नाही.',
        messageLabel: 'सोबत पाठवायचा संदेश',
        defaultMessage: 'नमस्कार {{name}}, तुमचे एलिव्हेटर कोटेशन {{code}} सोबत जोडले आहे — कॉलवर समजावून सांगण्यास आनंद होईल.',
        messageRequired: 'सोबत संदेश असणे आवश्यक आहे.',
        scheduleToggleLabel: 'नंतरसाठी शेड्यूल करा',
        scheduleToggleHint: 'आत्ताऐवजी विशिष्ट वेळी पाठवा.',
        scheduleTimeLabel: 'पाठवण्याची वेळ',
        schedulePastError: 'भविष्यातील वेळ निवडा.',
        sendNow: 'आत्ता पाठवा',
        scheduleSend: 'पाठवणे शेड्यूल करा',
      },

      confirmation: {
        messageSentLabel: 'पाठवलेला संदेश',
        allDelivered: 'सर्व निवडलेल्या चॅनेलवर डिलिव्हर झाले.',
        allFailed: 'सर्व चॅनेलवर डिलिव्हरी अयशस्वी झाली — ग्राहकाला थेट कॉल करा.',
        mixedResult: 'काही चॅनेलवर डिलिव्हर झाले, काहींवर अयशस्वी झाले — खाली पहा.',
        channelStatus: {
          delivered: 'डिलिव्हर झाले',
          sent: 'पाठवले',
          failed: 'अयशस्वी',
        },
        failureReason: {
          opted_out: 'या संपर्काने व्हाट्सअॅपमधून ऑप्ट-आउट केले आहे.',
          not_on_whatsapp: 'हा नंबर व्हाट्सअॅपवर नोंदणीकृत नाही.',
          no_email_on_file: 'या संपर्कासाठी कोणताही ईमेल पत्ता नोंदवलेला नाही.',
        },
        viewTracking: {
          viewed: 'ग्राहकाने {{date}} रोजी पाहिले',
          sentNotViewed: 'पाठवले, ग्राहकाने अद्याप पाहिलेले नाही',
        },
      },

      toast: {
        sent: 'कोटेशन पाठवले',
        scheduled: 'पाठवणे शेड्यूल झाले',
        cancelled: 'शेड्यूल केलेले पाठवणे रद्द केले',
        error: 'काहीतरी चुकले — पुन्हा प्रयत्न करा',
      },
    },
  },
};

export default translations;
