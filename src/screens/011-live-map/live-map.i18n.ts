import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    liveMap: {
      title: 'Live operations',
      subtitle: 'Everyone and everything moving right now, on one map.',
      mapLabel: 'Live map of field staff, sites and alerts',
      loading: 'Connecting to live data',
      activityLink: 'Open the activity feed',
      schematicNote:
        'This map is a schematic of the operating area, not a survey-grade basemap — use it to see who is where, not to measure distances.',
      status: {
        connecting: 'Connecting',
        live: 'Live',
        reconnecting: 'Reconnecting — showing the last known positions',
        error: 'Not connected',
        updatedAgo: 'Updated {{time}}',
      },
      counter: {
        onDuty: 'On duty',
        leadsToday: 'Leads today',
        jobsInProgress: 'Jobs running',
        alerts: 'Needs attention',
        lostSignal: 'Lost signal',
      },
      layer: {
        heading: 'Layers',
        surveyors: 'Surveyors',
        technicians: 'Technicians',
        leads: 'Leads',
        jobs: 'Installations',
        territories: 'Territories',
        alerts: 'Alerts',
        manage: 'Filters',
      },
      staffStatus: {
        idle: 'Off duty',
        traveling: 'On the move',
        onsite: 'At a site',
        lostSignal: 'No signal for over 20 minutes',
      },
      card: {
        timeOnSite: 'Currently at',
        lastPing: 'Last heard from',
        noTask: 'Not at a site right now',
        viewDetail: 'Full detail',
        call: 'Call',
        message: 'Message',
        clusterTitle: '{{count}} people here',
        clusterBody: 'They are at the same spot — likely sharing a vehicle. Tap anyone to see their detail.',
      },
      empty: {
        title: 'Nobody is out in the field',
        body: 'When a surveyor or technician goes on duty, they will appear here within fifteen seconds.',
      },
      error: {
        title: 'Cannot reach live data',
        body: 'The map could not load. Check your connection and try again — nothing has been lost.',
      },
    },
  },

  hi: {
    liveMap: {
      title: 'लाइव संचालन',
      subtitle: 'अभी जो कुछ भी चल रहा है, सब एक ही नक्शे पर।',
      mapLabel: 'फ़ील्ड स्टाफ़, साइट और चेतावनियों का लाइव नक्शा',
      loading: 'लाइव डेटा से जुड़ रहे हैं',
      activityLink: 'गतिविधि फ़ीड खोलें',
      schematicNote:
        'यह नक्शा कार्यक्षेत्र का ख़ाका है, सर्वे-स्तर का नक्शा नहीं — इससे देखिए कौन कहाँ है, दूरी मत नापिए।',
      status: {
        connecting: 'जुड़ रहे हैं',
        live: 'लाइव',
        reconnecting: 'फिर से जुड़ रहे हैं — आख़िरी ज्ञात जगहें दिख रही हैं',
        error: 'जुड़ा नहीं है',
        updatedAgo: '{{time}} अपडेट हुआ',
      },
      counter: {
        onDuty: 'ड्यूटी पर',
        leadsToday: 'आज के लीड',
        jobsInProgress: 'चल रहे काम',
        alerts: 'ध्यान चाहिए',
        lostSignal: 'सिग्नल गया',
      },
      layer: {
        heading: 'परतें',
        surveyors: 'सर्वेक्षक',
        technicians: 'तकनीशियन',
        leads: 'लीड',
        jobs: 'इंस्टॉलेशन',
        territories: 'इलाक़े',
        alerts: 'चेतावनी',
        manage: 'फ़िल्टर',
      },
      staffStatus: {
        idle: 'ड्यूटी पर नहीं',
        traveling: 'रास्ते में',
        onsite: 'साइट पर',
        lostSignal: '20 मिनट से ज़्यादा से कोई सिग्नल नहीं',
      },
      card: {
        timeOnSite: 'इस समय कहाँ',
        lastPing: 'आख़िरी बार कब सुना',
        noTask: 'अभी किसी साइट पर नहीं',
        viewDetail: 'पूरा विवरण',
        call: 'कॉल',
        message: 'संदेश',
        clusterTitle: 'यहाँ {{count}} लोग',
        clusterBody: 'ये एक ही जगह पर हैं — शायद एक ही गाड़ी में। किसी पर भी टैप करके उसका विवरण देखिए।',
      },
      empty: {
        title: 'कोई भी फ़ील्ड में नहीं है',
        body: 'जैसे ही कोई सर्वेक्षक या तकनीशियन ड्यूटी पर आएगा, वह पंद्रह सेकंड में यहाँ दिखने लगेगा।',
      },
      error: {
        title: 'लाइव डेटा तक नहीं पहुँच पा रहे',
        body: 'नक्शा लोड नहीं हुआ। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए — कुछ भी खोया नहीं है।',
      },
    },
  },

  mr: {
    liveMap: {
      title: 'थेट कामकाज',
      subtitle: 'आत्ता जे काही चालू आहे, ते सर्व एकाच नकाशावर.',
      mapLabel: 'क्षेत्रातील कर्मचारी, साइट आणि सूचनांचा थेट नकाशा',
      loading: 'थेट माहितीशी जोडत आहे',
      activityLink: 'घडामोडींची यादी उघडा',
      schematicNote:
        'हा नकाशा कार्यक्षेत्राचा आराखडा आहे, सर्वेक्षण-दर्जाचा नकाशा नाही — यावरून कोण कुठे आहे ते पहा, अंतर मोजू नका.',
      status: {
        connecting: 'जोडत आहे',
        live: 'थेट',
        reconnecting: 'पुन्हा जोडत आहे — शेवटच्या माहीत जागा दिसत आहेत',
        error: 'जोडलेले नाही',
        updatedAgo: '{{time}} अपडेट झाले',
      },
      counter: {
        onDuty: 'कामावर',
        leadsToday: 'आजचे लीड',
        jobsInProgress: 'चालू कामे',
        alerts: 'लक्ष हवे',
        lostSignal: 'सिग्नल गेला',
      },
      layer: {
        heading: 'स्तर',
        surveyors: 'सर्वेक्षक',
        technicians: 'तंत्रज्ञ',
        leads: 'लीड',
        jobs: 'बसवणुका',
        territories: 'भाग',
        alerts: 'सूचना',
        manage: 'फिल्टर',
      },
      staffStatus: {
        idle: 'कामावर नाही',
        traveling: 'वाटेत',
        onsite: 'साइटवर',
        lostSignal: '२० मिनिटांहून अधिक काळ सिग्नल नाही',
      },
      card: {
        timeOnSite: 'सध्या कुठे',
        lastPing: 'शेवटचे कधी कळले',
        noTask: 'सध्या कोणत्याही साइटवर नाही',
        viewDetail: 'संपूर्ण तपशील',
        call: 'फोन',
        message: 'संदेश',
        clusterTitle: 'इथे {{count}} जण',
        clusterBody: 'हे एकाच जागी आहेत — बहुधा एकाच गाडीत. कोणावरही टॅप करून त्यांचा तपशील पहा.',
      },
      empty: {
        title: 'कोणीही क्षेत्रात नाही',
        body: 'एखादा सर्वेक्षक किंवा तंत्रज्ञ कामावर येताच तो पंधरा सेकंदांत इथे दिसू लागेल.',
      },
      error: {
        title: 'थेट माहितीपर्यंत पोहोचता येत नाही',
        body: 'नकाशा लोड झाला नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा — काहीही हरवलेले नाही.',
      },
    },
  },
};

export default translations;
