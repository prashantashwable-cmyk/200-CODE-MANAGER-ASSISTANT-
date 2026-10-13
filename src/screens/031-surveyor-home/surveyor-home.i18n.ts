import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    surveyorHome: {
      title: 'Home',
      greeting: 'Hello, {{name}}',
      loading: 'Loading your day',
      captureNew: 'Capture new lead',
      stat: {
        leadsToday: 'Leads today',
        followUpsDue: 'Follow-ups due',
        weeklyCommission: 'This week',
        rank: 'Your rank',
      },
      rankValue: '#{{rank}} of {{total}}',
      followUpsHeading: "Today's follow-ups",
      followUpsEmpty: 'Nothing due today. A good day to walk a new site.',
      overdue: 'Overdue',
      dueAt: 'Due {{time}}',
      quickLinks: 'Everything else',
      link: {
        route: 'My route',
        leads: 'My leads',
        earnings: 'My earnings',
        performance: 'My performance',
      },
      firstDay: {
        title: 'Your first lead starts here',
        body: 'Tap Capture New Lead above and walk through the site — GPS, photos, and the owner\'s details. It takes a few minutes.',
      },
      lastSynced: 'Synced {{time}}',
      offlineNote: 'Offline — showing what was last synced {{time}}.',
      error: {
        title: 'Could not load your home screen',
        body: 'We could not reach your data. Check your connection and try again.',
      },
    },
  },

  hi: {
    surveyorHome: {
      title: 'होम',
      greeting: 'नमस्ते, {{name}}',
      loading: 'आपका दिन लोड हो रहा है',
      captureNew: 'नया लीड दर्ज करें',
      stat: {
        leadsToday: 'आज के लीड',
        followUpsDue: 'फ़ॉलो-अप बाक़ी',
        weeklyCommission: 'इस हफ़्ते',
        rank: 'आपकी रैंक',
      },
      rankValue: '#{{rank}} / {{total}}',
      followUpsHeading: 'आज के फ़ॉलो-अप',
      followUpsEmpty: 'आज कुछ बाक़ी नहीं। नई साइट देखने का अच्छा दिन है।',
      overdue: 'समय बीत गया',
      dueAt: '{{time}} तय',
      quickLinks: 'बाक़ी सब कुछ',
      link: {
        route: 'मेरा रूट',
        leads: 'मेरे लीड',
        earnings: 'मेरी कमाई',
        performance: 'मेरा प्रदर्शन',
      },
      firstDay: {
        title: 'आपका पहला लीड यहीं से शुरू होता है',
        body: 'ऊपर नया लीड दर्ज करें दबाइए और साइट पर चलिए — GPS, फ़ोटो, और मालिक की जानकारी। कुछ ही मिनट लगते हैं।',
      },
      lastSynced: '{{time}} सिंक हुआ',
      offlineNote: 'ऑफ़लाइन — {{time}} सिंक हुआ डेटा दिखा रहे हैं।',
      error: {
        title: 'आपका होम स्क्रीन लोड नहीं हो पाया',
        body: 'हम आपके डेटा तक नहीं पहुँच पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
    },
  },

  mr: {
    surveyorHome: {
      title: 'होम',
      greeting: 'नमस्कार, {{name}}',
      loading: 'तुमचा दिवस लोड होत आहे',
      captureNew: 'नवीन लीड नोंदवा',
      stat: {
        leadsToday: 'आजचे लीड',
        followUpsDue: 'पाठपुरावा बाकी',
        weeklyCommission: 'या आठवड्यात',
        rank: 'तुमची क्रमवारी',
      },
      rankValue: '#{{rank}} / {{total}}',
      followUpsHeading: 'आजचा पाठपुरावा',
      followUpsEmpty: 'आज काही बाकी नाही. नवीन साइट पाहण्यासाठी चांगला दिवस.',
      overdue: 'वेळ उलटली',
      dueAt: '{{time}} ठरले',
      quickLinks: 'बाकी सर्व काही',
      link: {
        route: 'माझा मार्ग',
        leads: 'माझे लीड',
        earnings: 'माझी कमाई',
        performance: 'माझी कामगिरी',
      },
      firstDay: {
        title: 'तुमचा पहिला लीड इथूनच सुरू होतो',
        body: 'वरचे नवीन लीड नोंदवा दाबा आणि साइटवर फिरा — GPS, फोटो, आणि मालकाची माहिती. काही मिनिटेच लागतात.',
      },
      lastSynced: '{{time}} सिंक झाले',
      offlineNote: 'ऑफलाइन — {{time}} सिंक झालेली माहिती दाखवत आहे.',
      error: {
        title: 'तुमची होम स्क्रीन लोड होऊ शकली नाही',
        body: 'आम्ही तुमच्या माहितीपर्यंत पोहोचू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
