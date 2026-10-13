import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    supplierScore: {
      title: 'Supplier scorecard',
      subtitle: 'Who is becoming a liability, before it shows up at a customer’s door.',
      loading: 'Loading suppliers',
      weightsHeading: 'Adjust weights',
      weight: {
        onTime: 'On-time delivery',
        quality: 'Quality',
        price: 'Price',
        responsiveness: 'Responsiveness',
      },
      metric: {
        onTime: 'On-time delivery',
        quality: 'Quality score',
        price: 'Price competitiveness',
        responsiveness: 'Responsiveness',
      },
      placeholderNote:
        'Price and responsiveness are not tracked from real orders in this build yet, so they show a neutral placeholder rather than an invented number — marked with *.',
      overallScore: 'Overall score',
      earlyData: 'Early data',
      earlyDataNote: 'Based on very few completed orders — treat this as a first impression, not a stable long-term score.',
      watchlist: 'On the watchlist',
      watchlistAdd: 'Add to watchlist',
      watchlistRemove: 'Remove from watchlist',
      watchlistAuto: 'Suppliers land here automatically after two consecutive months below the quality threshold — or you can add one yourself.',
      incidentNote: 'This includes at least one delayed shipment. Open the order history before judging the trend from the headline number alone.',
      openOrders: 'Open orders',
      totalValue: 'Total order value',
      viewOrders: 'Order history',
      disputeNote: 'Every number above is the same one the supplier can be shown if they dispute their score.',
      pendingHeading: 'Awaiting KYC approval',
      empty: {
        title: 'No suppliers yet',
        body: 'Once a supplier is approved and has completed orders, their scorecard will appear here.',
      },
      error: {
        title: 'Could not load suppliers',
        body: 'We could not reach the supplier data. Check your connection and try again.',
      },
    },
  },

  hi: {
    supplierScore: {
      title: 'आपूर्तिकर्ता स्कोरकार्ड',
      subtitle: 'कौन बोझ बनता जा रहा है, इससे पहले कि यह ग्राहक के दरवाज़े तक पहुँचे।',
      loading: 'आपूर्तिकर्ता लोड हो रहे हैं',
      weightsHeading: 'भार समायोजित करें',
      weight: {
        onTime: 'समय पर डिलीवरी',
        quality: 'गुणवत्ता',
        price: 'क़ीमत',
        responsiveness: 'जवाबदेही',
      },
      metric: {
        onTime: 'समय पर डिलीवरी',
        quality: 'गुणवत्ता स्कोर',
        price: 'क़ीमत प्रतिस्पर्धा',
        responsiveness: 'जवाबदेही',
      },
      placeholderNote:
        'इस बिल्ड में क़ीमत और जवाबदेही असली ऑर्डर से अभी दर्ज नहीं होते, इसलिए ये गढ़े हुए अंक के बजाय एक निष्पक्ष प्लेसहोल्डर दिखाते हैं — * से चिह्नित।',
      overallScore: 'कुल स्कोर',
      earlyData: 'शुरुआती डेटा',
      earlyDataNote: 'बहुत कम पूरे हुए ऑर्डर पर आधारित — इसे पहली छाप मानिए, स्थायी लंबी अवधि का स्कोर नहीं।',
      watchlist: 'वॉचलिस्ट में',
      watchlistAdd: 'वॉचलिस्ट में डालें',
      watchlistRemove: 'वॉचलिस्ट से हटाएँ',
      watchlistAuto: 'गुणवत्ता सीमा से नीचे लगातार दो महीने रहने पर आपूर्तिकर्ता यहाँ अपने आप आ जाते हैं — या आप ख़ुद भी किसी को जोड़ सकते हैं।',
      incidentNote: 'इसमें कम से कम एक देरी से हुई डिलीवरी शामिल है। सिर्फ़ मुख्य अंक से रुझान तय करने से पहले ऑर्डर इतिहास खोल लीजिए।',
      openOrders: 'खुले ऑर्डर',
      totalValue: 'कुल ऑर्डर मूल्य',
      viewOrders: 'ऑर्डर इतिहास',
      disputeNote: 'ऊपर हर अंक वही है जो आपूर्तिकर्ता को उसके स्कोर पर सवाल उठाने पर दिखाया जा सकता है।',
      pendingHeading: 'KYC मंज़ूरी का इंतज़ार',
      empty: {
        title: 'अभी कोई आपूर्तिकर्ता नहीं',
        body: 'किसी आपूर्तिकर्ता के मंज़ूर होने और ऑर्डर पूरे होने के बाद, उसका स्कोरकार्ड यहाँ दिखेगा।',
      },
      error: {
        title: 'आपूर्तिकर्ता लोड नहीं हो पाए',
        body: 'हम आपूर्तिकर्ता डेटा तक नहीं पहुँच पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
    },
  },

  mr: {
    supplierScore: {
      title: 'पुरवठादार स्कोअरकार्ड',
      subtitle: 'कोण ओझे बनत चालले आहे, ते ग्राहकाच्या दारापर्यंत पोहोचण्याआधी.',
      loading: 'पुरवठादार लोड होत आहेत',
      weightsHeading: 'वजन समायोजित करा',
      weight: {
        onTime: 'वेळेवर वितरण',
        quality: 'गुणवत्ता',
        price: 'किंमत',
        responsiveness: 'प्रतिसादक्षमता',
      },
      metric: {
        onTime: 'वेळेवर वितरण',
        quality: 'गुणवत्ता गुण',
        price: 'किंमत स्पर्धात्मकता',
        responsiveness: 'प्रतिसादक्षमता',
      },
      placeholderNote:
        'या बिल्डमध्ये किंमत आणि प्रतिसादक्षमता खऱ्या ऑर्डरमधून अजून नोंदल्या जात नाहीत, त्यामुळे त्या रचलेल्या आकड्याऐवजी निष्पक्ष प्लेसहोल्डर दाखवतात — * ने चिन्हांकित.',
      overallScore: 'एकूण गुण',
      earlyData: 'सुरुवातीची माहिती',
      earlyDataNote: 'फार कमी पूर्ण झालेल्या ऑर्डरवर आधारित — हे पहिले इंप्रेशन माना, स्थिर दीर्घकालीन गुण नाही.',
      watchlist: 'वॉचलिस्टमध्ये',
      watchlistAdd: 'वॉचलिस्टमध्ये टाका',
      watchlistRemove: 'वॉचलिस्टमधून काढा',
      watchlistAuto: 'गुणवत्ता मर्यादेखाली सलग दोन महिने राहिल्यास पुरवठादार आपोआप इथे येतात — किंवा तुम्ही स्वतः कोणालाही जोडू शकता.',
      incidentNote: 'यात किमान एक उशिरा झालेले वितरण समाविष्ट आहे. फक्त मुख्य आकड्यावरून कल ठरवण्यापूर्वी ऑर्डर इतिहास उघडा.',
      openOrders: 'खुल्या ऑर्डर',
      totalValue: 'एकूण ऑर्डर मूल्य',
      viewOrders: 'ऑर्डर इतिहास',
      disputeNote: 'वरील प्रत्येक आकडा तोच आहे जो पुरवठादाराला त्याच्या गुणांवर प्रश्न विचारल्यास दाखवता येतो.',
      pendingHeading: 'KYC मंजुरीची प्रतीक्षा',
      empty: {
        title: 'अजून कोणताही पुरवठादार नाही',
        body: 'एखादा पुरवठादार मंजूर झाला आणि त्याच्या ऑर्डर पूर्ण झाल्या की त्याचे स्कोअरकार्ड इथे दिसेल.',
      },
      error: {
        title: 'पुरवठादार लोड होऊ शकले नाहीत',
        body: 'आम्ही पुरवठादार माहितीपर्यंत पोहोचू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
