import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    paymentReceiptHistory: {
      title: 'Payment History',
      subtitle: 'Every payment received, in one place, at any time',
      loading: 'Loading payment history',
      error: { title: 'Could not load payment history', body: 'Check your connection and try again.' },
      empty: { title: 'No payments received yet', body: 'A receipt appears here the moment a payment is confirmed.' },
      noResults: { title: 'No matching payments', body: 'Try a different filter.' },

      kpi: {
        paidToDate: 'Paid to date',
        remaining: 'Remaining balance',
      },

      filters: {
        dealAll: 'All deals',
        methodAll: 'All methods',
        from: 'From',
        to: 'To',
      },

      method: {
        upi: 'UPI',
        netbanking: 'Net Banking',
        neft: 'NEFT',
        card: 'Card',
        cash: 'Cash',
        cheque: 'Cheque',
        financing: 'Financing',
      },

      row: {
        stageLine: '{{stage}} payment',
      },

      detail: {
        heading: 'Receipt',
        amountReceived: 'Amount received',
        method: 'Method',
        date: 'Date',
        reference: 'Reference',
        deal: 'Deal',
        stage: 'Stage',
        customer: 'Customer',
        invoice: 'Invoice',
        invoicePending: 'Not yet generated',
        viewInvoice: 'View invoice',
        print: 'Print / Save as PDF',
      },

      export: {
        button: 'Export CSV',
        header: {
          date: 'Date',
          deal: 'Deal',
          site: 'Site',
          customer: 'Customer',
          stage: 'Stage',
          amount: 'Amount',
          method: 'Method',
          invoice: 'Invoice',
        },
      },
    },
  },
  hi: {
    paymentReceiptHistory: {
      title: 'भुगतान इतिहास',
      subtitle: 'हर प्राप्त भुगतान, एक ही जगह, कभी भी',
      loading: 'भुगतान इतिहास लोड हो रहा है',
      error: { title: 'भुगतान इतिहास लोड नहीं हो सका', body: 'अपना कनेक्शन जांचें और फिर से कोशिश करें।' },
      empty: { title: 'अभी तक कोई भुगतान प्राप्त नहीं हुआ', body: 'भुगतान की पुष्टि होते ही यहां एक रसीद दिखाई देगी।' },
      noResults: { title: 'कोई मेल खाता भुगतान नहीं', body: 'कोई अलग फ़िल्टर आज़माएं।' },

      kpi: {
        paidToDate: 'अब तक भुगतान',
        remaining: 'शेष राशि',
      },

      filters: {
        dealAll: 'सभी डील',
        methodAll: 'सभी तरीके',
        from: 'से',
        to: 'तक',
      },

      method: {
        upi: 'UPI',
        netbanking: 'नेट बैंकिंग',
        neft: 'NEFT',
        card: 'कार्ड',
        cash: 'नकद',
        cheque: 'चेक',
        financing: 'फाइनेंसिंग',
      },

      row: {
        stageLine: '{{stage}} भुगतान',
      },

      detail: {
        heading: 'रसीद',
        amountReceived: 'प्राप्त राशि',
        method: 'तरीका',
        date: 'तारीख',
        reference: 'संदर्भ',
        deal: 'डील',
        stage: 'चरण',
        customer: 'ग्राहक',
        invoice: 'इनवॉइस',
        invoicePending: 'अभी तक नहीं बना',
        viewInvoice: 'इनवॉइस देखें',
        print: 'प्रिंट करें / PDF के रूप में सेव करें',
      },

      export: {
        button: 'CSV निर्यात करें',
        header: {
          date: 'तारीख',
          deal: 'डील',
          site: 'साइट',
          customer: 'ग्राहक',
          stage: 'चरण',
          amount: 'राशि',
          method: 'तरीका',
          invoice: 'इनवॉइस',
        },
      },
    },
  },
  mr: {
    paymentReceiptHistory: {
      title: 'पेमेंट इतिहास',
      subtitle: 'प्रत्येक मिळालेले पेमेंट, एकाच ठिकाणी, कधीही',
      loading: 'पेमेंट इतिहास लोड होत आहे',
      error: { title: 'पेमेंट इतिहास लोड होऊ शकला नाही', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'अजून कोणतेही पेमेंट मिळालेले नाही', body: 'पेमेंटची पुष्टी होताच इथे पावती दिसेल.' },
      noResults: { title: 'जुळणारे पेमेंट नाही', body: 'वेगळा फिल्टर वापरून पहा.' },

      kpi: {
        paidToDate: 'आतापर्यंत भरलेले',
        remaining: 'शिल्लक रक्कम',
      },

      filters: {
        dealAll: 'सर्व डील',
        methodAll: 'सर्व पद्धती',
        from: 'पासून',
        to: 'पर्यंत',
      },

      method: {
        upi: 'UPI',
        netbanking: 'नेट बँकिंग',
        neft: 'NEFT',
        card: 'कार्ड',
        cash: 'रोख',
        cheque: 'धनादेश',
        financing: 'वित्तपुरवठा',
      },

      row: {
        stageLine: '{{stage}} पेमेंट',
      },

      detail: {
        heading: 'पावती',
        amountReceived: 'मिळालेली रक्कम',
        method: 'पद्धत',
        date: 'तारीख',
        reference: 'संदर्भ',
        deal: 'डील',
        stage: 'टप्पा',
        customer: 'ग्राहक',
        invoice: 'इनव्हॉइस',
        invoicePending: 'अजून तयार झालेले नाही',
        viewInvoice: 'इनव्हॉइस पहा',
        print: 'प्रिंट करा / PDF म्हणून सेव्ह करा',
      },

      export: {
        button: 'CSV निर्यात करा',
        header: {
          date: 'तारीख',
          deal: 'डील',
          site: 'साइट',
          customer: 'ग्राहक',
          stage: 'टप्पा',
          amount: 'रक्कम',
          method: 'पद्धत',
          invoice: 'इनव्हॉइस',
        },
      },
    },
  },
};

export default translations;
