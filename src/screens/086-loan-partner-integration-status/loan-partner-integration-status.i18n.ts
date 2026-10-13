import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    loanPartnerStatus: {
      title: 'Loan Partner Status',
      subtitle: 'Every application, every partner, reconciled against what actually landed',
      loading: 'Loading loan applications',
      error: { title: 'Could not load loan applications', body: 'Check your connection and try again.' },
      empty: { title: 'No loan applications yet', body: 'Applications will appear here once a customer applies for EMI financing.' },
      noResults: { title: 'No matching applications', body: 'Try a different filter.' },

      kpi: {
        total: 'Applications',
        approvalRate: 'Approval rate',
        avgDisbursement: 'Avg. time to disburse',
        avgDisbursementDays: '{{count}} days',
        stuck: 'Stuck',
        partnerCaption: 'Suvidha Finance Ltd',
      },

      filters: {
        all: 'All applications',
        stuck: 'Stuck only',
      },

      status: {
        submitted: 'Submitted',
        under_review: 'Under review',
        approved: 'Approved',
        disbursed: 'Disbursed',
        cancelled: 'Cancelled',
      },

      row: {
        stuckBadge: 'Stuck',
        shortfallBadge: 'Shortfall',
      },

      detail: {
        partner: 'Financing partner',
        requestedAmount: 'Requested',
        approvedAmount: 'Approved',
        disbursedAmountReceived: 'Actually received',
        shortfall: 'Shortfall',
        shortfallNote: "The partner's processing fee (or similar deduction) left less than approved landing in AIEC's account — the customer still owes this shortfall through another payment method.",
        submittedAt: 'Submitted',
        approvedAt: 'Approved',
        disbursedAt: 'Disbursed',
        stuckNote: 'Approved but not yet disbursed, well past the reasonable window — this has been raised as a financial risk alert.',
        cancelledNote: 'Cancelled before disbursement — the deal\'s payment schedule was never touched.',
        escalate: 'Escalate to partner contact',
        escalated: 'Escalated',
        cancel: 'Cancel application',
        cancelReasonLabel: 'Reason for cancelling',
        cancelConfirm: 'Confirm cancellation',
        cancelHint: 'Only possible before disbursement — nothing has been paid through this application yet, so nothing needs to be reversed.',
      },

      toast: {
        escalated: 'Escalated to partner contact',
        cancelled: 'Application cancelled',
        error: 'Something went wrong. Please try again.',
      },
    },
  },
  hi: {
    loanPartnerStatus: {
      title: 'लोन पार्टनर स्थिति',
      subtitle: 'हर आवेदन, हर पार्टनर, वास्तव में मिली राशि से मिलान किया गया',
      loading: 'लोन आवेदन लोड हो रहे हैं',
      error: { title: 'लोन आवेदन लोड नहीं हो सके', body: 'अपना कनेक्शन जांचें और फिर से कोशिश करें।' },
      empty: { title: 'अभी कोई लोन आवेदन नहीं', body: 'जब कोई ग्राहक EMI फाइनेंसिंग के लिए आवेदन करेगा, तो आवेदन यहां दिखाई देंगे।' },
      noResults: { title: 'कोई मेल खाता आवेदन नहीं', body: 'कोई अलग फ़िल्टर आज़माएं।' },

      kpi: {
        total: 'आवेदन',
        approvalRate: 'स्वीकृति दर',
        avgDisbursement: 'वितरण में औसत समय',
        avgDisbursementDays: '{{count}} दिन',
        stuck: 'अटके हुए',
        partnerCaption: 'सुविधा फाइनेंस लिमिटेड',
      },

      filters: {
        all: 'सभी आवेदन',
        stuck: 'केवल अटके हुए',
      },

      status: {
        submitted: 'जमा किया गया',
        under_review: 'समीक्षा में',
        approved: 'स्वीकृत',
        disbursed: 'वितरित',
        cancelled: 'रद्द',
      },

      row: {
        stuckBadge: 'अटका हुआ',
        shortfallBadge: 'कमी',
      },

      detail: {
        partner: 'फाइनेंसिंग पार्टनर',
        requestedAmount: 'अनुरोधित',
        approvedAmount: 'स्वीकृत',
        disbursedAmountReceived: 'वास्तव में प्राप्त',
        shortfall: 'कमी',
        shortfallNote: 'पार्टनर के प्रोसेसिंग शुल्क (या इसी तरह की कटौती) की वजह से AIEC के खाते में स्वीकृत राशि से कम पहुंची — ग्राहक पर यह कमी अभी भी किसी और भुगतान तरीके से बकाया है।',
        submittedAt: 'जमा किया गया',
        approvedAt: 'स्वीकृत हुआ',
        disbursedAt: 'वितरित हुआ',
        stuckNote: 'स्वीकृत है लेकिन अभी तक वितरित नहीं हुआ, उचित समय-सीमा से काफी आगे — इसे वित्तीय जोखिम अलर्ट के रूप में उठाया गया है।',
        cancelledNote: 'वितरण से पहले रद्द किया गया — डील की भुगतान अनुसूची को कभी छुआ नहीं गया।',
        escalate: 'पार्टनर संपर्क तक पहुंचाएं',
        escalated: 'एस्केलेट किया गया',
        cancel: 'आवेदन रद्द करें',
        cancelReasonLabel: 'रद्द करने का कारण',
        cancelConfirm: 'रद्द करना पक्का करें',
        cancelHint: 'यह केवल वितरण से पहले ही संभव है — इस आवेदन के ज़रिए अभी तक कुछ भुगतान नहीं हुआ है, इसलिए कुछ भी वापस पलटने की ज़रूरत नहीं है।',
      },

      toast: {
        escalated: 'पार्टनर संपर्क तक पहुंचाया गया',
        cancelled: 'आवेदन रद्द कर दिया गया',
        error: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
      },
    },
  },
  mr: {
    loanPartnerStatus: {
      title: 'लोन पार्टनर स्थिती',
      subtitle: 'प्रत्येक अर्ज, प्रत्येक पार्टनर, प्रत्यक्षात मिळालेल्या रकमेशी जुळवलेला',
      loading: 'लोन अर्ज लोड होत आहेत',
      error: { title: 'लोन अर्ज लोड होऊ शकले नाहीत', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'अजून कोणताही लोन अर्ज नाही', body: 'जेव्हा एखादा ग्राहक EMI वित्तपुरवठ्यासाठी अर्ज करेल, तेव्हा अर्ज इथे दिसतील.' },
      noResults: { title: 'जुळणारा अर्ज नाही', body: 'वेगळा फिल्टर वापरून पहा.' },

      kpi: {
        total: 'अर्ज',
        approvalRate: 'मंजुरी दर',
        avgDisbursement: 'वितरणाचा सरासरी वेळ',
        avgDisbursementDays: '{{count}} दिवस',
        stuck: 'अडकलेले',
        partnerCaption: 'सुविधा फायनान्स लिमिटेड',
      },

      filters: {
        all: 'सर्व अर्ज',
        stuck: 'फक्त अडकलेले',
      },

      status: {
        submitted: 'सादर केला',
        under_review: 'पुनरावलोकनात',
        approved: 'मंजूर',
        disbursed: 'वितरित',
        cancelled: 'रद्द',
      },

      row: {
        stuckBadge: 'अडकलेले',
        shortfallBadge: 'तूट',
      },

      detail: {
        partner: 'वित्तपुरवठा पार्टनर',
        requestedAmount: 'मागितलेली',
        approvedAmount: 'मंजूर',
        disbursedAmountReceived: 'प्रत्यक्ष मिळालेली',
        shortfall: 'तूट',
        shortfallNote: 'पार्टनरच्या प्रोसेसिंग शुल्कामुळे (किंवा तत्सम कपातीमुळे) AIEC च्या खात्यात मंजूर रकमेपेक्षा कमी रक्कम पोहोचली — ग्राहकाकडे ही तूट अजूनही दुसऱ्या पेमेंट पद्धतीने बाकी आहे.',
        submittedAt: 'सादर केला',
        approvedAt: 'मंजूर झाला',
        disbursedAt: 'वितरित झाला',
        stuckNote: 'मंजूर झाला आहे पण अजून वितरित झालेला नाही, योग्य कालमर्यादेपेक्षा खूप पुढे — हे आर्थिक जोखीम अलर्ट म्हणून नोंदवले गेले आहे.',
        cancelledNote: 'वितरणापूर्वी रद्द करण्यात आला — डीलच्या पेमेंट वेळापत्रकाला कधीही स्पर्श करण्यात आला नाही.',
        escalate: 'पार्टनर संपर्कापर्यंत पोहोचवा',
        escalated: 'एस्केलेट केले',
        cancel: 'अर्ज रद्द करा',
        cancelReasonLabel: 'रद्द करण्याचे कारण',
        cancelConfirm: 'रद्द करणे निश्चित करा',
        cancelHint: 'हे फक्त वितरणापूर्वीच शक्य आहे — या अर्जाद्वारे अजून काहीही पेमेंट झालेले नाही, त्यामुळे काहीही उलट करण्याची गरज नाही.',
      },

      toast: {
        escalated: 'पार्टनर संपर्कापर्यंत पोहोचवले',
        cancelled: 'अर्ज रद्द केला',
        error: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
