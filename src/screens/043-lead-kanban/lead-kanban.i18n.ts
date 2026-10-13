import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    leadKanban: {
      title: 'Pipeline board',
      subtitle: 'Every active lead, by stage.',
      loading: 'Loading the board',
      error: { title: 'Could not load the board', body: 'Check your connection and try again.' },
      columnCount: '{{count}}',
      daysInStage: '{{count}}d in stage',
      staleTag: 'Stalled',
      photoCount: '{{count}} photos',
      unassigned: 'Unassigned',
      moveSheet: {
        title: 'Move — {{site}}',
        moveTo: 'Move to',
        openDetail: 'Open full lead detail',
        blockedQuoted: 'Link a quotation to this lead first.',
        blockedWon: 'Needs an agreed deal price first.',
      },
      toast: {
        moved: 'Stage updated',
        blockedQuoted: 'Blocked — link a quotation before moving to Quoted.',
        blockedWon: 'Blocked — an agreed deal price is required to mark Won.',
      },
      dragHint: 'Drag a card to change its stage, or tap it on a phone.',
    },
  },

  hi: {
    leadKanban: {
      title: 'पाइपलाइन बोर्ड',
      subtitle: 'हर सक्रिय लीड, स्टेज के हिसाब से।',
      loading: 'बोर्ड लोड हो रहा है',
      error: { title: 'बोर्ड लोड नहीं हो पाया', body: 'नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।' },
      columnCount: '{{count}}',
      daysInStage: 'स्टेज में {{count}} दिन',
      staleTag: 'रुका हुआ',
      photoCount: '{{count}} फ़ोटो',
      unassigned: 'अनसाइन्ड',
      moveSheet: {
        title: 'ले जाएँ — {{site}}',
        moveTo: 'यहाँ ले जाएँ',
        openDetail: 'पूरी लीड जानकारी खोलें',
        blockedQuoted: 'पहले इस लीड से एक कोटेशन जोड़िए।',
        blockedWon: 'पहले एक सहमत डील मूल्य ज़रूरी है।',
      },
      toast: {
        moved: 'स्टेज अपडेट हो गया',
        blockedQuoted: 'रोका गया — कोटेशन चरण में भेजने से पहले एक कोटेशन जोड़िए।',
        blockedWon: 'रोका गया — ‘मिल गया’ चिह्नित करने के लिए सहमत डील मूल्य ज़रूरी है।',
      },
      dragHint: 'स्टेज बदलने के लिए कार्ड खींचिए, या फ़ोन पर उसे टैप कीजिए।',
    },
  },

  mr: {
    leadKanban: {
      title: 'पाइपलाइन बोर्ड',
      subtitle: 'प्रत्येक सक्रिय लीड, स्टेजनुसार.',
      loading: 'बोर्ड लोड होत आहे',
      error: { title: 'बोर्ड लोड होऊ शकला नाही', body: 'नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.' },
      columnCount: '{{count}}',
      daysInStage: 'स्टेजमध्ये {{count}} दिवस',
      staleTag: 'थांबलेले',
      photoCount: '{{count}} फोटो',
      unassigned: 'नेमणूक न झालेले',
      moveSheet: {
        title: 'हलवा — {{site}}',
        moveTo: 'इथे हलवा',
        openDetail: 'संपूर्ण लीड तपशील उघडा',
        blockedQuoted: 'आधी या लीडला एक कोटेशन जोडा.',
        blockedWon: 'आधी मान्य डील किंमत आवश्यक आहे.',
      },
      toast: {
        moved: 'स्टेज अपडेट झाले',
        blockedQuoted: 'अडवले — कोटेशन टप्प्यात नेण्याआधी एक कोटेशन जोडा.',
        blockedWon: 'अडवले — ‘मिळाले’ चिन्हांकित करण्यासाठी मान्य डील किंमत आवश्यक आहे.',
      },
      dragHint: 'स्टेज बदलण्यासाठी कार्ड ओढा, किंवा फोनवर त्यावर टॅप करा.',
    },
  },
};

export default translations;
