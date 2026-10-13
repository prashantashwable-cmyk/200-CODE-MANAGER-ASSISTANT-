import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    regionConversion: {
      title: 'Conversion by surveyor & region',
      subtitle: 'Star pairings and struggling ones, side by side.',
      loading: 'Building the matrix',
      axis: { surveyorRows: 'Surveyor', regionRows: 'Region' },
      flip: 'Flip rows and columns',
      legend: 'Colour is conversion rate; the small number below is lead volume.',
      significanceNote:
        'Cells with fewer than 5 leads are shown muted rather than strongly coloured — a high rate on 2 leads is not the same claim as a high rate on 200.',
      lowSampleLabel: 'low n',
      blankNote: 'A blank cell means that surveyor has never had a lead in that region — not a 0% they earned.',
      cellSummary: '{{leads}} leads, {{deals}} won — {{rate}} conversion.',
      sheetTitle: '{{name}} in {{region}}',
      noLeads: 'No leads in this combination.',
      historicalNote:
        'Regions reflect the territory boundaries active when each lead was captured, not today’s boundaries retrofitted onto old data.',
      sortBy: 'Sort rows by',
      sort: { name: 'Name', rate: 'Conversion rate', volume: 'Lead volume' },
      empty: {
        title: 'Nothing to compare yet',
        body: 'Once leads have been captured across a few surveyors and regions, the matrix will fill in.',
      },
      error: {
        title: 'Could not build the matrix',
        body: 'We could not reach the lead data. Check your connection and try again.',
      },
    },
  },

  hi: {
    regionConversion: {
      title: 'सर्वेक्षक और इलाक़े के हिसाब से रूपांतरण',
      subtitle: 'बेहतरीन जोड़ियाँ और जूझती जोड़ियाँ, साथ-साथ।',
      loading: 'मैट्रिक्स बन रहा है',
      axis: { surveyorRows: 'सर्वेक्षक', regionRows: 'इलाक़ा' },
      flip: 'पंक्ति-स्तंभ पलटें',
      legend: 'रंग रूपांतरण दर है; नीचे का छोटा अंक लीड की संख्या है।',
      significanceNote:
        '5 से कम लीड वाले सेल हल्के रंग में दिखते हैं, गहरे नहीं — 2 लीड पर ऊँची दर और 200 पर ऊँची दर एक जैसा दावा नहीं है।',
      lowSampleLabel: 'कम नमूना',
      blankNote: 'ख़ाली सेल का मतलब है उस सर्वेक्षक का उस इलाक़े में कभी कोई लीड नहीं आया — यह उसकी कमाई हुई 0% नहीं है।',
      cellSummary: '{{leads}} लीड, {{deals}} जीते — {{rate}} रूपांतरण।',
      sheetTitle: '{{region}} में {{name}}',
      noLeads: 'इस जोड़ी में कोई लीड नहीं।',
      historicalNote:
        'इलाक़े वही सीमाएँ दिखाते हैं जो हर लीड दर्ज होते समय लागू थीं, आज की सीमाएँ पुराने डेटा पर थोपी नहीं गई हैं।',
      sortBy: 'पंक्तियाँ किस आधार पर क्रमबद्ध करें',
      sort: { name: 'नाम', rate: 'रूपांतरण दर', volume: 'लीड संख्या' },
      empty: {
        title: 'अभी तुलना करने को कुछ नहीं',
        body: 'कुछ सर्वेक्षकों और इलाक़ों में लीड दर्ज होते ही, मैट्रिक्स भर जाएगा।',
      },
      error: {
        title: 'मैट्रिक्स नहीं बन पाया',
        body: 'हम लीड डेटा तक नहीं पहुँच पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
    },
  },

  mr: {
    regionConversion: {
      title: 'सर्वेक्षक आणि भागानुसार रूपांतर',
      subtitle: 'उत्तम जोड्या आणि झगडणाऱ्या जोड्या, सोबतच.',
      loading: 'मॅट्रिक्स तयार होत आहे',
      axis: { surveyorRows: 'सर्वेक्षक', regionRows: 'भाग' },
      flip: 'रांगा-स्तंभ बदला',
      legend: 'रंग म्हणजे रूपांतर दर; खालचा छोटा आकडा लीड संख्या आहे.',
      significanceNote:
        '5 पेक्षा कमी लीड असलेले सेल फिकट दाखवले जातात, गडद नाही — 2 लीडवरचा उच्च दर आणि 200 वरचा उच्च दर एकसारखा दावा नाही.',
      lowSampleLabel: 'कमी नमुना',
      blankNote: 'रिकामा सेल म्हणजे त्या सर्वेक्षकाला त्या भागात कधीच लीड मिळाला नाही — ही त्याने कमावलेली 0% नाही.',
      cellSummary: '{{leads}} लीड, {{deals}} जिंकले — {{rate}} रूपांतर.',
      sheetTitle: '{{region}} मध्ये {{name}}',
      noLeads: 'या जोडीत कोणताही लीड नाही.',
      historicalNote:
        'भाग प्रत्येक लीड नोंदवला गेला तेव्हा लागू असलेल्या सीमा दाखवतात, आजच्या सीमा जुन्या माहितीवर लादलेल्या नाहीत.',
      sortBy: 'रांगा कशानुसार लावा',
      sort: { name: 'नाव', rate: 'रूपांतर दर', volume: 'लीड संख्या' },
      empty: {
        title: 'अजून तुलना करण्यासारखे काही नाही',
        body: 'काही सर्वेक्षक आणि भागांत लीड नोंदवले गेले की मॅट्रिक्स भरेल.',
      },
      error: {
        title: 'मॅट्रिक्स तयार होऊ शकला नाही',
        body: 'आम्ही लीड माहितीपर्यंत पोहोचू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
