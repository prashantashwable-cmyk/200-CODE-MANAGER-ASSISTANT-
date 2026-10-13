import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    leaderboard: {
      title: 'Leaderboard',
      subtitle: 'Who to coach, and who to celebrate.',
      loading: 'Loading rankings',
      cohort: { surveyor: 'Surveyors', technician: 'Technicians' },
      period: { week: 'Last 7 days', month: 'Last 4 weeks', allTime: 'All time' },
      view: { ranked: 'Ranked', risingStars: 'Rising stars' },
      metric: {
        label: 'Rank by',
        leadsConverted: 'Leads converted',
        conversionRate: 'Conversion rate',
        revenue: 'Revenue influenced',
        jobsCompleted: 'Jobs completed',
        qualityScore: 'Quality score',
      },
      tieBreak: 'Rating {{value}} breaks any tie',
      newJoinerNote: 'New — partial period',
      excluded: 'Excluded',
      excludedNote: 'Pulled from ranking pending review: {{reason}}',
      exclude: 'Exclude from ranking',
      include: 'Restore to ranking',
      excludeReasonPrompt: 'Why is {{name}} being excluded?',
      rewardsSyncNote:
        'This ranking is what the Commission & Rewards module uses for its own contests — the two never drift apart.',
      improvement: '{{pct}}% change: last 4 weeks against the 4 before',
      noTrend: 'Nothing in the 4 weeks before to compare with',
      notRated: 'Not rated yet',
      rateAllTime: 'A rate is worked out over everything on record, whatever period is chosen.',
      small: 'Small sample',
      empty: {
        title: 'Nobody to rank yet',
        body: 'Once surveyors or technicians have some activity, they will appear here.',
      },
      error: {
        title: 'Could not load the leaderboard',
        body: 'We could not reach the performance data. Check your connection and try again.',
      },
    },
  },

  hi: {
    leaderboard: {
      title: 'लीडरबोर्ड',
      subtitle: 'किसे सिखाना है, और किसकी तारीफ़ करनी है।',
      loading: 'रैंकिंग लोड हो रही है',
      cohort: { surveyor: 'सर्वेक्षक', technician: 'तकनीशियन' },
      period: { week: 'पिछले 7 दिन', month: 'पिछले 4 हफ़्ते', allTime: 'हमेशा से' },
      view: { ranked: 'रैंक किया गया', risingStars: 'उभरते सितारे' },
      metric: {
        label: 'किस आधार पर रैंक करें',
        leadsConverted: 'बदले गए लीड',
        conversionRate: 'रूपांतरण दर',
        revenue: 'प्रभावित राजस्व',
        jobsCompleted: 'पूरे किए काम',
        qualityScore: 'गुणवत्ता स्कोर',
      },
      tieBreak: 'बराबरी होने पर रेटिंग {{value}} तय करती है',
      newJoinerNote: 'नया — अधूरी अवधि',
      excluded: 'बाहर रखा गया',
      excludedNote: 'समीक्षा तक रैंकिंग से बाहर: {{reason}}',
      exclude: 'रैंकिंग से बाहर करें',
      include: 'रैंकिंग में वापस लाएँ',
      excludeReasonPrompt: '{{name}} को बाहर क्यों किया जा रहा है?',
      rewardsSyncNote:
        'यही रैंकिंग कमीशन और रिवॉर्ड्स मॉड्यूल अपनी प्रतियोगिताओं के लिए इस्तेमाल करता है — दोनों कभी अलग नहीं पड़ते।',
      improvement: '{{pct}}% बदलाव: पिछले 4 हफ़्ते, उससे पहले के 4 हफ़्तों की तुलना में',
      noTrend: 'तुलना के लिए उससे पहले के 4 हफ़्तों में कुछ नहीं',
      notRated: 'अभी रेटिंग नहीं',
      rateAllTime: 'दर हमेशा पूरे दर्ज रिकॉर्ड पर निकाली जाती है, चाहे कोई भी अवधि चुनी हो।',
      small: 'छोटा नमूना',
      empty: {
        title: 'अभी रैंक करने को कोई नहीं',
        body: 'सर्वेक्षकों या तकनीशियनों की कुछ गतिविधि होते ही, वे यहाँ दिखने लगेंगे।',
      },
      error: {
        title: 'लीडरबोर्ड लोड नहीं हो पाया',
        body: 'हम प्रदर्शन डेटा तक नहीं पहुँच पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
    },
  },

  mr: {
    leaderboard: {
      title: 'लीडरबोर्ड',
      subtitle: 'कोणाला मार्गदर्शन करायचे, आणि कोणाचे कौतुक करायचे.',
      loading: 'क्रमवारी लोड होत आहे',
      cohort: { surveyor: 'सर्वेक्षक', technician: 'तंत्रज्ञ' },
      period: { week: 'मागील 7 दिवस', month: 'मागील 4 आठवडे', allTime: 'नेहमीपासून' },
      view: { ranked: 'क्रमवारी', risingStars: 'उदयोन्मुख तारे' },
      metric: {
        label: 'कशानुसार क्रमवारी लावा',
        leadsConverted: 'रूपांतरित लीड',
        conversionRate: 'रूपांतर दर',
        revenue: 'प्रभावित महसूल',
        jobsCompleted: 'पूर्ण केलेली कामे',
        qualityScore: 'गुणवत्ता गुण',
      },
      tieBreak: 'बरोबरी झाल्यास रेटिंग {{value}} ठरवते',
      newJoinerNote: 'नवीन — अर्धवट कालावधी',
      excluded: 'वगळलेले',
      excludedNote: 'तपासणीपर्यंत क्रमवारीतून वगळले: {{reason}}',
      exclude: 'क्रमवारीतून वगळा',
      include: 'क्रमवारीत परत आणा',
      excludeReasonPrompt: '{{name}} ला का वगळले जात आहे?',
      rewardsSyncNote:
        'हीच क्रमवारी कमिशन आणि रिवॉर्ड्स विभाग स्वतःच्या स्पर्धांसाठी वापरतो — दोन्ही कधीच वेगळे होत नाहीत.',
      improvement: '{{pct}}% बदल: मागील 4 आठवडे, त्याआधीच्या 4 आठवड्यांच्या तुलनेत',
      noTrend: 'तुलनेसाठी त्याआधीच्या 4 आठवड्यांत काही नाही',
      notRated: 'अजून मूल्यांकन नाही',
      rateAllTime: 'दर नेहमी संपूर्ण नोंदीवरून काढला जातो, कोणताही कालावधी निवडला तरी.',
      small: 'लहान नमुना',
      empty: {
        title: 'अजून क्रमवारी लावण्यासारखे कोणी नाही',
        body: 'सर्वेक्षक किंवा तंत्रज्ञांची काही हालचाल झाली की ते इथे दिसू लागतील.',
      },
      error: {
        title: 'लीडरबोर्ड लोड होऊ शकला नाही',
        body: 'आम्ही कामगिरीच्या माहितीपर्यंत पोहोचू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
