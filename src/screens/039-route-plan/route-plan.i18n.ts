import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    routePlan: {
      title: "Today's route",
      subtitle: 'A sensible order to work through — yours to change any time.',
      loading: 'Building your route',
      mapLabel: "Today's suggested stops",
      advisoryNote: 'This is a suggestion, not a schedule. Reorder or skip freely — nothing here is held against you.',
      summary: { planned: 'Planned', done: 'Done', skipped: 'Skipped', remaining: 'Left' },
      totals: { distance: '{{km}} km total', time: '{{minutes}} min total' },
      stop: {
        window: '{{start}} – {{end}}',
        leg: '{{km}} km, {{minutes}} min from the last stop',
        navigate: 'Navigate',
        arrive: "I'm here",
        complete: 'Mark done',
        skip: 'Skip',
        moveUp: 'Move earlier',
        moveDown: 'Move later',
      },
      status: { pending: 'Upcoming', arrived: 'On site', done: 'Done', skipped: 'Skipped' },
      exploration: {
        title: 'Nothing assigned today',
        body: "No follow-ups are due and you don't have a specific stop planned. A good day to explore your territory for fresh sites — capture whatever you find.",
      },
      empty: {
        title: 'No route planned',
        body: 'Once you have follow-ups due or an assigned territory, a suggested route will build itself here.',
        action: 'Capture a new lead instead',
      },
      error: {
        title: 'Could not load your route',
        body: 'We could not reach your route data. Check your connection and try again.',
      },
    },
  },

  hi: {
    routePlan: {
      title: 'आज का रूट',
      subtitle: 'काम करने का सही क्रम — जब चाहें बदल लीजिए।',
      loading: 'आपका रूट बन रहा है',
      mapLabel: 'आज के सुझाए गए पड़ाव',
      advisoryNote: 'यह एक सुझाव है, तय समय-सारणी नहीं। बेझिझक क्रम बदलिए या छोड़िए — इसका आप पर कोई असर नहीं पड़ता।',
      summary: { planned: 'तय', done: 'हुए', skipped: 'छोड़े', remaining: 'बाक़ी' },
      totals: { distance: 'कुल {{km}} किमी', time: 'कुल {{minutes}} मिनट' },
      stop: {
        window: '{{start}} – {{end}}',
        leg: 'पिछले पड़ाव से {{km}} किमी, {{minutes}} मिनट',
        navigate: 'रास्ता दिखाएँ',
        arrive: 'मैं पहुँच गया',
        complete: 'पूरा मार्क करें',
        skip: 'छोड़ें',
        moveUp: 'पहले करें',
        moveDown: 'बाद में करें',
      },
      status: { pending: 'आने वाला', arrived: 'साइट पर', done: 'हो गया', skipped: 'छोड़ा' },
      exploration: {
        title: 'आज कुछ तय नहीं है',
        body: 'कोई फ़ॉलो-अप बाक़ी नहीं है और कोई ख़ास पड़ाव तय नहीं है। अपने इलाक़े में नई साइटें ढूँढने का अच्छा दिन है — जो भी मिले, दर्ज कर लीजिए।',
      },
      empty: {
        title: 'कोई रूट तय नहीं',
        body: 'जैसे ही आपके फ़ॉलो-अप बाक़ी हों या कोई इलाक़ा तय हो, यहाँ अपने आप एक सुझाया रूट बन जाएगा।',
        action: 'इसके बजाय नया लीड दर्ज करें',
      },
      error: {
        title: 'आपका रूट लोड नहीं हो पाया',
        body: 'हम आपके रूट डेटा तक नहीं पहुँच पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
    },
  },

  mr: {
    routePlan: {
      title: 'आजचा मार्ग',
      subtitle: 'काम करण्याचा योग्य क्रम — केव्हाही बदलू शकता.',
      loading: 'तुमचा मार्ग तयार होत आहे',
      mapLabel: 'आजचे सुचवलेले थांबे',
      advisoryNote: 'ही सूचना आहे, ठरलेले वेळापत्रक नाही. बिनधास्त क्रम बदला किंवा वगळा — याचा तुमच्यावर काहीही परिणाम होत नाही.',
      summary: { planned: 'ठरले', done: 'झाले', skipped: 'वगळले', remaining: 'बाकी' },
      totals: { distance: 'एकूण {{km}} किमी', time: 'एकूण {{minutes}} मिनिटे' },
      stop: {
        window: '{{start}} – {{end}}',
        leg: 'मागील थांब्यापासून {{km}} किमी, {{minutes}} मिनिटे',
        navigate: 'मार्ग दाखवा',
        arrive: 'मी पोहोचलो',
        complete: 'पूर्ण म्हणून चिन्हांकित करा',
        skip: 'वगळा',
        moveUp: 'आधी करा',
        moveDown: 'नंतर करा',
      },
      status: { pending: 'येणारे', arrived: 'साइटवर', done: 'झाले', skipped: 'वगळले' },
      exploration: {
        title: 'आज काहीही ठरलेले नाही',
        body: 'कोणताही पाठपुरावा बाकी नाही आणि कोणताही खास थांबा ठरलेला नाही. तुमच्या भागात नवीन साइट शोधण्यासाठी चांगला दिवस — जे सापडेल ते नोंदवा.',
      },
      empty: {
        title: 'कोणताही मार्ग ठरलेला नाही',
        body: 'तुमचे पाठपुरावे बाकी असतील किंवा एखादा भाग नेमला असेल, की इथे आपोआप एक सुचवलेला मार्ग तयार होईल.',
        action: 'त्याऐवजी नवीन लीड नोंदवा',
      },
      error: {
        title: 'तुमचा मार्ग लोड होऊ शकला नाही',
        body: 'आम्ही तुमच्या मार्ग माहितीपर्यंत पोहोचू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
