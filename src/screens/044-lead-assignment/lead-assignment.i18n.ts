import type { ScreenTranslations } from '@/i18n/types';

/**
 * Screen 044 owns the shared `assignment.reason.*` key set — the plain-
 * language explanation behind `suggestAssignee`'s suggestion, reused
 * anywhere else a suggested owner might be shown.
 */
const translations: ScreenTranslations = {
  en: {
    assignment: {
      reason: {
        proximity: 'Nearest available surveyor to this site',
        workload: 'Has the lightest open lead load right now',
      },
    },
    leadAssignment: {
      title: 'Lead assignment',
      subtitle: 'Give every lead an owner, fairly.',
      loading: 'Loading assignment queue',
      error: { title: 'Could not load assignment data', body: 'Check your connection and try again.' },
      queue: {
        heading: 'Awaiting an owner',
        empty: 'Nothing unassigned right now — every lead has an owner.',
        suggested: 'Suggested: {{name}}',
        suggestedTag: 'suggested',
        noSuggestion: 'No on-duty surveyor available to suggest right now.',
        waitingDays: '{{count}}d waiting',
      },
      assignSheet: {
        title: 'Assign — {{site}}',
        assigneeLabel: 'Assign to',
        reasonLabel: 'Reason',
        reasonHint: 'Required — kept on this lead’s record.',
        confirm: 'Confirm assignment',
      },
      redistribute: {
        heading: 'Redistribute a surveyor’s leads',
        body: 'For when a surveyor leaves or a territory needs rebalancing — move part or all of their open book to someone else.',
        fromLabel: 'From surveyor',
        fromPlaceholder: 'Choose a surveyor',
        none: 'This surveyor has no open leads to redistribute.',
        selectedCount: '{{count}} selected',
        selectAll: 'Select all',
        clear: 'Clear',
        reassignButton: 'Reassign selected',
      },
      bulkSheet: {
        title: 'Bulk reassign',
        previewHeading: 'Affected leads ({{count}})',
        assigneeLabel: 'New owner',
        reasonLabel: 'Reason',
        confirm: 'Confirm bulk reassignment',
      },
      toast: {
        assigned: 'Lead assigned',
        bulkAssigned: '{{count}} leads reassigned',
        ineligible: 'Could not complete — the chosen surveyor may no longer be eligible.',
      },
    },
  },

  hi: {
    assignment: {
      reason: {
        proximity: 'इस साइट के सबसे नज़दीक उपलब्ध सर्वेक्षक',
        workload: 'अभी सबसे हल्का खुला लीड बोझ है',
      },
    },
    leadAssignment: {
      title: 'लीड असाइनमेंट',
      subtitle: 'हर लीड को निष्पक्षता से एक मालिक दीजिए।',
      loading: 'असाइनमेंट क्यू लोड हो रहा है',
      error: { title: 'असाइनमेंट डेटा लोड नहीं हो पाया', body: 'नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।' },
      queue: {
        heading: 'मालिक की प्रतीक्षा में',
        empty: 'अभी कुछ भी अनसाइन्ड नहीं है — हर लीड का एक मालिक है।',
        suggested: 'सुझाव: {{name}}',
        suggestedTag: 'सुझाया गया',
        noSuggestion: 'अभी सुझाने के लिए कोई ड्यूटी पर सर्वेक्षक उपलब्ध नहीं है।',
        waitingDays: '{{count}} दिन से प्रतीक्षा में',
      },
      assignSheet: {
        title: 'असाइन करें — {{site}}',
        assigneeLabel: 'किसे सौंपें',
        reasonLabel: 'कारण',
        reasonHint: 'ज़रूरी — इस लीड के रिकॉर्ड में रखा जाता है।',
        confirm: 'असाइनमेंट की पुष्टि करें',
      },
      redistribute: {
        heading: 'सर्वेक्षक के लीड फिर से बाँटें',
        body: 'जब कोई सर्वेक्षक छोड़ता है या टेरिटरी संतुलित करनी हो — उनके खुले लीड का कुछ या पूरा हिस्सा किसी और को दीजिए।',
        fromLabel: 'किस सर्वेक्षक से',
        fromPlaceholder: 'एक सर्वेक्षक चुनें',
        none: 'इस सर्वेक्षक के पास बाँटने के लिए कोई खुला लीड नहीं है।',
        selectedCount: '{{count}} चुने गए',
        selectAll: 'सभी चुनें',
        clear: 'हटाएँ',
        reassignButton: 'चुने गए फिर से सौंपें',
      },
      bulkSheet: {
        title: 'बल्क रीअसाइन',
        previewHeading: 'प्रभावित लीड ({{count}})',
        assigneeLabel: 'नया मालिक',
        reasonLabel: 'कारण',
        confirm: 'बल्क रीअसाइनमेंट की पुष्टि करें',
      },
      toast: {
        assigned: 'लीड असाइन हो गया',
        bulkAssigned: '{{count}} लीड फिर से सौंपे गए',
        ineligible: 'पूरा नहीं हो पाया — चुना गया सर्वेक्षक अब पात्र नहीं हो सकता।',
      },
    },
  },

  mr: {
    assignment: {
      reason: {
        proximity: 'या साइटच्या सर्वात जवळचा उपलब्ध सर्वेक्षक',
        workload: 'सध्या सर्वात हलका खुला लीड भार आहे',
      },
    },
    leadAssignment: {
      title: 'लीड नेमणूक',
      subtitle: 'प्रत्येक लीडला निष्पक्षपणे मालक द्या.',
      loading: 'नेमणूक क्यू लोड होत आहे',
      error: { title: 'नेमणूक डेटा लोड होऊ शकला नाही', body: 'नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.' },
      queue: {
        heading: 'मालकाच्या प्रतीक्षेत',
        empty: 'सध्या काहीही नेमणूक न झालेले नाही — प्रत्येक लीडला मालक आहे.',
        suggested: 'सुचवलेले: {{name}}',
        suggestedTag: 'सुचवलेले',
        noSuggestion: 'सध्या सुचवण्यासाठी कोणताही ड्युटीवरचा सर्वेक्षक उपलब्ध नाही.',
        waitingDays: '{{count}} दिवसांपासून प्रतीक्षेत',
      },
      assignSheet: {
        title: 'नेमणूक करा — {{site}}',
        assigneeLabel: 'कोणाला द्यायचे',
        reasonLabel: 'कारण',
        reasonHint: 'आवश्यक — या लीडच्या नोंदीत ठेवले जाते.',
        confirm: 'नेमणुकीची पुष्टी करा',
      },
      redistribute: {
        heading: 'सर्वेक्षकाचे लीड पुन्हा वाटा',
        body: 'सर्वेक्षक सोडून जातो किंवा टेरिटरी संतुलित करायची असते तेव्हा — त्यांच्या खुल्या लीडपैकी काही किंवा सर्व दुसऱ्याला द्या.',
        fromLabel: 'कोणत्या सर्वेक्षकाकडून',
        fromPlaceholder: 'एक सर्वेक्षक निवडा',
        none: 'या सर्वेक्षकाकडे वाटण्यासाठी कोणताही खुला लीड नाही.',
        selectedCount: '{{count}} निवडले',
        selectAll: 'सर्व निवडा',
        clear: 'रिकामे करा',
        reassignButton: 'निवडलेले पुन्हा नेमा',
      },
      bulkSheet: {
        title: 'बल्क पुनर्नेमणूक',
        previewHeading: 'परिणाम झालेले लीड ({{count}})',
        assigneeLabel: 'नवीन मालक',
        reasonLabel: 'कारण',
        confirm: 'बल्क पुनर्नेमणुकीची पुष्टी करा',
      },
      toast: {
        assigned: 'लीड नेमला गेला',
        bulkAssigned: '{{count}} लीड पुन्हा नेमले गेले',
        ineligible: 'पूर्ण होऊ शकले नाही — निवडलेला सर्वेक्षक आता पात्र नसेल.',
      },
    },
  },
};

export default translations;
