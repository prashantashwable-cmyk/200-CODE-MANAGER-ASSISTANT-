import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    territories: {
      title: 'Territories',
      subtitle: 'Who covers where, and what each area is actually producing.',
      loading: 'Loading territories',
      mapLabel: 'Territory boundaries and leads that fall outside them',
      unassignedHeading: 'Leads outside every territory',
      unassignedBody:
        'These were captured outside any boundary you have drawn. They are accepted and waiting — nothing is lost — but nobody owns them until you route them.',
      unassignedCount: '{{count}} leads waiting to be routed',
      editorNote:
        'Boundaries are adjusted edge by edge rather than dragged freehand. The map here is a schematic, so nudging exact edges gives a boundary you can trust instead of one that only looks right.',
      save: 'Save this territory',
      saved: 'Territory saved',
      activate: 'Make it active',
      makeDraft: 'Move back to draft',
      assignHeading: 'Who covers this area',
      boundsHeading: 'Adjust the boundary',
      bound: {
        north: 'Northern edge',
        south: 'Southern edge',
        east: 'Eastern edge',
        west: 'Western edge',
        grow: 'Wider',
        shrink: 'Tighter',
      },
      stat: {
        leadsMonth: 'Leads this month',
        leadsTotal: 'Leads all time',
        conversion: 'Conversion',
        area: 'Area',
        density: 'Leads per km²',
        surveyors: 'Surveyors',
      },
      problem: {
        noSurveyor: 'Nobody assigned',
        selfIntersecting: 'Boundary crosses itself',
        tooSmall: 'Suspiciously small',
        overlapping: 'Overlaps another',
        draft: 'Draft',
      },
      overlapNote:
        'This overlaps {{zones}}. Overlaps are allowed and useful during a handover — this is here so you know it is deliberate rather than a mistake.',
      tieBreakNote:
        'A lead landing in an overlap goes to whichever assigned surveyor is closer at the moment it is captured, and the reason is logged with the lead.',
      forwardOnlyNote:
        'A boundary change applies from now on. Leads already captured today keep the territory they had when they were captured.',
      empty: {
        title: 'No territories yet',
        body: 'Draw your first territory to start routing leads to the right surveyor automatically.',
      },
      error: {
        title: 'Could not load territories',
        body: 'We could not reach the territory data. Check your connection and try again.',
      },
    },
  },

  hi: {
    territories: {
      title: 'इलाक़े',
      subtitle: 'कौन कहाँ देखता है, और हर इलाक़ा असल में क्या दे रहा है।',
      loading: 'इलाक़े लोड हो रहे हैं',
      mapLabel: 'इलाक़ों की सीमाएँ और उनसे बाहर पड़े लीड',
      unassignedHeading: 'हर इलाक़े से बाहर के लीड',
      unassignedBody:
        'ये आपकी खींची किसी भी सीमा से बाहर दर्ज हुए। इन्हें स्वीकार कर लिया गया है और ये इंतज़ार में हैं — कुछ खोया नहीं — पर जब तक आप इन्हें किसी को नहीं सौंपते, इनका कोई मालिक नहीं।',
      unassignedCount: '{{count}} लीड सौंपे जाने के इंतज़ार में',
      editorNote:
        'सीमाएँ हाथ से खींचने के बजाय किनारा-दर-किनारा बदली जाती हैं। यहाँ का नक्शा एक ख़ाका है, इसलिए सटीक किनारे खिसकाने से ऐसी सीमा बनती है जिस पर भरोसा किया जा सके, न कि सिर्फ़ देखने में सही लगे।',
      save: 'यह इलाक़ा सहेजें',
      saved: 'इलाक़ा सहेज लिया',
      activate: 'चालू करें',
      makeDraft: 'वापस मसौदे में डालें',
      assignHeading: 'यह इलाक़ा कौन देखेगा',
      boundsHeading: 'सीमा बदलिए',
      bound: {
        north: 'उत्तरी किनारा',
        south: 'दक्षिणी किनारा',
        east: 'पूर्वी किनारा',
        west: 'पश्चिमी किनारा',
        grow: 'चौड़ा',
        shrink: 'सँकरा',
      },
      stat: {
        leadsMonth: 'इस महीने के लीड',
        leadsTotal: 'कुल लीड',
        conversion: 'रूपांतरण',
        area: 'क्षेत्रफल',
        density: 'प्रति वर्ग किमी लीड',
        surveyors: 'सर्वेक्षक',
      },
      problem: {
        noSurveyor: 'कोई नियुक्त नहीं',
        selfIntersecting: 'सीमा ख़ुद को काटती है',
        tooSmall: 'संदेहजनक रूप से छोटा',
        overlapping: 'दूसरे से ओवरलैप',
        draft: 'मसौदा',
      },
      overlapNote:
        'यह {{zones}} से ओवरलैप करता है। हस्तांतरण के समय ओवरलैप चलता है और काम का भी है — यह इसलिए लिखा है ताकि आपको पता रहे कि यह जान-बूझकर है, ग़लती नहीं।',
      tieBreakNote:
        'ओवरलैप में गिरा लीड उसी नियुक्त सर्वेक्षक को जाता है जो दर्ज होने के समय ज़्यादा पास हो, और वजह लीड के साथ दर्ज हो जाती है।',
      forwardOnlyNote:
        'सीमा में बदलाव अब से लागू होता है। आज पहले दर्ज हो चुके लीड उसी इलाक़े में रहेंगे जो दर्ज होते समय था।',
      empty: {
        title: 'अभी कोई इलाक़ा नहीं',
        body: 'पहला इलाक़ा बनाइए, ताकि लीड अपने आप सही सर्वेक्षक तक पहुँचने लगें।',
      },
      error: {
        title: 'इलाक़े लोड नहीं हो पाए',
        body: 'हम इलाक़ों के डेटा तक नहीं पहुँच पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
    },
  },

  mr: {
    territories: {
      title: 'भाग',
      subtitle: 'कोण कुठे पाहतो, आणि प्रत्येक भाग प्रत्यक्षात काय देतो.',
      loading: 'भाग लोड होत आहेत',
      mapLabel: 'भागांच्या सीमा आणि त्यांच्या बाहेर पडलेले लीड',
      unassignedHeading: 'प्रत्येक भागाबाहेरचे लीड',
      unassignedBody:
        'हे तुम्ही आखलेल्या कोणत्याही सीमेबाहेर नोंदले गेले. ते स्वीकारले आहेत आणि वाट पाहत आहेत — काहीही हरवलेले नाही — पण तुम्ही कोणाला सोपवेपर्यंत त्यांचा मालक कोणी नाही.',
      unassignedCount: '{{count}} लीड सोपवण्याच्या प्रतीक्षेत',
      editorNote:
        'सीमा हाताने आखण्याऐवजी कडे-कडेने बदलल्या जातात. इथला नकाशा आराखडा आहे, त्यामुळे नेमक्या कडा सरकवल्याने विश्वास ठेवता येईल अशी सीमा मिळते, फक्त दिसायला बरोबर वाटणारी नाही.',
      save: 'हा भाग जतन करा',
      saved: 'भाग जतन झाला',
      activate: 'सुरू करा',
      makeDraft: 'पुन्हा मसुद्यात टाका',
      assignHeading: 'हा भाग कोण पाहणार',
      boundsHeading: 'सीमा बदला',
      bound: {
        north: 'उत्तरेकडची कड',
        south: 'दक्षिणेकडची कड',
        east: 'पूर्वेकडची कड',
        west: 'पश्चिमेकडची कड',
        grow: 'रुंद',
        shrink: 'अरुंद',
      },
      stat: {
        leadsMonth: 'या महिन्याचे लीड',
        leadsTotal: 'एकूण लीड',
        conversion: 'रूपांतर',
        area: 'क्षेत्रफळ',
        density: 'प्रति चौ. किमी लीड',
        surveyors: 'सर्वेक्षक',
      },
      problem: {
        noSurveyor: 'कोणीही नेमलेले नाही',
        selfIntersecting: 'सीमा स्वतःला छेदते',
        tooSmall: 'संशयास्पदरीत्या लहान',
        overlapping: 'दुसऱ्याशी आच्छादन',
        draft: 'मसुदा',
      },
      overlapNote:
        'हे {{zones}} शी आच्छादते. हस्तांतरणाच्या काळात आच्छादन चालते आणि उपयोगीही असते — हे इथे लिहिले आहे म्हणजे तुम्हाला कळेल की हे मुद्दाम आहे, चूक नाही.',
      tieBreakNote:
        'आच्छादनात पडलेला लीड नोंदणीच्या वेळी जो नेमलेला सर्वेक्षक अधिक जवळ असेल त्याला जातो, आणि त्याचे कारण लीडसोबत नोंदले जाते.',
      forwardOnlyNote:
        'सीमेतील बदल आतापासून लागू होतो. आज आधीच नोंदलेले लीड नोंदणीच्या वेळी होते त्याच भागात राहतात.',
      empty: {
        title: 'अजून कोणताही भाग नाही',
        body: 'पहिला भाग आखा, म्हणजे लीड आपोआप योग्य सर्वेक्षकाकडे जाऊ लागतील.',
      },
      error: {
        title: 'भाग लोड होऊ शकले नाहीत',
        body: 'आम्ही भागांच्या माहितीपर्यंत पोहोचू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
