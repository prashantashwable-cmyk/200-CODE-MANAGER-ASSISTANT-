import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    whatsappConsole: {
      title: 'WhatsApp console',
      subtitle: 'Every thread, bot and human messages together.',
      loading: 'Loading conversations',
      error: { title: 'Could not load conversations', body: 'Check your connection and try again.' },
      empty: { title: 'No conversations yet', body: 'Threads appear here once a lead starts exchanging WhatsApp messages.' },
      unassigned: 'Unassigned',
      needsReview: 'Needs review',
      claim: 'Claim',
      assignedTo: 'Assigned to {{name}}',
      bubble: {
        bot: 'Bot',
        photo: 'Photo attached',
        voice: 'Voice note attached',
        status: {
          queued: 'Queued',
          sent: 'Sent',
          delivered: 'Delivered',
          read: 'Read',
          failed: 'Failed to send',
        },
      },
      optOutBanner: {
        title: 'This contact may be opting out',
        body: 'Their last message matched an opt-out keyword — confirm to record it and stop every channel immediately.',
        confirm: 'Confirm opt-out',
        confirmed: 'Opt-out recorded',
      },
      composer: {
        placeholder: 'Type a reply',
        quickReplies: 'Quick replies',
        send: 'Send',
        pauseNote: 'Replying here pauses this lead’s automated sequence for a few hours, so a bot message never lands right after yours.',
        sendError: 'Could not send — sending may be temporarily degraded. Try again.',
      },
      toast: {
        sent: 'Message sent',
        assigned: 'Conversation assigned',
        optedOut: 'Opt-out recorded',
        error: 'Something went wrong — try again.',
      },
    },
  },

  hi: {
    whatsappConsole: {
      title: 'व्हाट्सऐप कंसोल',
      subtitle: 'हर थ्रेड, बॉट और इंसान के संदेश एक साथ।',
      loading: 'बातचीत लोड हो रही हैं',
      error: { title: 'बातचीत लोड नहीं हो पाईं', body: 'नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।' },
      empty: { title: 'अभी कोई बातचीत नहीं', body: 'जैसे ही कोई लीड व्हाट्सऐप पर संदेश भेजना शुरू करता है, थ्रेड यहाँ दिखेंगे।' },
      unassigned: 'अनसाइन्ड',
      needsReview: 'समीक्षा ज़रूरी',
      claim: 'ले लें',
      assignedTo: '{{name}} को सौंपा',
      bubble: {
        bot: 'बॉट',
        photo: 'फ़ोटो जुड़ी है',
        voice: 'वॉइस नोट जुड़ा है',
        status: {
          queued: 'क़तार में',
          sent: 'भेजा गया',
          delivered: 'पहुँच गया',
          read: 'पढ़ लिया गया',
          failed: 'भेजा नहीं जा सका',
        },
      },
      optOutBanner: {
        title: 'यह संपर्क शायद ऑप्ट-आउट कर रहा है',
        body: 'इनके आख़िरी संदेश में ऑप्ट-आउट कीवर्ड मिला — दर्ज करने और तुरंत हर चैनल रोकने के लिए पुष्टि कीजिए।',
        confirm: 'ऑप्ट-आउट की पुष्टि करें',
        confirmed: 'ऑप्ट-आउट दर्ज हुआ',
      },
      composer: {
        placeholder: 'जवाब लिखें',
        quickReplies: 'त्वरित जवाब',
        send: 'भेजें',
        pauseNote: 'यहाँ जवाब देने से इस लीड का ऑटोमेटेड सीक्वेंस कुछ घंटों के लिए रुक जाता है, ताकि कोई बॉट संदेश आपके ठीक बाद न आए।',
        sendError: 'भेजा नहीं जा सका — भेजना अस्थायी रूप से बाधित हो सकता है। दोबारा कोशिश करें।',
      },
      toast: {
        sent: 'संदेश भेजा गया',
        assigned: 'बातचीत सौंपी गई',
        optedOut: 'ऑप्ट-आउट दर्ज हुआ',
        error: 'कुछ गड़बड़ हुई — दोबारा कोशिश करें।',
      },
    },
  },

  mr: {
    whatsappConsole: {
      title: 'व्हॉट्सअ‍ॅप कन्सोल',
      subtitle: 'प्रत्येक थ्रेड, बॉट आणि माणसाचे संदेश एकत्र.',
      loading: 'संभाषणे लोड होत आहेत',
      error: { title: 'संभाषणे लोड होऊ शकली नाहीत', body: 'नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'अजून कोणतेही संभाषण नाही', body: 'लीड व्हॉट्सअ‍ॅपवर संदेश पाठवू लागताच थ्रेड इथे दिसतील.' },
      unassigned: 'नेमणूक न झालेले',
      needsReview: 'पुनरावलोकन आवश्यक',
      claim: 'घ्या',
      assignedTo: '{{name}} कडे सोपवले',
      bubble: {
        bot: 'बॉट',
        photo: 'फोटो जोडला आहे',
        voice: 'व्हॉइस नोट जोडली आहे',
        status: {
          queued: 'रांगेत',
          sent: 'पाठवले',
          delivered: 'पोहोचले',
          read: 'वाचले',
          failed: 'पाठवता आले नाही',
        },
      },
      optOutBanner: {
        title: 'हा संपर्क कदाचित ऑप्ट-आउट करत आहे',
        body: 'त्यांच्या शेवटच्या संदेशात ऑप्ट-आउट कीवर्ड आढळला — नोंदवण्यासाठी आणि लगेच प्रत्येक चॅनेल थांबवण्यासाठी पुष्टी करा.',
        confirm: 'ऑप्ट-आउटची पुष्टी करा',
        confirmed: 'ऑप्ट-आउट नोंदवले',
      },
      composer: {
        placeholder: 'उत्तर लिहा',
        quickReplies: 'त्वरित उत्तरे',
        send: 'पाठवा',
        pauseNote: 'इथे उत्तर दिल्याने या लीडचे स्वयंचलित सिक्वेन्स काही तासांसाठी थांबते, जेणेकरून कोणताही बॉट संदेश तुमच्या लगेच नंतर येणार नाही.',
        sendError: 'पाठवता आले नाही — पाठवणे तात्पुरते बाधित असू शकते. पुन्हा प्रयत्न करा.',
      },
      toast: {
        sent: 'संदेश पाठवला',
        assigned: 'संभाषण सोपवले',
        optedOut: 'ऑप्ट-आउट नोंदवले',
        error: 'काहीतरी चुकले — पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
