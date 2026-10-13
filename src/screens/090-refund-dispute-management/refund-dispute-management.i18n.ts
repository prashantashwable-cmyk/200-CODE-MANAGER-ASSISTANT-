import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    refundDisputeManagement: {
      title: 'Refund & Dispute Management',
      subtitle: 'Every customer-raised dispute, from raised to resolved',
      loading: 'Loading disputes',
      error: { title: 'Could not load disputes', body: 'Check your connection and try again.' },
      empty: { title: 'No open disputes', body: 'Every customer-raised dispute is resolved. New ones will appear here as they come in.' },
      noResults: { title: 'Nothing resolved yet', body: 'Resolved disputes will appear here.' },

      segment: { open: 'Open', resolved: 'Resolved' },

      row: {
        slaHours: '{{hours}}h since raised',
        slaBreached: 'SLA breached',
        notYetPaid: 'Nothing collected yet',
      },

      resolutionType: {
        full_refund: 'Full refund',
        partial_refund: 'Partial refund',
        rejected: 'Rejected',
      },

      detail: {
        disputeReasonLabel: 'Customer\'s stated reason',
        disputedByLabel: 'Raised by',
        amountPaidLabel: 'Amount already collected',
        slaLabel: 'Time open',
        financingWarning: 'This payment was collected via financing partner disbursement — any refund must be coordinated with the financing partner, never paid to the customer directly. AIEC never held this money from them personally.',
        downstreamWarning: 'This deal\'s funds have already moved further downstream — a supplier purchase order and/or a commission payout — so a refund here will need internal reconciliation before it\'s final.',
        resolutionNoteLabel: 'Resolution reason',
        resolvedByLabel: 'Resolved by',
        creditNoteIssued: 'Credit note {{code}} issued',
        approveFullRefund: 'Approve full refund',
        approvePartialRefund: 'Approve partial refund',
        reject: 'Reject with explanation',
        viewHistory: 'View deal & communication history',
      },

      fullRefundSheet: {
        title: 'Approve full refund',
        hint: 'This refunds everything collected on this stage and generates a credit note against its invoice.',
        amountLabel: 'Refund amount',
        reasonLabel: 'Reason (required)',
        submit: 'Confirm full refund',
      },

      partialRefundSheet: {
        title: 'Approve partial refund',
        hint: 'Up to {{amount}} was collected on this stage. Enter how much to refund.',
        amountLabel: 'Refund amount',
        reasonLabel: 'Reason (required)',
        submit: 'Confirm partial refund',
      },

      rejectSheet: {
        title: 'Reject with explanation',
        hint: 'The stage returns to its status before the dispute. Give a clear, respectful reason the customer can understand.',
        reasonLabel: 'Reason (required)',
        submit: 'Confirm rejection',
      },

      toast: {
        resolved: 'Dispute resolved',
        error: 'Something went wrong',
      },
    },
  },
  hi: {
    refundDisputeManagement: {
      title: 'रिफंड और विवाद प्रबंधन',
      subtitle: 'ग्राहक द्वारा उठाया हर विवाद, दर्ज होने से निपटारे तक',
      loading: 'विवाद लोड हो रहे हैं',
      error: { title: 'विवाद लोड नहीं हो सके', body: 'अपना कनेक्शन जांचें और फिर से प्रयास करें।' },
      empty: { title: 'कोई खुला विवाद नहीं', body: 'ग्राहक द्वारा उठाया हर विवाद निपटाया जा चुका है। नए विवाद यहां दिखेंगे।' },
      noResults: { title: 'अभी तक कुछ भी निपटाया नहीं गया', body: 'निपटाए गए विवाद यहां दिखेंगे।' },

      segment: { open: 'खुले', resolved: 'निपटाए गए' },

      row: {
        slaHours: 'दर्ज हुए {{hours}} घंटे',
        slaBreached: 'SLA चूक गया',
        notYetPaid: 'अभी तक कुछ भी प्राप्त नहीं हुआ',
      },

      resolutionType: {
        full_refund: 'पूर्ण रिफंड',
        partial_refund: 'आंशिक रिफंड',
        rejected: 'अस्वीकृत',
      },

      detail: {
        disputeReasonLabel: 'ग्राहक द्वारा बताया गया कारण',
        disputedByLabel: 'दर्ज किया गया',
        amountPaidLabel: 'पहले से प्राप्त राशि',
        slaLabel: 'कितने समय से खुला है',
        financingWarning: 'यह भुगतान फाइनेंसिंग पार्टनर के डिस्बर्समेंट के माध्यम से प्राप्त हुआ था — कोई भी रिफंड फाइनेंसिंग पार्टनर के साथ समन्वित होना चाहिए, कभी भी सीधे ग्राहक को नहीं दिया जाना चाहिए। यह राशि AIEC ने ग्राहक से व्यक्तिगत रूप से कभी नहीं रखी थी।',
        downstreamWarning: 'इस डील का पैसा पहले ही आगे बढ़ चुका है — एक सप्लायर पर्चेज़ ऑर्डर और/या कमीशन भुगतान — इसलिए यहां रिफंड को अंतिम रूप देने से पहले आंतरिक समाधान की जरूरत होगी।',
        resolutionNoteLabel: 'निपटारे का कारण',
        resolvedByLabel: 'निपटाया गया',
        creditNoteIssued: 'क्रेडिट नोट {{code}} जारी किया गया',
        approveFullRefund: 'पूर्ण रिफंड स्वीकृत करें',
        approvePartialRefund: 'आंशिक रिफंड स्वीकृत करें',
        reject: 'स्पष्टीकरण के साथ अस्वीकार करें',
        viewHistory: 'डील और संचार इतिहास देखें',
      },

      fullRefundSheet: {
        title: 'पूर्ण रिफंड स्वीकृत करें',
        hint: 'यह इस चरण में प्राप्त हुई पूरी राशि रिफंड करता है और इसके इनवॉइस के विरुद्ध एक क्रेडिट नोट बनाता है।',
        amountLabel: 'रिफंड राशि',
        reasonLabel: 'कारण (आवश्यक)',
        submit: 'पूर्ण रिफंड की पुष्टि करें',
      },

      partialRefundSheet: {
        title: 'आंशिक रिफंड स्वीकृत करें',
        hint: 'इस चरण में {{amount}} तक प्राप्त हुआ था। कितना रिफंड करना है दर्ज करें।',
        amountLabel: 'रिफंड राशि',
        reasonLabel: 'कारण (आवश्यक)',
        submit: 'आंशिक रिफंड की पुष्टि करें',
      },

      rejectSheet: {
        title: 'स्पष्टीकरण के साथ अस्वीकार करें',
        hint: 'यह चरण विवाद से पहले की अपनी स्थिति में वापस चला जाता है। ग्राहक के समझने लायक स्पष्ट, सम्मानजनक कारण दें।',
        reasonLabel: 'कारण (आवश्यक)',
        submit: 'अस्वीकृति की पुष्टि करें',
      },

      toast: {
        resolved: 'विवाद निपटाया गया',
        error: 'कुछ गलत हो गया',
      },
    },
  },
  mr: {
    refundDisputeManagement: {
      title: 'रिफंड आणि वाद व्यवस्थापन',
      subtitle: 'ग्राहकाने उपस्थित केलेला प्रत्येक वाद, नोंदीपासून निकालापर्यंत',
      loading: 'वाद लोड होत आहेत',
      error: { title: 'वाद लोड होऊ शकले नाहीत', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'कोणतेही खुले वाद नाहीत', body: 'ग्राहकाने उपस्थित केलेला प्रत्येक वाद निकाली काढला आहे. नवीन वाद इथे दिसतील.' },
      noResults: { title: 'अजून काहीही निकाली निघालेले नाही', body: 'निकाली काढलेले वाद इथे दिसतील.' },

      segment: { open: 'खुले', resolved: 'निकाली काढलेले' },

      row: {
        slaHours: 'नोंदवून {{hours}} तास झाले',
        slaBreached: 'SLA चुकले',
        notYetPaid: 'अजून काहीही मिळालेले नाही',
      },

      resolutionType: {
        full_refund: 'पूर्ण परतावा',
        partial_refund: 'अंशतः परतावा',
        rejected: 'नाकारले',
      },

      detail: {
        disputeReasonLabel: 'ग्राहकाने सांगितलेले कारण',
        disputedByLabel: 'नोंदवले',
        amountPaidLabel: 'आधीच मिळालेली रक्कम',
        slaLabel: 'किती वेळ खुले आहे',
        financingWarning: 'हे पेमेंट फायनान्सिंग पार्टनरच्या वितरणाद्वारे मिळाले होते — कोणताही परतावा फायनान्सिंग पार्टनरशी समन्वयित असणे आवश्यक आहे, थेट ग्राहकाला कधीही देऊ नये. ही रक्कम AIEC ने ग्राहकाकडून वैयक्तिकरित्या कधीही ठेवली नव्हती.',
        downstreamWarning: 'या डीलचा निधी आधीच पुढे गेला आहे — सप्लायर परचेस ऑर्डर आणि/किंवा कमिशन पेआउट — त्यामुळे इथे परतावा अंतिम करण्यापूर्वी अंतर्गत समेट आवश्यक असेल.',
        resolutionNoteLabel: 'निकालाचे कारण',
        resolvedByLabel: 'निकाली काढले',
        creditNoteIssued: 'क्रेडिट नोट {{code}} जारी केली',
        approveFullRefund: 'पूर्ण परतावा मंजूर करा',
        approvePartialRefund: 'अंशतः परतावा मंजूर करा',
        reject: 'स्पष्टीकरणासह नाकारा',
        viewHistory: 'डील आणि संवाद इतिहास पहा',
      },

      fullRefundSheet: {
        title: 'पूर्ण परतावा मंजूर करा',
        hint: 'हे या टप्प्यात मिळालेली संपूर्ण रक्कम परत करते आणि त्याच्या इनव्हॉइसविरुद्ध क्रेडिट नोट तयार करते.',
        amountLabel: 'परतावा रक्कम',
        reasonLabel: 'कारण (आवश्यक)',
        submit: 'पूर्ण परताव्याची पुष्टी करा',
      },

      partialRefundSheet: {
        title: 'अंशतः परतावा मंजूर करा',
        hint: 'या टप्प्यात {{amount}} पर्यंत रक्कम मिळाली होती. किती परत करायचे ते नोंदवा.',
        amountLabel: 'परतावा रक्कम',
        reasonLabel: 'कारण (आवश्यक)',
        submit: 'अंशतः परताव्याची पुष्टी करा',
      },

      rejectSheet: {
        title: 'स्पष्टीकरणासह नाकारा',
        hint: 'हा टप्पा वादापूर्वीच्या स्थितीत परत जातो. ग्राहकाला समजेल असे स्पष्ट, आदरपूर्ण कारण द्या.',
        reasonLabel: 'कारण (आवश्यक)',
        submit: 'नकाराची पुष्टी करा',
      },

      toast: {
        resolved: 'वाद निकाली काढला',
        error: 'काहीतरी चुकले',
      },
    },
  },
};

export default translations;
