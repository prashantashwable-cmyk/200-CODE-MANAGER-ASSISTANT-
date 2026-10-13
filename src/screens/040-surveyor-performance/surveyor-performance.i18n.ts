import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    surveyorPerformance: {
      title: 'My performance',
      subtitle: 'How far you have come, not a scoreboard to fear.',
      loading: 'Loading your stats',
      stat: {
        leads: 'Leads captured',
        conversion: 'Conversion rate',
        revenue: 'Revenue influenced',
        accuracy: 'Site check accuracy',
      },
      trendHeading: 'Leads per week',
      rankHeading: 'Where you stand',
      rankValue: '#{{rank}} of {{total}} surveyors',
      rankEncouragement: 'Every lead you capture moves this — there is always a next step up.',
      contest: {
        heading: 'Current contest',
        standing: 'Standing: {{position}}',
        prize: 'At stake: {{prize}}',
        inProgress: 'Standings update as the contest runs — nothing is final until it ends.',
        none: {
          title: 'No contest running right now',
          body: 'No company-wide contest is active at the moment. Your own stats above are worth being proud of either way — check back for the next one.',
        },
      },
      badgesHeading: 'Badges',
      badge: {
        firstLead: { label: 'First lead', description: 'Capture your very first lead.' },
        tenLeads: { label: '10 leads captured', description: 'Reach ten captured leads.' },
        fiftyLeads: { label: '50 leads captured', description: 'Reach fifty captured leads.' },
        hotStreak: { label: 'Hot streak', description: 'Convert three leads to won deals.' },
        cleanRecord: { label: 'Clean record', description: 'Five or more leads with zero flagged duplicates.' },
        topConverter: { label: 'Top converter', description: 'Hold a 50% or better conversion rate.' },
      },
      badgeEarned: 'Earned',
      badgeProgress: '{{progress}} of {{target}}',
      error: {
        title: 'Could not load your performance',
        body: 'We could not reach your data. Check your connection and try again.',
      },
    },
  },

  hi: {
    surveyorPerformance: {
      title: 'मेरा प्रदर्शन',
      subtitle: 'आप कितनी दूर आए, यह डरने वाला स्कोरबोर्ड नहीं है।',
      loading: 'आपके आँकड़े लोड हो रहे हैं',
      stat: {
        leads: 'दर्ज लीड',
        conversion: 'रूपांतरण दर',
        revenue: 'प्रभावित राजस्व',
        accuracy: 'साइट जाँच सटीकता',
      },
      trendHeading: 'हफ़्ते के हिसाब से लीड',
      rankHeading: 'आप कहाँ खड़े हैं',
      rankValue: '{{total}} सर्वेक्षकों में #{{rank}}',
      rankEncouragement: 'आपका हर दर्ज लीड इसे आगे बढ़ाता है — हमेशा एक अगला क़दम बाक़ी रहता है।',
      contest: {
        heading: 'मौजूदा प्रतियोगिता',
        standing: 'स्थिति: {{position}}',
        prize: 'दांव पर: {{prize}}',
        inProgress: 'प्रतियोगिता चलते हुए स्थिति बदलती रहती है — ख़त्म होने तक कुछ भी अंतिम नहीं है।',
        none: {
          title: 'अभी कोई प्रतियोगिता नहीं चल रही',
          body: 'फ़िलहाल कोई कंपनी-व्यापी प्रतियोगिता सक्रिय नहीं है। ऊपर आपके अपने आँकड़े फिर भी गर्व करने लायक हैं — अगली प्रतियोगिता के लिए दोबारा देखिए।',
        },
      },
      badgesHeading: 'बैज',
      badge: {
        firstLead: { label: 'पहला लीड', description: 'अपना पहला लीड दर्ज कीजिए।' },
        tenLeads: { label: '10 लीड दर्ज', description: 'दस दर्ज लीड तक पहुँचिए।' },
        fiftyLeads: { label: '50 लीड दर्ज', description: 'पचास दर्ज लीड तक पहुँचिए।' },
        hotStreak: { label: 'शानदार लय', description: 'तीन लीड जीते हुए सौदों में बदलिए।' },
        cleanRecord: { label: 'साफ़ रिकॉर्ड', description: 'पाँच या ज़्यादा लीड, बिना किसी डुप्लिकेट निशान के।' },
        topConverter: { label: 'सबसे बेहतर रूपांतरण', description: '50% या उससे बेहतर रूपांतरण दर बनाए रखिए।' },
      },
      badgeEarned: 'मिल गया',
      badgeProgress: '{{target}} में से {{progress}}',
      error: {
        title: 'आपका प्रदर्शन लोड नहीं हो पाया',
        body: 'हम आपके डेटा तक नहीं पहुँच पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
    },
  },

  mr: {
    surveyorPerformance: {
      title: 'माझी कामगिरी',
      subtitle: 'तुम्ही किती पुढे आलात, ही भीती वाटावी असे गुणफलक नाही.',
      loading: 'तुमचे आकडे लोड होत आहेत',
      stat: {
        leads: 'नोंदवलेले लीड',
        conversion: 'रूपांतर दर',
        revenue: 'प्रभावित महसूल',
        accuracy: 'साइट तपासणी अचूकता',
      },
      trendHeading: 'आठवड्यानुसार लीड',
      rankHeading: 'तुम्ही कुठे आहात',
      rankValue: '{{total}} सर्वेक्षकांपैकी #{{rank}}',
      rankEncouragement: 'तुमचा प्रत्येक नोंदवलेला लीड हे पुढे नेतो — नेहमी पुढचे पाऊल बाकी असते.',
      contest: {
        heading: 'सध्याची स्पर्धा',
        standing: 'स्थिती: {{position}}',
        prize: 'पणाला: {{prize}}',
        inProgress: 'स्पर्धा चालू असताना स्थिती बदलत राहते — संपेपर्यंत काहीही अंतिम नाही.',
        none: {
          title: 'सध्या कोणतीही स्पर्धा चालू नाही',
          body: 'सध्या कोणतीही कंपनी-व्यापी स्पर्धा सक्रिय नाही. वरचे तुमचे स्वतःचे आकडे तरीही अभिमानास्पद आहेत — पुढच्या स्पर्धेसाठी पुन्हा पहा.',
        },
      },
      badgesHeading: 'बॅज',
      badge: {
        firstLead: { label: 'पहिला लीड', description: 'तुमचा पहिला लीड नोंदवा.' },
        tenLeads: { label: '10 लीड नोंदवले', description: 'दहा नोंदवलेल्या लीडपर्यंत पोहोचा.' },
        fiftyLeads: { label: '50 लीड नोंदवले', description: 'पन्नास नोंदवलेल्या लीडपर्यंत पोहोचा.' },
        hotStreak: { label: 'जबरदस्त लय', description: 'तीन लीड जिंकलेल्या व्यवहारांत बदला.' },
        cleanRecord: { label: 'स्वच्छ नोंद', description: 'पाच किंवा अधिक लीड, कोणतीही डुप्लिकेट खूण न होता.' },
        topConverter: { label: 'सर्वोत्तम रूपांतरक', description: '50% किंवा त्याहून चांगला रूपांतर दर राखा.' },
      },
      badgeEarned: 'मिळाले',
      badgeProgress: '{{target}} पैकी {{progress}}',
      error: {
        title: 'तुमची कामगिरी लोड होऊ शकली नाही',
        body: 'आम्ही तुमच्या माहितीपर्यंत पोहोचू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
