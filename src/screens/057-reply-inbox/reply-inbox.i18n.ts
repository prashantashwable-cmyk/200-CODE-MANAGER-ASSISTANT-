import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    replyInbox: {
      title: 'Reply inbox',
      subtitle: 'Every reply that needs a person — WhatsApp, SMS, and missed calls — in one place.',
      loading: 'Loading replies',
      error: { title: 'Could not load the reply inbox', body: 'Check your connection and try again.' },
      empty: { title: 'Inbox zero', body: 'Nothing is waiting on a human right now — the bot has the rest covered.' },
      channel: { whatsapp: 'WhatsApp', sms: 'SMS', call: 'Missed calls' },
      allChannels: 'All',
      reasonMissedCall: 'Missed call — no answer yet',
      relatedNote: '+{{count}} more pending item(s) from this lead',
      waitingMinutes: '{{count}}m waiting',
      waitingHours: '{{count}}h waiting',
      slaBreached: 'Past the 1-hour response SLA',
      unassigned: 'Unassigned',
      assignedTo: 'Assigned to {{name}}',
      action: {
        assign: 'Assign',
        markHandled: 'Mark handled',
        callBack: 'Call back',
        assignSheetTitle: 'Assign to',
      },
      toast: {
        assigned: 'Assigned',
        handled: 'Marked handled',
        calledBack: 'Callback logged',
        error: 'Could not save — try again.',
      },
    },
  },

  hi: {
    replyInbox: {
      title: 'जवाब इनबॉक्स',
      subtitle: 'हर जवाब जिसे किसी व्यक्ति की ज़रूरत है — व्हाट्सऐप, SMS और छूटी हुई कॉल — एक ही जगह।',
      loading: 'जवाब लोड हो रहे हैं',
      error: { title: 'जवाब इनबॉक्स लोड नहीं हो पाया', body: 'नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।' },
      empty: { title: 'इनबॉक्स खाली', body: 'अभी किसी व्यक्ति का इंतज़ार नहीं है — बाकी बॉट संभाल रहा है।' },
      channel: { whatsapp: 'व्हाट्सऐप', sms: 'SMS', call: 'छूटी हुई कॉल' },
      allChannels: 'सभी',
      reasonMissedCall: 'छूटी हुई कॉल — अभी तक जवाब नहीं',
      relatedNote: 'इस लीड से {{count}} और लंबित आइटम',
      waitingMinutes: '{{count}} मिनट से इंतज़ार',
      waitingHours: '{{count}} घंटे से इंतज़ार',
      slaBreached: '1 घंटे की जवाब सीमा पार',
      unassigned: 'असाइन नहीं हुआ',
      assignedTo: '{{name}} को सौंपा गया',
      action: {
        assign: 'असाइन करें',
        markHandled: 'हल किया हुआ चिह्नित करें',
        callBack: 'वापस कॉल करें',
        assignSheetTitle: 'इन्हें असाइन करें',
      },
      toast: {
        assigned: 'असाइन हुआ',
        handled: 'हल किया हुआ चिह्नित हुआ',
        calledBack: 'कॉलबैक दर्ज हुआ',
        error: 'सहेजा नहीं जा सका — दोबारा कोशिश करें।',
      },
    },
  },

  mr: {
    replyInbox: {
      title: 'उत्तर इनबॉक्स',
      subtitle: 'ज्या उत्तराला व्यक्तीची गरज आहे ते सर्व — व्हॉट्सअ‍ॅप, SMS आणि चुकलेले कॉल — एकाच ठिकाणी.',
      loading: 'उत्तरे लोड होत आहेत',
      error: { title: 'उत्तर इनबॉक्स लोड होऊ शकला नाही', body: 'नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'इनबॉक्स रिकामा', body: 'सध्या कोणत्याही व्यक्तीची वाट पाहत नाही — बाकीचे बॉट सांभाळत आहे.' },
      channel: { whatsapp: 'व्हॉट्सअ‍ॅप', sms: 'SMS', call: 'चुकलेले कॉल' },
      allChannels: 'सर्व',
      reasonMissedCall: 'चुकलेला कॉल — अजून प्रतिसाद नाही',
      relatedNote: 'या लीडकडून आणखी {{count}} प्रलंबित आयटम',
      waitingMinutes: '{{count}} मिनिटांपासून वाट पाहत आहे',
      waitingHours: '{{count}} तासांपासून वाट पाहत आहे',
      slaBreached: '1 तासाची प्रतिसाद मर्यादा ओलांडली',
      unassigned: 'नियुक्त नाही',
      assignedTo: '{{name}} कडे नियुक्त',
      action: {
        assign: 'नियुक्त करा',
        markHandled: 'हाताळले असे चिन्हांकित करा',
        callBack: 'परत कॉल करा',
        assignSheetTitle: 'यांना नियुक्त करा',
      },
      toast: {
        assigned: 'नियुक्त केले',
        handled: 'हाताळले असे चिन्हांकित झाले',
        calledBack: 'कॉलबॅक नोंदवला',
        error: 'जतन करता आले नाही — पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
