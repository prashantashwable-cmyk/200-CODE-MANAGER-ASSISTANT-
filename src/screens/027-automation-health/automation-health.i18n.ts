import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    automationHealth: {
      title: 'Automation health',
      subtitle: 'The whole automated pipeline, confirmed healthy in under a minute.',
      loading: 'Checking every automation',
      overallHeading: 'Overall pipeline status',
      status: { healthy: 'Healthy', degraded: 'Degraded', down: 'Down', paused: 'Paused' },
      uptime: '{{pct}} uptime, last 30 days',
      runsToday: 'Runs today',
      failuresToday: 'Failures today',
      lastRun: 'Last ran {{time}}',
      avgLatency: 'Average time',
      retry: 'Retry now',
      retrying: 'Retrying…',
      retried: 'Retried',
      pause: 'Pause',
      resume: 'Resume',
      failureLog: 'Recent failures',
      noFailures: 'No failures today',
      stuckLoop: 'stuck — needs a person',
      stuckLoopNote:
        'This has failed the same record several times in a row. Retrying again automatically would not help — it needs a person to look at what it is stuck on.',
      pausedNeedsAttention: 'This is paused but was not paused on purpose — check why before resuming.',
      fullCheckNote:
        'Every automation showing healthy is not the same as everything being fine — for the full picture, check the alerts and exceptions dashboard too.',
      fullCheckLink: 'Open alerts & exceptions',
      reason: {
        recorded: '{{count}} failed today. Last error, as the step recorded it: {{text}}',
        unrecorded: '{{count}} failed today. The step kept no reason for it.',
      },
      empty: {
        title: 'No automations configured yet',
        body: 'Once automation rules are set up, their health will be tracked here.',
      },
      error: {
        title: 'Could not check automation health',
        body: 'We could not reach the automation data. Check your connection and try again.',
      },
    },
  },

  hi: {
    automationHealth: {
      title: 'ऑटोमेशन की सेहत',
      subtitle: 'पूरी ऑटोमेशन पाइपलाइन, एक मिनट से भी कम में सेहतमंद पक्की।',
      loading: 'हर ऑटोमेशन जाँची जा रही है',
      overallHeading: 'पूरी पाइपलाइन की स्थिति',
      status: { healthy: 'सेहतमंद', degraded: 'कमज़ोर', down: 'बंद', paused: 'रुका हुआ' },
      uptime: 'पिछले 30 दिन में {{pct}} अपटाइम',
      runsToday: 'आज चली',
      failuresToday: 'आज फ़ेल हुई',
      lastRun: 'आख़िरी बार {{time}} चली',
      avgLatency: 'औसत समय',
      retry: 'अभी दोबारा कोशिश करें',
      retrying: 'दोबारा कोशिश हो रही है…',
      retried: 'दोबारा कोशिश हुई',
      pause: 'रोकें',
      resume: 'फिर शुरू करें',
      failureLog: 'हाल की नाकामियाँ',
      noFailures: 'आज कोई नाकामी नहीं',
      stuckLoop: 'अटकी — इंसान चाहिए',
      stuckLoopNote:
        'यह एक ही रिकॉर्ड पर लगातार कई बार फ़ेल हुई है। अपने आप दोबारा कोशिश करने से फ़ायदा नहीं होगा — किसी इंसान को देखना होगा कि यह कहाँ अटकी है।',
      pausedNeedsAttention: 'यह रुकी हुई है पर जान-बूझकर नहीं रोकी गई — फिर शुरू करने से पहले वजह जाँच लीजिए।',
      fullCheckNote:
        'हर ऑटोमेशन का सेहतमंद दिखना यह नहीं बताता कि सब कुछ ठीक है — पूरी तस्वीर के लिए चेतावनी और अपवाद डैशबोर्ड भी देखिए।',
      fullCheckLink: 'चेतावनी और अपवाद खोलें',
      reason: {
        recorded: 'आज {{count}} बार फ़ेल हुई। आख़िरी त्रुटि, जैसी इस चरण ने दर्ज की: {{text}}',
        unrecorded: 'आज {{count}} बार फ़ेल हुई। इस चरण ने इसका कोई कारण दर्ज नहीं किया।',
      },
      empty: {
        title: 'अभी कोई ऑटोमेशन तय नहीं हुआ',
        body: 'ऑटोमेशन नियम बनते ही, उनकी सेहत यहाँ दिखने लगेगी।',
      },
      error: {
        title: 'ऑटोमेशन की सेहत जाँची नहीं जा सकी',
        body: 'हम ऑटोमेशन डेटा तक नहीं पहुँच पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
    },
  },

  mr: {
    automationHealth: {
      title: 'स्वयंचलनाचे आरोग्य',
      subtitle: 'संपूर्ण स्वयंचलन साखळी, एका मिनिटापेक्षा कमी वेळात सुदृढ असल्याची खात्री.',
      loading: 'प्रत्येक स्वयंचलन तपासत आहे',
      overallHeading: 'संपूर्ण साखळीची स्थिती',
      status: { healthy: 'सुदृढ', degraded: 'कमकुवत', down: 'बंद', paused: 'थांबलेले' },
      uptime: 'गेल्या 30 दिवसांत {{pct}} अपटाइम',
      runsToday: 'आज चालले',
      failuresToday: 'आज अयशस्वी',
      lastRun: 'शेवटचे {{time}} चालले',
      avgLatency: 'सरासरी वेळ',
      retry: 'आत्ता पुन्हा प्रयत्न करा',
      retrying: 'पुन्हा प्रयत्न करत आहे…',
      retried: 'पुन्हा प्रयत्न झाला',
      pause: 'थांबवा',
      resume: 'पुन्हा सुरू करा',
      failureLog: 'अलीकडील अपयश',
      noFailures: 'आज कोणतेही अपयश नाही',
      stuckLoop: 'अडकले — माणूस हवा',
      stuckLoopNote:
        'हे एकाच नोंदीवर सलग अनेक वेळा अयशस्वी झाले आहे. आपोआप पुन्हा प्रयत्न केल्याने उपयोग होणार नाही — हे कुठे अडकले आहे ते माणसाने पाहायला हवे.',
      pausedNeedsAttention: 'हे थांबलेले आहे पण मुद्दाम थांबवलेले नाही — पुन्हा सुरू करण्यापूर्वी कारण तपासा.',
      fullCheckNote:
        'प्रत्येक स्वयंचलन सुदृढ दिसणे म्हणजे सर्वकाही ठीक आहे असे नाही — संपूर्ण चित्रासाठी सूचना आणि अपवाद डॅशबोर्डही पहा.',
      fullCheckLink: 'सूचना आणि अपवाद उघडा',
      reason: {
        recorded: 'आज {{count}} वेळा अयशस्वी. शेवटची त्रुटी, या टप्प्याने नोंदवली तशी: {{text}}',
        unrecorded: 'आज {{count}} वेळा अयशस्वी. या टप्प्याने याचे कोणतेही कारण नोंदवले नाही.',
      },
      empty: {
        title: 'अजून कोणतेही स्वयंचलन ठरलेले नाही',
        body: 'स्वयंचलन नियम तयार होताच, त्यांचे आरोग्य इथे दिसू लागेल.',
      },
      error: {
        title: 'स्वयंचलनाचे आरोग्य तपासता आले नाही',
        body: 'आम्ही स्वयंचलन माहितीपर्यंत पोहोचू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
