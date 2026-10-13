import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    duplicateMerge: {
      title: 'Duplicate leads',
      subtitle: 'Flagged pairs awaiting a decision.',
      loading: 'Loading flagged duplicates',
      error: { title: 'Could not load duplicates', body: 'Check your connection and try again.' },
      empty: { title: 'No duplicates flagged', body: 'The queue is clear — nothing is waiting on a decision right now.' },
      queueHeading: '{{count}} awaiting review',
      detectedAgo: 'Flagged {{time}}',
      compare: {
        capturedBy: 'Captured by',
        capturedAt: 'Captured',
        stage: 'Stage',
        contact: 'Contact',
        value: 'Value',
        distance: '{{metres}} m apart',
        keepThis: 'Keep this one',
        primaryTag: 'Keeping',
      },
      impact: {
        heading: 'Commission impact',
        summary: '{{keeper}} keeps the capture bonus for {{keptCode}}; {{loser}}’s duplicate entry earns no further commission if merged.',
      },
      actions: {
        merge: 'Merge',
        notDuplicate: 'These are genuinely different sites',
      },
      toast: {
        merged: 'Leads merged',
        notDuplicate: 'Marked as not a duplicate',
        error: 'Could not resolve this pair — try again.',
      },
    },
  },

  hi: {
    duplicateMerge: {
      title: 'डुप्लिकेट लीड',
      subtitle: 'फ़ैसले का इंतज़ार करती चिह्नित जोड़ियाँ।',
      loading: 'चिह्नित डुप्लिकेट लोड हो रहे हैं',
      error: { title: 'डुप्लिकेट लोड नहीं हो पाए', body: 'नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।' },
      empty: { title: 'कोई डुप्लिकेट चिह्नित नहीं', body: 'क्यू खाली है — अभी किसी फ़ैसले का इंतज़ार नहीं है।' },
      queueHeading: '{{count}} समीक्षा के इंतज़ार में',
      detectedAgo: '{{time}} चिह्नित हुआ',
      compare: {
        capturedBy: 'दर्ज किया',
        capturedAt: 'दर्ज हुआ',
        stage: 'स्टेज',
        contact: 'संपर्क',
        value: 'मूल्य',
        distance: '{{metres}} मी दूर',
        keepThis: 'यह रखें',
        primaryTag: 'रखा जा रहा',
      },
      impact: {
        heading: 'कमीशन पर असर',
        summary: '{{keeper}} को {{keptCode}} का कैप्चर बोनस मिलता रहेगा; मर्ज होने पर {{loser}} की डुप्लिकेट एंट्री को कोई और कमीशन नहीं मिलेगा।',
      },
      actions: {
        merge: 'मर्ज करें',
        notDuplicate: 'ये सच में अलग-अलग साइटें हैं',
      },
      toast: {
        merged: 'लीड मर्ज हो गए',
        notDuplicate: 'डुप्लिकेट नहीं के रूप में चिह्नित',
        error: 'यह जोड़ी हल नहीं हो पाई — दोबारा कोशिश करें।',
      },
    },
  },

  mr: {
    duplicateMerge: {
      title: 'डुप्लिकेट लीड',
      subtitle: 'निर्णयाच्या प्रतीक्षेत असलेल्या चिन्हांकित जोड्या.',
      loading: 'चिन्हांकित डुप्लिकेट लोड होत आहेत',
      error: { title: 'डुप्लिकेट लोड होऊ शकले नाहीत', body: 'नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'कोणतेही डुप्लिकेट चिन्हांकित नाही', body: 'क्यू रिकामी आहे — सध्या कोणत्याही निर्णयाची प्रतीक्षा नाही.' },
      queueHeading: '{{count}} पुनरावलोकनाच्या प्रतीक्षेत',
      detectedAgo: '{{time}} चिन्हांकित झाले',
      compare: {
        capturedBy: 'नोंदवले',
        capturedAt: 'नोंदवले तेव्हा',
        stage: 'स्टेज',
        contact: 'संपर्क',
        value: 'मूल्य',
        distance: '{{metres}} मी अंतरावर',
        keepThis: 'हे ठेवा',
        primaryTag: 'ठेवत आहोत',
      },
      impact: {
        heading: 'कमिशनवर परिणाम',
        summary: '{{keeper}}ला {{keptCode}}चे कॅप्चर बोनस मिळत राहील; विलीन झाल्यास {{loser}}च्या डुप्लिकेट नोंदीला पुढे कोणतेही कमिशन मिळणार नाही.',
      },
      actions: {
        merge: 'विलीन करा',
        notDuplicate: 'या खरोखर वेगळ्या साइट्स आहेत',
      },
      toast: {
        merged: 'लीड विलीन झाले',
        notDuplicate: 'डुप्लिकेट नाही म्हणून चिन्हांकित',
        error: 'ही जोडी निकाली काढता आली नाही — पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
