import type { ScreenTranslations } from '@/i18n/types';

/** Copy for the shared "Send to the Owner" card that Admin sees on screens whose actions are the Owner's. */
const translations: ScreenTranslations = {
  en: {
    sendToOwner: {
      title: 'This decision is the Owner\'s',
      body: 'Admin can see this screen but cannot approve, release, change rates, tiers or access. Send the Owner a request and it appears on the Decision Desk.',
      what: 'What should the Owner decide?', whatHint: 'At least {{min}} letters, e.g. "Release Santosh\'s installation payout".',
      why: 'Why, and what you have checked', whyHint: 'At least {{min}} letters. The Owner reads this before deciding.',
      send: 'Send to the Owner', sent: 'Sent to the Owner\'s Decision Desk as {{code}}.', error: 'Could not send it. Try again.',
    },
  },
  hi: {
    sendToOwner: {
      title: 'यह निर्णय मालिक का है',
      body: 'एडमिन यह स्क्रीन देख सकते हैं, पर मंज़ूरी, भुगतान जारी करना, दरें, स्तर या पहुँच बदलना नहीं कर सकते। मालिक को अनुरोध भेजें, वह निर्णय डेस्क पर दिखेगा।',
      what: 'मालिक को क्या तय करना है?', whatHint: 'कम से कम {{min}} अक्षर, जैसे "संतोष का इंस्टॉलेशन भुगतान जारी करें"।',
      why: 'क्यों, और आपने क्या जाँचा', whyHint: 'कम से कम {{min}} अक्षर। मालिक निर्णय से पहले इसे पढ़ेंगे।',
      send: 'मालिक को भेजें', sent: 'मालिक के निर्णय डेस्क पर {{code}} के रूप में भेजा गया।', error: 'भेजा नहीं जा सका। फिर से कोशिश करें।',
    },
  },
  mr: {
    sendToOwner: {
      title: 'हा निर्णय मालकाचा आहे',
      body: 'अ‍ॅडमिन ही स्क्रीन पाहू शकतात, पण मंजुरी, पैसे सोडणे, दर, स्तर किंवा प्रवेश बदलू शकत नाहीत. मालकाला विनंती पाठवा, ती निर्णय डेस्कवर दिसेल.',
      what: 'मालकाने काय ठरवायचे आहे?', whatHint: 'किमान {{min}} अक्षरे, उदा. "संतोषचे इन्स्टॉलेशन पेमेंट सोडा".',
      why: 'का, आणि तुम्ही काय तपासले', whyHint: 'किमान {{min}} अक्षरे. निर्णय घेण्यापूर्वी मालक हे वाचतील.',
      send: 'मालकाला पाठवा', sent: 'मालकाच्या निर्णय डेस्कवर {{code}} म्हणून पाठवले.', error: 'पाठवता आले नाही. पुन्हा प्रयत्न करा.',
    },
  },
};
export default translations;
