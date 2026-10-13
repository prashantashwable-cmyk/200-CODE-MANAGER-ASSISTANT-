import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    mapFilters: {
      title: 'Map filters',
      subtitle: 'Choose what the live map shows. Saved as you change it.',
      activeCount: '{{count}} filters on',
      noneHidden: 'Showing everything',
      clearAll: 'Show everything again',
      backToMap: 'Back to the map',
      saved: 'Saved',
      section: {
        layers: 'What to show',
        stages: 'Lead stages',
        severities: 'Alert levels',
        window: 'How far back',
        people: 'People',
      },
      layer: {
        surveyors: 'Surveyors',
        technicians: 'Technicians',
        leads: 'Leads',
        jobs: 'Installations',
        territories: 'Territories',
        alerts: 'Alerts',
      },
      window: { today: 'Today', '7': 'Last 7 days', '30': 'Last 30 days', all: 'Everything' },
      onlyOnDuty: 'Only people currently on duty',
      onlyOnDutyHint: 'Hides anyone who has finished for the day, to keep a busy map readable.',
      emptyLayerWarning: 'Nothing is switched on, so the map will be empty.',
      preview: 'This selection would show',
      previewCount: '{{count}} things on the map',
    },
  },

  hi: {
    mapFilters: {
      title: 'नक्शा फ़िल्टर',
      subtitle: 'तय कीजिए लाइव नक्शा क्या दिखाए। बदलते ही सहेज लिया जाता है।',
      activeCount: '{{count}} फ़िल्टर चालू',
      noneHidden: 'सब कुछ दिख रहा है',
      clearAll: 'फिर से सब दिखाएँ',
      backToMap: 'नक्शे पर वापस',
      saved: 'सहेज लिया',
      section: {
        layers: 'क्या दिखाना है',
        stages: 'लीड के चरण',
        severities: 'चेतावनी का स्तर',
        window: 'कितना पीछे तक',
        people: 'लोग',
      },
      layer: {
        surveyors: 'सर्वेक्षक',
        technicians: 'तकनीशियन',
        leads: 'लीड',
        jobs: 'इंस्टॉलेशन',
        territories: 'इलाक़े',
        alerts: 'चेतावनी',
      },
      window: { today: 'आज', '7': 'पिछले 7 दिन', '30': 'पिछले 30 दिन', all: 'सब कुछ' },
      onlyOnDuty: 'सिर्फ़ अभी ड्यूटी पर मौजूद लोग',
      onlyOnDutyHint: 'जिनका दिन ख़त्म हो गया उन्हें छिपा देता है, ताकि भरा हुआ नक्शा पढ़ा जा सके।',
      emptyLayerWarning: 'कुछ भी चालू नहीं है, इसलिए नक्शा ख़ाली रहेगा।',
      preview: 'इस चुनाव में दिखेंगे',
      previewCount: 'नक्शे पर {{count}} चीज़ें',
    },
  },

  mr: {
    mapFilters: {
      title: 'नकाशा फिल्टर',
      subtitle: 'थेट नकाशाने काय दाखवायचे ते ठरवा. बदलताच जतन होते.',
      activeCount: '{{count}} फिल्टर चालू',
      noneHidden: 'सर्व काही दिसत आहे',
      clearAll: 'पुन्हा सर्व दाखवा',
      backToMap: 'नकाशाकडे परत',
      saved: 'जतन झाले',
      section: {
        layers: 'काय दाखवायचे',
        stages: 'लीडचे टप्पे',
        severities: 'सूचनेची पातळी',
        window: 'किती मागचे',
        people: 'माणसे',
      },
      layer: {
        surveyors: 'सर्वेक्षक',
        technicians: 'तंत्रज्ञ',
        leads: 'लीड',
        jobs: 'बसवणुका',
        territories: 'भाग',
        alerts: 'सूचना',
      },
      window: { today: 'आज', '7': 'गेले ७ दिवस', '30': 'गेले ३० दिवस', all: 'सर्व काही' },
      onlyOnDuty: 'फक्त सध्या कामावर असलेली माणसे',
      onlyOnDutyHint: 'ज्यांचा दिवस संपला त्यांना लपवते, म्हणजे गजबजलेला नकाशा वाचता येतो.',
      emptyLayerWarning: 'काहीही चालू नाही, त्यामुळे नकाशा रिकामा राहील.',
      preview: 'या निवडीत दिसतील',
      previewCount: 'नकाशावर {{count}} गोष्टी',
    },
  },
};

export default translations;
