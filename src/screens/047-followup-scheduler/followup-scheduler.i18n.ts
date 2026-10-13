import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    followupScheduler: {
      title: 'Follow-ups',
      subtitle: 'Nothing on this list is ever silently forgotten.',
      loading: 'Loading follow-ups',
      error: { title: 'Could not load follow-ups', body: 'Check your connection and try again.' },
      empty: { title: 'Nothing due', body: 'Every follow-up is caught up — new ones appear here as they’re scheduled.' },
      bucket: {
        overdue: 'Overdue',
        today: 'Today',
        tomorrow: 'Tomorrow',
        thisWeek: 'This week',
        later: 'Later',
      },
      autoTag: 'Auto',
      unavailableTag: 'Assignee unavailable',
      dueOn: 'Due {{date}}',
      complete: 'Complete',
      reschedule: 'Reschedule',
      rescheduleSheet: {
        title: 'Reschedule',
        dateLabel: 'New due date',
        reasonLabel: 'Reason',
        confirm: 'Confirm reschedule',
      },
      reason: {
        customerNotReachable: 'Customer not reachable',
        customerRequestedDelay: 'Customer requested delay',
        internalWorkload: 'Internal workload',
        other: 'Other',
        leadClosed: 'Lead closed',
      },
      bulkBar: {
        selectedCount: '{{count}} selected',
        clear: 'Clear',
        reschedule: 'Reschedule',
        reassign: 'Reassign',
      },
      reassignSheet: {
        title: 'Reassign selected',
        assigneeLabel: 'Assign to',
        confirm: 'Confirm reassignment',
      },
      toast: {
        completed: 'Follow-up completed',
        rescheduled: 'Follow-up rescheduled',
        reassigned: 'Follow-ups reassigned',
        error: 'Could not complete — try again.',
      },
    },
  },

  hi: {
    followupScheduler: {
      title: 'फ़ॉलो-अप',
      subtitle: 'इस सूची में कुछ भी चुपचाप भुलाया नहीं जाता।',
      loading: 'फ़ॉलो-अप लोड हो रहे हैं',
      error: { title: 'फ़ॉलो-अप लोड नहीं हो पाए', body: 'नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।' },
      empty: { title: 'कुछ भी बाकी नहीं', body: 'हर फ़ॉलो-अप पूरा हो चुका है — नए तय होते ही यहाँ दिखेंगे।' },
      bucket: {
        overdue: 'समय निकल गया',
        today: 'आज',
        tomorrow: 'कल',
        thisWeek: 'इस हफ़्ते',
        later: 'बाद में',
      },
      autoTag: 'ऑटो',
      unavailableTag: 'सौंपा गया व्यक्ति उपलब्ध नहीं',
      dueOn: '{{date}} तक',
      complete: 'पूरा करें',
      reschedule: 'दोबारा समय तय करें',
      rescheduleSheet: {
        title: 'दोबारा समय तय करें',
        dateLabel: 'नई नियत तारीख़',
        reasonLabel: 'कारण',
        confirm: 'दोबारा समय तय करने की पुष्टि करें',
      },
      reason: {
        customerNotReachable: 'ग्राहक से संपर्क नहीं हो पाया',
        customerRequestedDelay: 'ग्राहक ने देरी माँगी',
        internalWorkload: 'आंतरिक कार्यभार',
        other: 'अन्य',
        leadClosed: 'लीड बंद हो गया',
      },
      bulkBar: {
        selectedCount: '{{count}} चुने गए',
        clear: 'हटाएँ',
        reschedule: 'दोबारा समय तय करें',
        reassign: 'फिर से सौंपें',
      },
      reassignSheet: {
        title: 'चुने गए फिर से सौंपें',
        assigneeLabel: 'किसे सौंपें',
        confirm: 'असाइनमेंट की पुष्टि करें',
      },
      toast: {
        completed: 'फ़ॉलो-अप पूरा हुआ',
        rescheduled: 'फ़ॉलो-अप का समय बदला गया',
        reassigned: 'फ़ॉलो-अप फिर से सौंपे गए',
        error: 'पूरा नहीं हो पाया — दोबारा कोशिश करें।',
      },
    },
  },

  mr: {
    followupScheduler: {
      title: 'फॉलो-अप',
      subtitle: 'या यादीतील काहीही शांतपणे विसरले जात नाही.',
      loading: 'फॉलो-अप लोड होत आहेत',
      error: { title: 'फॉलो-अप लोड होऊ शकले नाहीत', body: 'नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'काहीही प्रलंबित नाही', body: 'प्रत्येक फॉलो-अप पूर्ण झाले आहे — नवीन ठरवताच इथे दिसतील.' },
      bucket: {
        overdue: 'वेळ निघून गेली',
        today: 'आज',
        tomorrow: 'उद्या',
        thisWeek: 'या आठवड्यात',
        later: 'नंतर',
      },
      autoTag: 'ऑटो',
      unavailableTag: 'नेमलेली व्यक्ती उपलब्ध नाही',
      dueOn: '{{date}} पर्यंत',
      complete: 'पूर्ण करा',
      reschedule: 'पुन्हा वेळ ठरवा',
      rescheduleSheet: {
        title: 'पुन्हा वेळ ठरवा',
        dateLabel: 'नवीन देय तारीख',
        reasonLabel: 'कारण',
        confirm: 'पुनर्नियोजनाची पुष्टी करा',
      },
      reason: {
        customerNotReachable: 'ग्राहकाशी संपर्क होऊ शकला नाही',
        customerRequestedDelay: 'ग्राहकाने विलंब मागितला',
        internalWorkload: 'अंतर्गत कामाचा भार',
        other: 'इतर',
        leadClosed: 'लीड बंद झाला',
      },
      bulkBar: {
        selectedCount: '{{count}} निवडले',
        clear: 'रिकामे करा',
        reschedule: 'पुन्हा वेळ ठरवा',
        reassign: 'पुन्हा नेमणूक करा',
      },
      reassignSheet: {
        title: 'निवडलेले पुन्हा नेमा',
        assigneeLabel: 'कोणाला द्यायचे',
        confirm: 'नेमणुकीची पुष्टी करा',
      },
      toast: {
        completed: 'फॉलो-अप पूर्ण झाले',
        rescheduled: 'फॉलो-अपची वेळ बदलली',
        reassigned: 'फॉलो-अप पुन्हा नेमले गेले',
        error: 'पूर्ण होऊ शकले नाही — पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
