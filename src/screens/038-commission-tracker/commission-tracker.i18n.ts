import type { ScreenTranslations } from '@/i18n/types';

/**
 * This screen owns the shared `commission.reason.*` keys. The seed ledger
 * (and the useCommissionTracker hook, via `reasonIdFromKey`) references a
 * commission entry's reason by these exact ids — no other screen redefines
 * them.
 */
const translations: ScreenTranslations = {
  en: {
    commission: {
      reason: {
        leadConverted: 'Lead converted to a sale',
        referralReward: 'Referral reward',
        exitSettlement: 'Final settlement after leaving',
        contestPrize: 'Contest prize',
        payoutCorrection: 'Correction after your question',
        leadQualified: 'Lead reached a qualified stage',
        siteVisitVerified: 'Site visit verified',
        monthlyBonus: 'Monthly performance bonus',
        installationCompleted: 'Installation completed and handed over',
        dealClosed: 'Closed the deal after the lead was reassigned',
        qcCompleted: 'Independent quality check completed',
      },
    },
    commissionTracker: {
      title: 'My earnings',
      subtitle: 'Every rupee, and exactly why you earned it.',
      loading: 'Loading your ledger',
      period: { thisWeek: 'This week', lastWeek: 'Last week', thisMonth: 'This month', allTime: 'All time' },
      total: 'Total this period',
      vsLastPeriod: 'vs last period',
      status: { projected: 'Projected', approved: 'Approved', paid: 'Paid', forfeited: 'Forfeited' },
      statusExplain: {
        projected: 'Estimated — this becomes final once the underlying deal is decided.',
        approved: 'Confirmed by admin and waiting for the next payout run.',
        paid: 'Already in your account.',
        forfeited: 'This lead did not qualify — usually a duplicate that was confirmed as one.',
      },
      rulesHeading: 'How you get paid',
      rule: {
        capture: '₹500 the moment a lead you capture is accepted, regardless of what happens to it later.',
        conversion: '1.5% of the estimated deal value (minimum ₹5,000) if that lead goes on to close as a sale.',
        bonus: 'Extra rewards for hitting monthly targets or winning an active contest — these show up here the moment they are earned.',
      },
      nextPayout: 'Approved amounts are paid out on {{date}}.',
      nextPayoutLabel: 'Next payout',
      ledgerHeading: 'Full ledger',
      raiseQuery: 'Something looks wrong',
      queryNote: 'Query raised — an admin will follow up on this entry.',
      liveNote: 'This is the same ledger Admin sees for your payouts — nothing here is a separate copy that could disagree with it.',
      empty: {
        title: 'Nothing earned yet',
        body: 'Capture your first lead and this fills in automatically — nothing here is ever entered by hand.',
      },
      error: {
        title: 'Could not load your earnings',
        body: 'We could not reach your data. Check your connection and try again.',
      },
    },
  },

  hi: {
    commission: {
      reason: {
        leadConverted: 'लीड बिक्री में बदला',
        referralReward: 'रेफ़रल इनाम',
        exitSettlement: 'छोड़ने के बाद अंतिम निपटान',
        contestPrize: 'प्रतियोगिता पुरस्कार',
        payoutCorrection: 'आपके सवाल के बाद सुधार',
        leadQualified: 'लीड योग्य चरण तक पहुँचा',
        siteVisitVerified: 'साइट विज़िट सत्यापित',
        monthlyBonus: 'मासिक प्रदर्शन बोनस',
        installationCompleted: 'इंस्टॉलेशन पूरा हुआ और सौंपा गया',
        dealClosed: 'लीड दोबारा सौंपे जाने के बाद डील पूरी की',
        qcCompleted: 'स्वतंत्र गुणवत्ता जाँच पूरी की',
      },
    },
    commissionTracker: {
      title: 'मेरी कमाई',
      subtitle: 'हर रुपया, और वह ठीक-ठीक क्यों मिला।',
      loading: 'आपका लेजर लोड हो रहा है',
      period: { thisWeek: 'इस हफ़्ते', lastWeek: 'पिछले हफ़्ते', thisMonth: 'इस महीने', allTime: 'हमेशा से' },
      total: 'इस अवधि का कुल',
      vsLastPeriod: 'पिछली अवधि से',
      status: { projected: 'अनुमानित', approved: 'मंज़ूर', paid: 'भुगतान हुआ', forfeited: 'ज़ब्त' },
      statusExplain: {
        projected: 'अनुमान है — जुड़ा सौदा तय होते ही यह पक्का हो जाएगा।',
        approved: 'एडमिन ने पक्का कर दिया है, अगली भुगतान प्रक्रिया का इंतज़ार है।',
        paid: 'पहले से आपके खाते में है।',
        forfeited: 'यह लीड योग्य नहीं ठहरा — आमतौर पर डुप्लिकेट पक्का होने पर।',
      },
      rulesHeading: 'आपको भुगतान कैसे होता है',
      rule: {
        capture: 'आपके दर्ज किए लीड के स्वीकार होते ही ₹500, आगे उसका जो भी हो।',
        conversion: 'अगर वह लीड बिक्री में बदलकर बंद होता है, तो अनुमानित सौदा मूल्य का 1.5% (कम से कम ₹5,000)।',
        bonus: 'मासिक लक्ष्य पूरा करने या किसी सक्रिय प्रतियोगिता में जीतने पर अतिरिक्त इनाम — मिलते ही यहाँ दिखता है।',
      },
      nextPayout: 'मंज़ूर रक़में {{date}} को भुगतान होंगी।',
      nextPayoutLabel: 'अगला भुगतान',
      ledgerHeading: 'पूरा लेजर',
      raiseQuery: 'कुछ ग़लत लग रहा है',
      queryNote: 'सवाल दर्ज हुआ — एडमिन इस एंट्री पर आपसे संपर्क करेगा।',
      liveNote: 'यह वही लेजर है जो एडमिन आपके भुगतान के लिए देखता है — यहाँ कोई अलग नक़ल नहीं जो उससे अलग बात कहे।',
      empty: {
        title: 'अभी कुछ नहीं कमाया',
        body: 'अपना पहला लीड दर्ज कीजिए और यह अपने आप भरने लगेगा — यहाँ कुछ भी हाथ से दर्ज नहीं होता।',
      },
      error: {
        title: 'आपकी कमाई लोड नहीं हो पाई',
        body: 'हम आपके डेटा तक नहीं पहुँच पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
    },
  },

  mr: {
    commission: {
      reason: {
        leadConverted: 'लीड विक्रीत रूपांतरित झाला',
        referralReward: 'रेफरल बक्षीस',
        exitSettlement: 'सोडल्यानंतरचा अंतिम हिशोब',
        contestPrize: 'स्पर्धा बक्षीस',
        payoutCorrection: 'तुमच्या प्रश्नानंतर दुरुस्ती',
        leadQualified: 'लीड पात्र टप्प्यावर पोहोचला',
        siteVisitVerified: 'साइट भेट पडताळली',
        monthlyBonus: 'मासिक कामगिरी बोनस',
        installationCompleted: 'इन्स्टॉलेशन पूर्ण झालं आणि सुपूर्द केलं',
        dealClosed: 'लीड पुन्हा सोपवल्यानंतर डील पूर्ण केली',
        qcCompleted: 'स्वतंत्र गुणवत्ता तपासणी पूर्ण केली',
      },
    },
    commissionTracker: {
      title: 'माझी कमाई',
      subtitle: 'प्रत्येक रुपया, आणि तो नेमका का मिळाला.',
      loading: 'तुमचे लेजर लोड होत आहे',
      period: { thisWeek: 'या आठवड्यात', lastWeek: 'गेल्या आठवड्यात', thisMonth: 'या महिन्यात', allTime: 'नेहमीपासून' },
      total: 'या कालावधीतील एकूण',
      vsLastPeriod: 'मागील कालावधीच्या तुलनेत',
      status: { projected: 'अंदाजित', approved: 'मंजूर', paid: 'भरले', forfeited: 'जप्त' },
      statusExplain: {
        projected: 'अंदाज आहे — संबंधित व्यवहार निश्चित होताच हे पक्के होईल.',
        approved: 'प्रशासकाने निश्चित केले आहे, पुढील पेमेंट प्रक्रियेची वाट पाहत आहे.',
        paid: 'आधीच तुमच्या खात्यात आहे.',
        forfeited: 'हा लीड पात्र ठरला नाही — सहसा डुप्लिकेट निश्चित झाल्यावर.',
      },
      rulesHeading: 'तुम्हाला पैसे कसे मिळतात',
      rule: {
        capture: 'तुम्ही नोंदवलेला लीड स्वीकारताच ₹500, पुढे त्याचे काहीही झाले तरी.',
        conversion: 'तो लीड विक्रीत बदलून बंद झाल्यास, अंदाजित व्यवहार मूल्याच्या 1.5% (किमान ₹5,000).',
        bonus: 'मासिक उद्दिष्ट गाठल्यास किंवा एखादी सक्रिय स्पर्धा जिंकल्यास अतिरिक्त बक्षिसे — मिळताच इथे दिसतात.',
      },
      nextPayout: 'मंजूर रक्कम {{date}} रोजी दिली जाईल.',
      nextPayoutLabel: 'पुढील पेमेंट',
      ledgerHeading: 'संपूर्ण लेजर',
      raiseQuery: 'काहीतरी चुकीचे वाटते',
      queryNote: 'प्रश्न नोंदवला — प्रशासक या नोंदीबद्दल तुमच्याशी संपर्क करेल.',
      liveNote: 'हेच लेजर प्रशासक तुमच्या पेमेंटसाठी पाहतो — इथे वेगळी प्रत नाही जी त्याच्याशी विसंगत असेल.',
      empty: {
        title: 'अजून काहीही कमावलेले नाही',
        body: 'तुमचा पहिला लीड नोंदवा आणि हे आपोआप भरू लागेल — इथे काहीही हाताने नोंदवले जात नाही.',
      },
      error: {
        title: 'तुमची कमाई लोड होऊ शकली नाही',
        body: 'आम्ही तुमच्या माहितीपर्यंत पोहोचू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
