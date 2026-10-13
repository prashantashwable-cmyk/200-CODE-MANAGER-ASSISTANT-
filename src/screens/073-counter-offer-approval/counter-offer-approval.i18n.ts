import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    counterOfferApproval: {
      title: 'Counter-Offer Approval',
      subtitle: 'Genuinely borderline asks the bot escalated for a judgment call — everything else is already bot-handled or declined.',
      loading: 'Loading the counter-offer queue',
      error: { title: 'Could not load the counter-offer queue', body: 'Check your connection and try again.' },
      empty: { title: 'Nothing waiting on you', body: 'Borderline counter-offers will appear here as the bot escalates them.' },

      row: {
        customerAsk: "Customer's ask",
        standardPrice: 'Standard price',
        marginImpact: 'Margin if accepted: {{pct}}%',
        companyFloor: 'Company floor: {{pct}}%',
        bundledConcession: 'Also wants:',
        consolidatedNote: 'Consolidates {{count}} earlier ask(s) from this same customer.',
        waiting: 'Waiting {{time}}',
        slaBreached: 'Waiting {{time}} — overdue',
      },

      actions: {
        approve: 'Approve',
        reject: 'Reject',
        counter: 'Counter',
      },

      rejectSheet: {
        title: 'Reject this counter-offer',
        reasonLabel: 'Reason',
        submit: 'Reject',
      },

      counterSheet: {
        title: 'Offer a different number',
        priceLabel: 'Counter price',
        belowFloorWarning: "A counter below the company's true margin floor is rejected automatically.",
        submit: 'Send counter',
      },

      toast: {
        approved: "Approved — the customer's conversation has been updated",
        rejected: 'Rejected',
        countered: 'Counter-offer sent',
        error: 'Something went wrong. Please try again.',
      },
    },
  },
  hi: {
    counterOfferApproval: {
      title: 'काउंटर-ऑफ़र मंज़ूरी',
      subtitle: 'सचमुच सीमा-रेखा वाली माँगें जिन्हें बॉट ने फ़ैसले के लिए आगे भेजा है — बाकी सब बॉट पहले ही संभाल चुका है या ठुकरा चुका है।',
      loading: 'काउंटर-ऑफ़र क़तार लोड हो रही है',
      error: { title: 'काउंटर-ऑफ़र क़तार लोड नहीं हो सकी', body: 'अपना कनेक्शन जांचें और फिर से कोशिश करें।' },
      empty: { title: 'आपके लिए कुछ भी लंबित नहीं है', body: 'जैसे ही बॉट किसी सीमा-रेखा काउंटर-ऑफ़र को आगे भेजेगा, वह यहां दिखेगा।' },

      row: {
        customerAsk: 'ग्राहक की माँग',
        standardPrice: 'मानक मूल्य',
        marginImpact: 'स्वीकार करने पर मार्जिन: {{pct}}%',
        companyFloor: 'कंपनी की न्यूनतम सीमा: {{pct}}%',
        bundledConcession: 'इसके अलावा चाहते हैं:',
        consolidatedNote: 'इसी ग्राहक की {{count}} पहले की माँग(ओं) को भी इसमें शामिल किया गया है।',
        waiting: '{{time}} से प्रतीक्षा में',
        slaBreached: '{{time}} से प्रतीक्षा में — समय-सीमा पार',
      },

      actions: {
        approve: 'मंज़ूर करें',
        reject: 'अस्वीकार करें',
        counter: 'काउंटर करें',
      },

      rejectSheet: {
        title: 'यह काउंटर-ऑफ़र अस्वीकार करें',
        reasonLabel: 'कारण',
        submit: 'अस्वीकार करें',
      },

      counterSheet: {
        title: 'एक अलग रकम पेश करें',
        priceLabel: 'काउंटर मूल्य',
        belowFloorWarning: 'कंपनी की वास्तविक न्यूनतम मार्जिन सीमा से नीचे का काउंटर अपने आप अस्वीकार हो जाता है।',
        submit: 'काउंटर भेजें',
      },

      toast: {
        approved: 'मंज़ूर किया गया — ग्राहक की बातचीत अपडेट कर दी गई है',
        rejected: 'अस्वीकार किया गया',
        countered: 'काउंटर-ऑफ़र भेजा गया',
        error: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
      },
    },
  },
  mr: {
    counterOfferApproval: {
      title: 'काउंटर-ऑफर मंजुरी',
      subtitle: 'खरोखर सीमारेषेवरील मागण्या ज्या बॉटने निर्णयासाठी पुढे पाठवल्या आहेत — बाकी सर्व बॉटने आधीच हाताळले किंवा नाकारले आहे.',
      loading: 'काउंटर-ऑफर रांग लोड होत आहे',
      error: { title: 'काउंटर-ऑफर रांग लोड होऊ शकली नाही', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'तुमच्यासाठी काहीही प्रलंबित नाही', body: 'बॉटने एखादी सीमारेषेवरील काउंटर-ऑफर पुढे पाठवताच ती इथे दिसेल.' },

      row: {
        customerAsk: 'ग्राहकाची मागणी',
        standardPrice: 'मानक किंमत',
        marginImpact: 'स्वीकारल्यास मार्जिन: {{pct}}%',
        companyFloor: 'कंपनीची किमान मर्यादा: {{pct}}%',
        bundledConcession: 'याशिवाय हवे आहे:',
        consolidatedNote: 'याच ग्राहकाच्या {{count}} आधीच्या मागण्याही यात समाविष्ट केल्या आहेत.',
        waiting: '{{time}} पासून प्रतीक्षेत',
        slaBreached: '{{time}} पासून प्रतीक्षेत — मुदत उलटली',
      },

      actions: {
        approve: 'मंजूर करा',
        reject: 'नाकारा',
        counter: 'काउंटर करा',
      },

      rejectSheet: {
        title: 'ही काउंटर-ऑफर नाकारा',
        reasonLabel: 'कारण',
        submit: 'नाकारा',
      },

      counterSheet: {
        title: 'वेगळी रक्कम सुचवा',
        priceLabel: 'काउंटर किंमत',
        belowFloorWarning: 'कंपनीच्या खऱ्या किमान मार्जिन मर्यादेखालील काउंटर आपोआप नाकारला जातो.',
        submit: 'काउंटर पाठवा',
      },

      toast: {
        approved: 'मंजूर केले — ग्राहकाचे संभाषण अद्ययावत केले आहे',
        rejected: 'नाकारले',
        countered: 'काउंटर-ऑफर पाठवली',
        error: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
