import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    captureSpec: {
      title: 'The building',
      subtitle: 'Enough detail for a sensible first quote — no need for exact measurements yet.',
      field: {
        floors: 'Floors above ground',
        basements: 'Basement levels',
        usage: 'What is it for',
        stage: 'How far along is it',
        capacity: 'Suggested capacity (persons)',
        capacityHint: 'A starting point based on floors and use — change it if you know better.',
        speed: 'Speed (m/s)',
        shaftWidth: 'Shaft width (mm)',
        shaftDepth: 'Shaft depth (mm)',
        shaftNotVisible: 'Shaft not visible yet at this stage',
        notes: 'Anything unusual',
        notesHint: 'A tight approach road, a height restriction, an old lift being replaced — whatever the next visit should know.',
        mixedUseToggle: 'Mixed use — different floors serve different purposes',
      },
      usage: {
        residential: 'Residential',
        commercial: 'Commercial',
        institutional: 'Institutional',
        mixed: 'Not sure yet',
      },
      stage: {
        foundation: 'Foundation',
        structure: 'Structure going up',
        finishing: 'Finishing',
        ready: 'Ready now',
      },
      stageNote: 'This decides how soon we follow up — a foundation-stage site gets a later, gentler cadence than one that is ready now.',
      estimateNote: 'These are your best estimate from what you can see today, not a final measurement — nobody downstream should read them as one.',
      specializedFlag: 'A building this tall goes through specialised quoting rather than the standard automatic path — still worth capturing fully.',
      requiredNote: 'Floors and capacity are required — they are what the quotation engine needs to give a sensible starting price.',
      invalid: {
        floors: 'Enter how many floors are above ground.',
        capacity: 'Enter a capacity greater than zero.',
      },
    },
  },

  hi: {
    captureSpec: {
      title: 'इमारत',
      subtitle: 'सही कोटेशन के लिए इतनी जानकारी काफ़ी है — अभी सटीक माप की ज़रूरत नहीं।',
      field: {
        floors: 'ज़मीन से ऊपर मंज़िलें',
        basements: 'बेसमेंट के स्तर',
        usage: 'यह किस काम के लिए है',
        stage: 'अभी कहाँ तक बना है',
        capacity: 'सुझाई क्षमता (व्यक्ति)',
        capacityHint: 'मंज़िलों और उपयोग के आधार पर एक शुरुआती अंदाज़ा — बेहतर पता हो तो बदल दीजिए।',
        speed: 'गति (मी/से)',
        shaftWidth: 'शाफ़्ट की चौड़ाई (मिमी)',
        shaftDepth: 'शाफ़्ट की गहराई (मिमी)',
        shaftNotVisible: 'इस चरण में शाफ़्ट अभी दिखता नहीं',
        notes: 'कुछ भी असामान्य',
        notesHint: 'तंग पहुँच वाला रास्ता, ऊँचाई की सीमा, पुरानी लिफ़्ट बदली जा रही हो — जो भी अगली विज़िट को पता होना चाहिए।',
        mixedUseToggle: 'मिश्रित उपयोग — अलग-अलग मंज़िलें अलग-अलग काम के लिए',
      },
      usage: {
        residential: 'आवासीय',
        commercial: 'वाणिज्यिक',
        institutional: 'संस्थागत',
        mixed: 'अभी पक्का नहीं',
      },
      stage: {
        foundation: 'नींव',
        structure: 'ढांचा बन रहा है',
        finishing: 'फ़िनिशिंग',
        ready: 'अभी तैयार',
      },
      stageNote: 'यही तय करता है कि हम कितनी जल्दी फ़ॉलो-अप करें — नींव-स्तर की साइट पर, तैयार साइट से देर और नरम रफ़्तार से फ़ॉलो-अप होता है।',
      estimateNote: 'ये आज जो दिख रहा है उस पर आपका सबसे अच्छा अंदाज़ा हैं, अंतिम माप नहीं — आगे किसी को भी इन्हें अंतिम नहीं मानना चाहिए।',
      specializedFlag: 'इतनी ऊँची इमारत सामान्य ऑटोमेटिक तरीक़े की बजाय विशेष कोटेशन प्रक्रिया से गुज़रती है — फिर भी पूरी जानकारी दर्ज करना ज़रूरी है।',
      requiredNote: 'मंज़िलें और क्षमता ज़रूरी हैं — कोटेशन इंजन को सही शुरुआती क़ीमत देने के लिए यही चाहिए।',
      invalid: {
        floors: 'ज़मीन से ऊपर कितनी मंज़िलें हैं, बताइए।',
        capacity: 'शून्य से ज़्यादा क्षमता डालिए।',
      },
    },
  },

  mr: {
    captureSpec: {
      title: 'इमारत',
      subtitle: 'योग्य कोटेशनसाठी एवढी माहिती पुरेशी आहे — अजून नेमक्या मोजमापांची गरज नाही.',
      field: {
        floors: 'जमिनीवरील मजले',
        basements: 'बेसमेंटचे स्तर',
        usage: 'हे कशासाठी आहे',
        stage: 'अजून किती बांधकाम झाले',
        capacity: 'सुचवलेली क्षमता (व्यक्ती)',
        capacityHint: 'मजले आणि वापरावर आधारित सुरुवातीचा अंदाज — तुम्हाला अधिक चांगले माहीत असल्यास बदला.',
        speed: 'वेग (मी/से)',
        shaftWidth: 'शाफ्टची रुंदी (मिमी)',
        shaftDepth: 'शाफ्टची खोली (मिमी)',
        shaftNotVisible: 'या टप्प्यावर शाफ्ट अजून दिसत नाही',
        notes: 'काही असामान्य',
        notesHint: 'अरुंद प्रवेश रस्ता, उंचीची मर्यादा, जुनी लिफ्ट बदलली जात असणे — पुढच्या भेटीला जे माहीत असायला हवे ते.',
        mixedUseToggle: 'मिश्र वापर — वेगवेगळे मजले वेगवेगळ्या कामासाठी',
      },
      usage: {
        residential: 'निवासी',
        commercial: 'व्यावसायिक',
        institutional: 'संस्थात्मक',
        mixed: 'अजून निश्चित नाही',
      },
      stage: {
        foundation: 'पाया',
        structure: 'रचना उभी राहत आहे',
        finishing: 'फिनिशिंग',
        ready: 'आत्ता तयार',
      },
      stageNote: 'हेच ठरवते आम्ही किती लवकर पाठपुरावा करू — पायाच्या टप्प्यावरील साइटवर, तयार साइटपेक्षा उशिरा आणि सौम्य गतीने पाठपुरावा होतो.',
      estimateNote: 'हे आज जे दिसते त्यावरचा तुमचा सर्वोत्तम अंदाज आहे, अंतिम मोजमाप नाही — पुढे कोणीही यांना अंतिम मानू नये.',
      specializedFlag: 'इतकी उंच इमारत सर्वसाधारण स्वयंचलित मार्गाऐवजी विशेष कोटेशन प्रक्रियेतून जाते — तरीही संपूर्ण माहिती नोंदवणे आवश्यक आहे.',
      requiredNote: 'मजले आणि क्षमता आवश्यक आहेत — कोटेशन इंजिनला योग्य सुरुवातीची किंमत देण्यासाठी हेच लागते.',
      invalid: {
        floors: 'जमिनीवर किती मजले आहेत ते सांगा.',
        capacity: 'शून्यापेक्षा जास्त क्षमता टाका.',
      },
    },
  },
};

export default translations;
