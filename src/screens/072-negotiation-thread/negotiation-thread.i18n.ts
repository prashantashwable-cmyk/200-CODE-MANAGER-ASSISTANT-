import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    negotiationThread: {
      title: 'Negotiation thread',
      finalizeTerms: 'Finalize deal terms',
      loading: 'Loading negotiation thread',
      error: { title: 'Could not load this negotiation', body: 'Check your connection and try again.' },

      header: {
        currentOffer: 'Current offer',
        floor: 'Floor',
        round: 'Round {{number}}',
      },

      status: {
        bot_active: 'Bot active',
        escalated: 'Escalated',
        human_takeover: 'Human handling',
        closed_won: 'Closed — won',
        closed_lost: 'Closed — lost',
      },

      escalationReason: {
        no_scenario_match: "Escalated — the customer's objection didn't match an approved scenario.",
        max_rounds_reached: 'Escalated — reached the maximum negotiation rounds.',
        manual_takeover: 'Taken over manually.',
      },

      takeOver: {
        banner: "Take over at any point to respond yourself — once you do, the bot steps aside from this conversation for good.",
        action: 'Take over',
      },

      bubble: {
        bot: 'Bot',
        photo: 'Photo',
        voice: 'Voice message',
      },

      composer: {
        placeholder: 'Type a reply…',
        send: 'Send',
        botHandlingNote: 'The bot is handling this conversation. Take over to reply directly.',
        closedNote: 'This negotiation is closed.',
      },

      empty: { title: 'No messages yet', body: 'This conversation will appear here once it starts.' },

      toast: {
        takenOver: "You're now in control of this conversation",
        sent: 'Message sent',
        error: 'Something went wrong. Please try again.',
      },
    },
  },
  hi: {
    negotiationThread: {
      title: 'बातचीत थ्रेड',
      finalizeTerms: 'डील शर्तें अंतिम करें',
      loading: 'बातचीत थ्रेड लोड हो रही है',
      error: { title: 'यह बातचीत लोड नहीं हो सकी', body: 'अपना कनेक्शन जांचें और फिर से कोशिश करें।' },

      header: {
        currentOffer: 'मौजूदा प्रस्ताव',
        floor: 'न्यूनतम सीमा',
        round: 'राउंड {{number}}',
      },

      status: {
        bot_active: 'बॉट सक्रिय',
        escalated: 'आगे भेजा गया',
        human_takeover: 'व्यक्ति संभाल रहा है',
        closed_won: 'बंद — सौदा जीता',
        closed_lost: 'बंद — सौदा हाथ से गया',
      },

      escalationReason: {
        no_scenario_match: 'आगे भेजा गया — ग्राहक की आपत्ति किसी स्वीकृत परिदृश्य से मेल नहीं खाई।',
        max_rounds_reached: 'आगे भेजा गया — अधिकतम बातचीत राउंड पूरे हो गए।',
        manual_takeover: 'खुद संभाला गया।',
      },

      takeOver: {
        banner: 'किसी भी समय खुद जवाब देने के लिए बातचीत संभालें — ऐसा करते ही बॉट इस बातचीत से हमेशा के लिए हट जाएगा।',
        action: 'संभालें',
      },

      bubble: {
        bot: 'बॉट',
        photo: 'फोटो',
        voice: 'वॉइस संदेश',
      },

      composer: {
        placeholder: 'जवाब लिखें…',
        send: 'भेजें',
        botHandlingNote: 'यह बातचीत फ़िलहाल बॉट संभाल रहा है। सीधे जवाब देने के लिए इसे अपने हाथ में लें।',
        closedNote: 'यह बातचीत बंद हो चुकी है।',
      },

      empty: { title: 'अभी कोई संदेश नहीं', body: 'शुरू होते ही यह बातचीत यहां दिखाई देगी।' },

      toast: {
        takenOver: 'अब यह बातचीत आपके नियंत्रण में है',
        sent: 'संदेश भेजा गया',
        error: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
      },
    },
  },
  mr: {
    negotiationThread: {
      title: 'वाटाघाटी थ्रेड',
      finalizeTerms: 'डील अटी अंतिम करा',
      loading: 'वाटाघाटी थ्रेड लोड होत आहे',
      error: { title: 'ही वाटाघाटी लोड होऊ शकली नाही', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },

      header: {
        currentOffer: 'सध्याची ऑफर',
        floor: 'किमान मर्यादा',
        round: 'फेरी {{number}}',
      },

      status: {
        bot_active: 'बॉट सक्रिय',
        escalated: 'पुढे पाठवले',
        human_takeover: 'व्यक्ती हाताळत आहे',
        closed_won: 'बंद — सौदा जिंकला',
        closed_lost: 'बंद — सौदा हुकला',
      },

      escalationReason: {
        no_scenario_match: 'पुढे पाठवले — ग्राहकाची हरकत कोणत्याही मंजूर परिस्थितीशी जुळली नाही.',
        max_rounds_reached: 'पुढे पाठवले — जास्तीत जास्त वाटाघाटी फेऱ्या पूर्ण झाल्या.',
        manual_takeover: 'स्वतः हाताळले.',
      },

      takeOver: {
        banner: 'कधीही स्वतः उत्तर देण्यासाठी संभाषण हाती घ्या — असे केल्यावर बॉट या संभाषणातून कायमचा बाजूला होईल.',
        action: 'हाती घ्या',
      },

      bubble: {
        bot: 'बॉट',
        photo: 'फोटो',
        voice: 'व्हॉइस संदेश',
      },

      composer: {
        placeholder: 'उत्तर लिहा…',
        send: 'पाठवा',
        botHandlingNote: 'हे संभाषण सध्या बॉट हाताळत आहे. थेट उत्तर देण्यासाठी ते हाती घ्या.',
        closedNote: 'हे संभाषण बंद झाले आहे.',
      },

      empty: { title: 'अजून कोणतेही संदेश नाहीत', body: 'सुरू होताच हे संभाषण इथे दिसेल.' },

      toast: {
        takenOver: 'आता हे संभाषण तुमच्या नियंत्रणात आहे',
        sent: 'संदेश पाठवला',
        error: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
