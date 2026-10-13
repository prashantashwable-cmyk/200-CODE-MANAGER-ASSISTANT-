import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    loanEmiApplication: {
      title: 'Loan / EMI Application',
      subtitle: 'Convert your remaining balance into monthly payments',
      loading: 'Loading your application',
      notFound: { title: 'Application link not valid', body: "This link doesn't match your account, or the deal no longer exists. Please ask AIEC for a fresh link." },
      error: { title: 'Could not load this application', body: 'Check your connection and try again.' },

      step: {
        precheck: 'Quick check',
        details: 'Loan details',
        review: 'Review',
      },

      precheck: {
        heading: 'A quick fit check',
        body: 'A few questions to get a sense of fit — this never blocks you from applying, whatever the result.',
        incomeLabel: 'Annual household income',
        income: {
          below_5l: 'Below ₹5 lakh',
          '5l_10l': '₹5–10 lakh',
          '10l_25l': '₹10–25 lakh',
          above_25l: 'Above ₹25 lakh',
        },
        tenureLabel: 'Preferred repayment period',
        resultEligible: "You're likely a good fit for our standard EMI product.",
        resultNotEligible: "This combination doesn't fit our standard product, but you can still apply — circumstances vary, and a full application looks at more than this quick check.",
        reason: {
          lowIncomeLongTenure: 'A longer repayment period at this income level carries more risk for the lender than our quick check allows for.',
        },
      },

      details: {
        heading: 'Loan details',
        remainingBalance: 'Your remaining balance with AIEC',
        amountLabel: 'Amount to finance (₹)',
        amountHint: "Defaults to your full remaining balance — reduce it if you'd rather finance only part and pay the rest another way.",
        tenureLabel: 'Repayment period',
        ratesLoading: "Fetching Suvidha Finance's current rates…",
        ratesUnavailable: { title: 'Suvidha Finance is temporarily unavailable', body: 'Their rates service is not responding right now. Please try again shortly.' },
        partnerName: 'Suvidha Finance Ltd',
        rate: 'Interest rate (annual)',
        emi: 'Monthly EMI',
        perMonth: '/month',
        totalRepayment: 'Total repayment over the term',
        cashPrice: "AIEC's cash price (paid now)",
        interestCost: 'Total interest cost of financing',
      },

      review: {
        heading: 'Review before you apply',
        incomeRange: 'Income range',
        precheckResult: 'Quick-check result',
        amount: 'Amount to finance',
        tenure: 'Repayment period',
        rate: 'Interest rate',
        emi: 'Monthly EMI',
        totalRepayment: 'Total repayment',
        monthsSuffix: '{{count}} months',
      },

      actionBar: {
        submit: 'Submit application',
      },

      tracker: {
        heading: 'Your application',
        status: {
          submitted: 'Submitted',
          under_review: 'Under review',
          approved: 'Approved',
          disbursed: 'Disbursed',
          cancelled: 'Cancelled',
        },
        submittedBody: "Suvidha Finance has received your application. In this demo this updates automatically in a few seconds — a real review usually takes a few business days.",
        underReviewBody: "Suvidha Finance is reviewing your application now.",
        approvedFullBody: 'Approved for the full amount you requested.',
        approvedLessTitle: 'Approved for less than requested',
        approvedLessBody: "Suvidha Finance approved a lower amount than you asked for. You can cover the difference another way whenever you're ready.",
        disbursedBody: 'Disbursed — AIEC has received this payment in full, immediately.',
        disbursedGapBody: "The disbursed amount didn't cover everything owed. The remaining balance is still open below.",
        cancelledBody: 'This application was cancelled before any money moved — your payment schedule is unchanged.',
        payGapAction: 'Pay the remaining balance',
        requestedAmount: 'Requested',
        approvedAmount: 'Approved',
      },
    },
  },
  hi: {
    loanEmiApplication: {
      title: 'लोन / EMI आवेदन',
      subtitle: 'अपनी बकाया राशि को मासिक किस्तों में बदलें',
      loading: 'आपका आवेदन लोड हो रहा है',
      notFound: { title: 'आवेदन लिंक मान्य नहीं है', body: 'यह लिंक आपके खाते से मेल नहीं खाता, या यह डील अब मौजूद नहीं है। कृपया AIEC से नया लिंक मांगें।' },
      error: { title: 'यह आवेदन लोड नहीं हो सका', body: 'अपना कनेक्शन जांचें और फिर से कोशिश करें।' },

      step: {
        precheck: 'त्वरित जांच',
        details: 'लोन विवरण',
        review: 'समीक्षा',
      },

      precheck: {
        heading: 'एक त्वरित उपयुक्तता जांच',
        body: 'उपयुक्तता का अंदाज़ा लगाने के लिए कुछ सवाल — नतीजा चाहे जो हो, यह आपको आवेदन करने से कभी नहीं रोकता।',
        incomeLabel: 'वार्षिक पारिवारिक आय',
        income: {
          below_5l: '₹5 लाख से कम',
          '5l_10l': '₹5–10 लाख',
          '10l_25l': '₹10–25 लाख',
          above_25l: '₹25 लाख से ऊपर',
        },
        tenureLabel: 'पसंदीदा चुकौती अवधि',
        resultEligible: 'आप हमारे मानक EMI उत्पाद के लिए संभवतः उपयुक्त हैं।',
        resultNotEligible: 'यह संयोजन हमारे मानक उत्पाद में फिट नहीं बैठता, लेकिन आप फिर भी आवेदन कर सकते हैं — परिस्थितियां अलग-अलग होती हैं, और पूरा आवेदन इस त्वरित जांच से कहीं ज़्यादा देखता है।',
        reason: {
          lowIncomeLongTenure: 'इस आय स्तर पर लंबी चुकौती अवधि लेंडर के लिए हमारी त्वरित जांच से ज़्यादा जोखिम रखती है।',
        },
      },

      details: {
        heading: 'लोन विवरण',
        remainingBalance: 'AIEC के साथ आपकी बकाया राशि',
        amountLabel: 'वित्त पोषित करने की राशि (₹)',
        amountHint: 'डिफ़ॉल्ट रूप से आपकी पूरी बकाया राशि — अगर आप केवल कुछ हिस्सा वित्त पोषित कराना चाहते हैं और बाकी किसी और तरीके से चुकाना चाहते हैं, तो इसे घटाएं।',
        tenureLabel: 'चुकौती अवधि',
        ratesLoading: 'सुविधा फाइनेंस की मौजूदा दरें लाई जा रही हैं…',
        ratesUnavailable: { title: 'सुविधा फाइनेंस अभी अस्थायी रूप से अनुपलब्ध है', body: 'उनकी दरों की सेवा अभी जवाब नहीं दे रही। कृपया थोड़ी देर में फिर से कोशिश करें।' },
        partnerName: 'सुविधा फाइनेंस लिमिटेड',
        rate: 'ब्याज दर (वार्षिक)',
        emi: 'मासिक EMI',
        perMonth: '/माह',
        totalRepayment: 'अवधि भर में कुल चुकौती',
        cashPrice: 'AIEC की नकद कीमत (अभी भुगतान)',
        interestCost: 'फाइनेंसिंग की कुल ब्याज लागत',
      },

      review: {
        heading: 'आवेदन से पहले समीक्षा करें',
        incomeRange: 'आय सीमा',
        precheckResult: 'त्वरित जांच का परिणाम',
        amount: 'वित्त पोषित की जाने वाली राशि',
        tenure: 'चुकौती अवधि',
        rate: 'ब्याज दर',
        emi: 'मासिक EMI',
        totalRepayment: 'कुल चुकौती',
        monthsSuffix: '{{count}} महीने',
      },

      actionBar: {
        submit: 'आवेदन जमा करें',
      },

      tracker: {
        heading: 'आपका आवेदन',
        status: {
          submitted: 'जमा किया गया',
          under_review: 'समीक्षा में',
          approved: 'स्वीकृत',
          disbursed: 'वितरित',
          cancelled: 'रद्द',
        },
        submittedBody: 'सुविधा फाइनेंस को आपका आवेदन मिल गया है। इस डेमो में यह कुछ सेकंड में अपने आप अपडेट हो जाता है — असली समीक्षा में आमतौर पर कुछ कार्यदिवस लगते हैं।',
        underReviewBody: 'सुविधा फाइनेंस अभी आपके आवेदन की समीक्षा कर रहा है।',
        approvedFullBody: 'आपके अनुरोध की पूरी राशि के लिए स्वीकृति मिल गई।',
        approvedLessTitle: 'अनुरोध से कम राशि के लिए स्वीकृत',
        approvedLessBody: 'सुविधा फाइनेंस ने आपके अनुरोध से कम राशि स्वीकृत की है। आप जब चाहें बाकी राशि किसी और तरीके से चुका सकते हैं।',
        disbursedBody: 'वितरित — AIEC को यह भुगतान तुरंत, पूरी तरह मिल गया है।',
        disbursedGapBody: 'वितरित राशि पूरी बकाया राशि को कवर नहीं कर सकी। शेष राशि अभी भी नीचे बकाया है।',
        cancelledBody: 'पैसा हिलने से पहले ही यह आवेदन रद्द कर दिया गया — आपकी भुगतान अनुसूची अपरिवर्तित है।',
        payGapAction: 'शेष राशि का भुगतान करें',
        requestedAmount: 'अनुरोधित',
        approvedAmount: 'स्वीकृत',
      },
    },
  },
  mr: {
    loanEmiApplication: {
      title: 'लोन / EMI अर्ज',
      subtitle: 'तुमची बाकी रक्कम मासिक हप्त्यांमध्ये बदला',
      loading: 'तुमचा अर्ज लोड होत आहे',
      notFound: { title: 'अर्जाची लिंक वैध नाही', body: 'ही लिंक तुमच्या खात्याशी जुळत नाही, किंवा ही डील आता अस्तित्वात नाही. कृपया AIEC कडून नवीन लिंक मागवा.' },
      error: { title: 'हा अर्ज लोड होऊ शकला नाही', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },

      step: {
        precheck: 'त्वरित तपासणी',
        details: 'लोन तपशील',
        review: 'पुनरावलोकन',
      },

      precheck: {
        heading: 'एक त्वरित योग्यता तपासणी',
        body: 'योग्यतेचा अंदाज घेण्यासाठी काही प्रश्न — निकाल काहीही असो, हे तुम्हाला अर्ज करण्यापासून कधीही रोखत नाही.',
        incomeLabel: 'वार्षिक कौटुंबिक उत्पन्न',
        income: {
          below_5l: '₹5 लाखांपेक्षा कमी',
          '5l_10l': '₹5–10 लाख',
          '10l_25l': '₹10–25 लाख',
          above_25l: '₹25 लाखांपेक्षा जास्त',
        },
        tenureLabel: 'पसंतीचा परतफेड कालावधी',
        resultEligible: 'तुम्ही आमच्या मानक EMI उत्पादनासाठी बहुधा योग्य आहात.',
        resultNotEligible: 'हे संयोजन आमच्या मानक उत्पादनात बसत नाही, पण तरीही तुम्ही अर्ज करू शकता — परिस्थिती वेगवेगळी असते, आणि पूर्ण अर्ज या त्वरित तपासणीपेक्षा बरेच काही पाहतो.',
        reason: {
          lowIncomeLongTenure: 'या उत्पन्न पातळीवर दीर्घ परतफेड कालावधी सावकारासाठी आमच्या त्वरित तपासणीपेक्षा जास्त जोखीम ठेवतो.',
        },
      },

      details: {
        heading: 'लोन तपशील',
        remainingBalance: 'AIEC कडे तुमची बाकी रक्कम',
        amountLabel: 'वित्तपुरवठा करायची रक्कम (₹)',
        amountHint: 'डीफॉल्टनुसार तुमची संपूर्ण बाकी रक्कम — जर तुम्हाला फक्त काही भागाचा वित्तपुरवठा घ्यायचा असेल आणि उर्वरित दुसऱ्या मार्गाने भरायचे असेल, तर ती कमी करा.',
        tenureLabel: 'परतफेड कालावधी',
        ratesLoading: 'सुविधा फायनान्स चे सध्याचे दर आणले जात आहेत…',
        ratesUnavailable: { title: 'सुविधा फायनान्स सध्या तात्पुरते अनुपलब्ध आहे', body: 'त्यांची दर सेवा सध्या प्रतिसाद देत नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.' },
        partnerName: 'सुविधा फायनान्स Ltd',
        rate: 'व्याज दर (वार्षिक)',
        emi: 'मासिक EMI',
        perMonth: '/महिना',
        totalRepayment: 'कालावधीभरातील एकूण परतफेड',
        cashPrice: 'AIEC ची रोख किंमत (आत्ता भरलेली)',
        interestCost: 'वित्तपुरवठ्याचा एकूण व्याज खर्च',
      },

      review: {
        heading: 'अर्ज करण्यापूर्वी पुनरावलोकन करा',
        incomeRange: 'उत्पन्न श्रेणी',
        precheckResult: 'त्वरित तपासणीचा निकाल',
        amount: 'वित्तपुरवठा करायची रक्कम',
        tenure: 'परतफेड कालावधी',
        rate: 'व्याज दर',
        emi: 'मासिक EMI',
        totalRepayment: 'एकूण परतफेड',
        monthsSuffix: '{{count}} महिने',
      },

      actionBar: {
        submit: 'अर्ज सादर करा',
      },

      tracker: {
        heading: 'तुमचा अर्ज',
        status: {
          submitted: 'सादर केला',
          under_review: 'पुनरावलोकनात',
          approved: 'मंजूर',
          disbursed: 'वितरित',
          cancelled: 'रद्द',
        },
        submittedBody: 'सुविधा फायनान्स ला तुमचा अर्ज मिळाला आहे. या डेमोमध्ये हे काही सेकंदांत आपोआप अपडेट होते — खऱ्या पुनरावलोकनाला साधारण काही कामकाजी दिवस लागतात.',
        underReviewBody: 'सुविधा फायनान्स सध्या तुमच्या अर्जाचे पुनरावलोकन करत आहे.',
        approvedFullBody: 'तुम्ही मागितलेल्या संपूर्ण रकमेसाठी मंजुरी मिळाली.',
        approvedLessTitle: 'मागणीपेक्षा कमी रकमेसाठी मंजूर',
        approvedLessBody: 'सुविधा फायनान्स ने तुमच्या मागणीपेक्षा कमी रक्कम मंजूर केली आहे. तुम्ही जेव्हा हवे तेव्हा उर्वरित रक्कम दुसऱ्या मार्गाने भरू शकता.',
        disbursedBody: 'वितरित — AIEC ला हे पेमेंट तात्काळ, पूर्णपणे मिळाले आहे.',
        disbursedGapBody: 'वितरित रक्कम संपूर्ण बाकी रक्कम कव्हर करू शकली नाही. शिल्लक रक्कम अजूनही खाली बाकी आहे.',
        cancelledBody: 'पैसे हलण्यापूर्वीच हा अर्ज रद्द करण्यात आला — तुमचे पेमेंट वेळापत्रक अपरिवर्तित आहे.',
        payGapAction: 'शिल्लक रक्कम भरा',
        requestedAmount: 'मागितलेली',
        approvedAmount: 'मंजूर',
      },
    },
  },
};

export default translations;
