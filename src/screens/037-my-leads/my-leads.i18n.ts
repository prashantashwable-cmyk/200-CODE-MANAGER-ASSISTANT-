import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    myLeads: {
      title: 'My leads',
      subtitle: 'Every site you have ever captured, and what happened to it.',
      loading: 'Loading your leads',
      searchPlaceholder: 'Search by site or builder name',
      summary: {
        total: 'Captured',
        won: 'Converted',
        conversion: 'Conversion',
        matchesNote: 'This is the same formula Admin uses for your conversion rate — the two numbers always agree.',
      },
      loadMore: 'Show more',
      allLoaded: 'That is everything.',
      daysInStage: '{{days}} days here',
      readOnlyNote: 'This is a read-only view of the lead\'s current status — stage changes are made by the sales team from here on.',
      empty: {
        title: 'No leads captured yet',
        body: 'Once you capture your first lead, it will show up here with its stage kept up to date automatically.',
      },
      noResults: {
        title: 'No leads match',
        body: 'Try a different search or clear the stage filters.',
      },
      error: {
        title: 'Could not load your leads',
        body: 'We could not reach your data. Check your connection and try again.',
      },
      detail: {
        title: 'Lead {{code}}',
        stageHistory: 'Stage history',
        estimatedValue: 'Estimated value',
        incentive: 'Your incentive',
        contact: 'Contact',
        lostReason: 'Why it was lost',
      },
    },
  },

  hi: {
    myLeads: {
      title: 'मेरे लीड',
      subtitle: 'आपने अब तक जो भी साइट दर्ज की, और उसका क्या हुआ।',
      loading: 'आपके लीड लोड हो रहे हैं',
      searchPlaceholder: 'साइट या बिल्डर के नाम से खोजें',
      summary: {
        total: 'दर्ज हुए',
        won: 'बदले',
        conversion: 'रूपांतरण',
        matchesNote: 'यही वही फ़ॉर्मूला है जो एडमिन आपकी रूपांतरण दर के लिए इस्तेमाल करता है — दोनों आँकड़े हमेशा मेल खाते हैं।',
      },
      loadMore: 'और दिखाएँ',
      allLoaded: 'बस, इतना ही है।',
      daysInStage: 'यहाँ {{days}} दिन से',
      readOnlyNote: 'यह लीड की मौजूदा स्थिति का सिर्फ़ देखने वाला दृश्य है — यहाँ से आगे चरण बदलाव बिक्री टीम करती है।',
      empty: {
        title: 'अभी कोई लीड दर्ज नहीं हुआ',
        body: 'आपका पहला लीड दर्ज होते ही, वह यहाँ दिखेगा और उसका चरण अपने आप अपडेट होता रहेगा।',
      },
      noResults: {
        title: 'कोई लीड मेल नहीं खाता',
        body: 'कोई दूसरी खोज आज़माइए या चरण फ़िल्टर हटाइए।',
      },
      error: {
        title: 'आपके लीड लोड नहीं हो पाए',
        body: 'हम आपके डेटा तक नहीं पहुँच पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
      detail: {
        title: 'लीड {{code}}',
        stageHistory: 'चरण इतिहास',
        estimatedValue: 'अनुमानित मूल्य',
        incentive: 'आपका इंसेंटिव',
        contact: 'संपर्क',
        lostReason: 'क्यों हाथ से गया',
      },
    },
  },

  mr: {
    myLeads: {
      title: 'माझे लीड',
      subtitle: 'तुम्ही आतापर्यंत नोंदवलेली प्रत्येक साइट, आणि तिचे काय झाले.',
      loading: 'तुमचे लीड लोड होत आहेत',
      searchPlaceholder: 'साइट किंवा बिल्डरच्या नावाने शोधा',
      summary: {
        total: 'नोंदवले',
        won: 'रूपांतरित',
        conversion: 'रूपांतर',
        matchesNote: 'हेच सूत्र प्रशासक तुमच्या रूपांतर दरासाठी वापरतो — दोन्ही आकडे नेहमी जुळतात.',
      },
      loadMore: 'आणखी दाखवा',
      allLoaded: 'एवढेच आहे.',
      daysInStage: 'इथे {{days}} दिवसांपासून',
      readOnlyNote: 'हे लीडच्या सध्याच्या स्थितीचे फक्त पाहण्याचे दृश्य आहे — इथून पुढे टप्पा बदल विक्री संघ करतो.',
      empty: {
        title: 'अजून कोणताही लीड नोंदवलेला नाही',
        body: 'तुमचा पहिला लीड नोंदवताच, तो इथे दिसेल आणि त्याचा टप्पा आपोआप अद्ययावत होत राहील.',
      },
      noResults: {
        title: 'कोणताही लीड जुळत नाही',
        body: 'वेगळा शोध वापरून पहा किंवा टप्पा फिल्टर काढा.',
      },
      error: {
        title: 'तुमचे लीड लोड होऊ शकले नाहीत',
        body: 'आम्ही तुमच्या माहितीपर्यंत पोहोचू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
      detail: {
        title: 'लीड {{code}}',
        stageHistory: 'टप्पा इतिहास',
        estimatedValue: 'अंदाजित मूल्य',
        incentive: 'तुमचा इन्सेंटिव्ह',
        contact: 'संपर्क',
        lostReason: 'का गमावला',
      },
    },
  },
};

export default translations;
