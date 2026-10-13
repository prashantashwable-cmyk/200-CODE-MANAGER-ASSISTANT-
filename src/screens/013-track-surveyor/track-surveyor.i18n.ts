import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    trackSurveyor: {
      title: 'Surveyor detail',
      loading: 'Loading the day',
      mapLabel: "This surveyor's route and stops for the selected day",
      datePicker: 'Show me',
      readOnlyNote:
        'This view is read-only. You can review and flag what was logged, but never change a surveyor’s own record.',
      lastSeen: 'Last heard from {{time}}',
      signalLost:
        'No signal for {{count}} minutes. The route below stops where the phone last reported — it does not mean they stopped working.',
      lowAccuracyNote:
        'The faint dashed stretches are where GPS accuracy was poor. Treat those positions as approximate.',
      stat: {
        distance: 'Distance',
        leads: 'Leads captured',
        avgPerSite: 'Average per site',
        flagged: 'Flagged visits',
        progress: 'Stops done',
      },
      visits: {
        heading: 'Sites visited',
        onSite: '{{count}} min on site',
        notArrived: 'Not yet arrived',
        outlier:
          'Unusually long at this address. Could be a large survey, could be idle time — worth a quick word.',
        photos: '{{count}} photos',
        flagged: 'Flagged',
      },
      contact: { call: 'Call', whatsapp: 'WhatsApp', message: 'Message' },
      notFound: {
        title: 'Surveyor not found',
        body: 'No surveyor matches this link. They may have been removed, or the link may be out of date.',
      },
      beforeJoining: {
        title: 'Before they joined',
        body: 'This date is earlier than this surveyor’s first day with AIEC, so there is nothing to show.',
      },
      empty: {
        title: 'Nothing logged that day',
        body: 'No route, no visits and no leads were recorded. Pick another date to compare.',
      },
      error: {
        title: 'Could not load this day',
        body: 'We could not reach the tracking data. Check your connection and try again.',
      },
    },
  },

  hi: {
    trackSurveyor: {
      title: 'सर्वेक्षक विवरण',
      loading: 'दिन लोड हो रहा है',
      mapLabel: 'चुने हुए दिन का इस सर्वेक्षक का रास्ता और पड़ाव',
      datePicker: 'कौन सा दिन दिखाएँ',
      readOnlyNote:
        'यह दृश्य सिर्फ़ देखने के लिए है। आप दर्ज बातों की जाँच कर सकते हैं और निशान लगा सकते हैं, पर सर्वेक्षक का अपना रिकॉर्ड कभी बदल नहीं सकते।',
      lastSeen: 'आख़िरी बार {{time}} सुना',
      signalLost:
        '{{count}} मिनट से कोई सिग्नल नहीं। नीचे का रास्ता वहीं रुका है जहाँ से फ़ोन ने आख़िरी ख़बर दी — इसका मतलब यह नहीं कि उन्होंने काम बंद कर दिया।',
      lowAccuracyNote:
        'हल्की बिंदीदार लकीरें वहाँ हैं जहाँ GPS की सटीकता कमज़ोर थी। उन जगहों को अनुमानित मानिए।',
      stat: {
        distance: 'दूरी',
        leads: 'दर्ज लीड',
        avgPerSite: 'हर साइट पर औसत',
        flagged: 'निशान लगी विज़िट',
        progress: 'पूरे पड़ाव',
      },
      visits: {
        heading: 'देखी गई साइटें',
        onSite: 'साइट पर {{count}} मिनट',
        notArrived: 'अभी पहुँचे नहीं',
        outlier:
          'इस पते पर असामान्य रूप से ज़्यादा समय। बड़ा सर्वे भी हो सकता है, ख़ाली समय भी — एक बार बात कर लेना ठीक रहेगा।',
        photos: '{{count}} फ़ोटो',
        flagged: 'निशान लगा',
      },
      contact: { call: 'कॉल', whatsapp: 'WhatsApp', message: 'संदेश' },
      notFound: {
        title: 'सर्वेक्षक नहीं मिला',
        body: 'इस लिंक से कोई सर्वेक्षक मेल नहीं खाता। हो सकता है उन्हें हटा दिया गया हो, या लिंक पुराना हो।',
      },
      beforeJoining: {
        title: 'जुड़ने से पहले का दिन',
        body: 'यह तारीख़ इस सर्वेक्षक के AIEC में पहले दिन से पहले की है, इसलिए दिखाने को कुछ नहीं है।',
      },
      empty: {
        title: 'उस दिन कुछ दर्ज नहीं हुआ',
        body: 'न कोई रास्ता, न विज़िट, न लीड दर्ज हुए। तुलना के लिए दूसरी तारीख़ चुनिए।',
      },
      error: {
        title: 'यह दिन लोड नहीं हो पाया',
        body: 'हम ट्रैकिंग डेटा तक नहीं पहुँच पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
    },
  },

  mr: {
    trackSurveyor: {
      title: 'सर्वेक्षक तपशील',
      loading: 'दिवस लोड होत आहे',
      mapLabel: 'निवडलेल्या दिवशीचा या सर्वेक्षकाचा मार्ग आणि थांबे',
      datePicker: 'कोणता दिवस दाखवू',
      readOnlyNote:
        'हे दृश्य फक्त पाहण्यासाठी आहे. नोंदवलेल्या गोष्टी तपासता येतात आणि खूण करता येते, पण सर्वेक्षकाची स्वतःची नोंद कधीच बदलता येत नाही.',
      lastSeen: 'शेवटचे {{time}} कळले',
      signalLost:
        '{{count}} मिनिटांपासून सिग्नल नाही. खालचा मार्ग तिथेच थांबला आहे जिथून फोनने शेवटची खबर दिली — त्यांनी काम थांबवले असा त्याचा अर्थ नाही.',
      lowAccuracyNote:
        'फिकट तुटक रेषा तिथे आहेत जिथे GPS ची अचूकता कमी होती. त्या जागा अंदाजे माना.',
      stat: {
        distance: 'अंतर',
        leads: 'नोंदवलेले लीड',
        avgPerSite: 'प्रत्येक साइटवर सरासरी',
        flagged: 'खूण केलेल्या भेटी',
        progress: 'पूर्ण झालेले थांबे',
      },
      visits: {
        heading: 'भेट दिलेल्या साइट',
        onSite: 'साइटवर {{count}} मिनिटे',
        notArrived: 'अजून पोहोचले नाहीत',
        outlier:
          'या पत्त्यावर असामान्यपणे जास्त वेळ. मोठे सर्वेक्षणही असू शकते, रिकामा वेळही — एकदा बोलून घेणे बरे.',
        photos: '{{count}} फोटो',
        flagged: 'खूण केलेले',
      },
      contact: { call: 'फोन', whatsapp: 'WhatsApp', message: 'संदेश' },
      notFound: {
        title: 'सर्वेक्षक सापडला नाही',
        body: 'या दुव्याशी कोणताही सर्वेक्षक जुळत नाही. कदाचित त्यांना काढले असेल, किंवा दुवा जुना असेल.',
      },
      beforeJoining: {
        title: 'रुजू होण्यापूर्वीचा दिवस',
        body: 'ही तारीख या सर्वेक्षकाच्या AIEC मधील पहिल्या दिवसाआधीची आहे, त्यामुळे दाखवण्यासारखे काही नाही.',
      },
      empty: {
        title: 'त्या दिवशी काहीच नोंदले नाही',
        body: 'ना मार्ग, ना भेटी, ना लीड नोंदले गेले. तुलनेसाठी दुसरी तारीख निवडा.',
      },
      error: {
        title: 'हा दिवस लोड होऊ शकला नाही',
        body: 'आम्ही मागोवा माहितीपर्यंत पोहोचू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
