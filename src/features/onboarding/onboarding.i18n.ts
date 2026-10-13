import type { ScreenTranslations } from '@/i18n/types';

/**
 * Copy for the shared onboarding pieces — the document capture slot and the
 * wizard shell. The three partner wizards each own their own field labels.
 */
const translations: ScreenTranslations = {
  en: {
    docSlot: {
      missing: 'Not uploaded',
      qualityOk: 'Clear enough to read',
      reject: {
        blurry: 'This photo is too soft to read. Hold still, tap the document to focus, and take it again.',
        glare: 'A reflection is washing out part of the document. Move out of direct light or tilt the card slightly.',
        dark: 'This photo is too dark. Move somewhere brighter, or turn a light on.',
        unreadable: 'We could not read anything from this photo. Fill the frame with the document and take it again.',
        unsupportedFormat: 'That file type is not accepted here. Upload a photo (JPG or PNG).',
      },
    },
    wizard: {
      stepOf: 'Step {{current}} of {{total}}',
      restored: 'We kept everything you had already filled in.',
      staleDraft:
        'You started this {{days}} days ago. Everything is still here — pick up where you left off.',
      discard: 'Start over',
      submit: 'Submit for review',
      submitting: 'Sending…',
      incomplete: 'Finish every step before submitting.',
      submitted: {
        title: 'Sent for review',
        body: 'Your application is with the AIEC team. We will let you know as soon as it is approved — usually within a working day.',
        action: 'Back to sign in',
      },
      error: {
        title: 'Could not submit',
        body: 'Your answers are safe and still saved on this device. Try sending again in a moment.',
        already_applied: 'An application from this mobile number is already waiting for review. We will tell you when it has been decided.',
        phone_taken: 'This mobile number is already linked to another AIEC account. Sign in with it, or use a different number.',
      },
    },
  },

  hi: {
    docSlot: {
      missing: 'अपलोड नहीं हुआ',
      qualityOk: 'पढ़ने लायक साफ़ है',
      reject: {
        blurry: 'यह फ़ोटो पढ़ने लायक साफ़ नहीं है। हाथ स्थिर रखिए, दस्तावेज़ पर टैप करके फ़ोकस कीजिए, और दोबारा लीजिए।',
        glare: 'चमक की वजह से दस्तावेज़ का कुछ हिस्सा धुल गया है। सीधी रोशनी से हटिए या कार्ड को थोड़ा तिरछा कीजिए।',
        dark: 'यह फ़ोटो बहुत अंधेरी है। ज़्यादा रोशनी वाली जगह पर जाइए, या लाइट जलाइए।',
        unreadable: 'इस फ़ोटो से कुछ भी पढ़ा नहीं जा सका। दस्तावेज़ को पूरे फ़्रेम में लाकर दोबारा लीजिए।',
        unsupportedFormat: 'यह फ़ाइल यहाँ नहीं चलेगी। फ़ोटो (JPG या PNG) अपलोड कीजिए।',
      },
    },
    wizard: {
      stepOf: 'चरण {{current}} / {{total}}',
      restored: 'आपने जो भी भरा था, वह सब हमने संभालकर रखा है।',
      staleDraft: 'आपने यह {{days}} दिन पहले शुरू किया था। सब कुछ अब भी यहीं है — जहाँ छोड़ा था वहीं से चलिए।',
      discard: 'शुरू से करें',
      submit: 'जाँच के लिए भेजें',
      submitting: 'भेजा जा रहा है…',
      incomplete: 'भेजने से पहले हर चरण पूरा कीजिए।',
      submitted: {
        title: 'जाँच के लिए भेज दिया',
        body: 'आपका आवेदन AIEC टीम के पास है। मंज़ूरी मिलते ही हम बता देंगे — आमतौर पर एक कामकाजी दिन में।',
        action: 'साइन इन पर वापस',
      },
      error: {
        title: 'भेजा नहीं जा सका',
        body: 'आपके जवाब सुरक्षित हैं और इसी डिवाइस पर सहेजे हुए हैं। थोड़ी देर में दोबारा भेजिए।',
        already_applied: 'इस मोबाइल नंबर से एक आवेदन पहले से समीक्षा की प्रतीक्षा में है। निर्णय होते ही हम आपको बताएँगे।',
        phone_taken: 'यह मोबाइल नंबर पहले से किसी दूसरे AIEC खाते से जुड़ा है। उसी से साइन इन करें, या कोई दूसरा नंबर उपयोग करें।',
      },
    },
  },

  mr: {
    docSlot: {
      missing: 'अपलोड झालेले नाही',
      qualityOk: 'वाचण्याइतके स्पष्ट आहे',
      reject: {
        blurry: 'हा फोटो वाचण्याइतका स्पष्ट नाही. हात स्थिर ठेवा, कागदावर टॅप करून फोकस करा, आणि पुन्हा काढा.',
        glare: 'चकाकीमुळे कागदाचा काही भाग पुसट झाला आहे. थेट प्रकाशातून बाजूला व्हा किंवा कार्ड थोडे तिरपे धरा.',
        dark: 'हा फोटो खूप अंधुक आहे. जास्त उजेडाच्या जागी जा, किंवा दिवा लावा.',
        unreadable: 'या फोटोतून काहीही वाचता आले नाही. कागद संपूर्ण चौकटीत आणून पुन्हा काढा.',
        unsupportedFormat: 'ही फाइल इथे चालणार नाही. फोटो (JPG किंवा PNG) अपलोड करा.',
      },
    },
    wizard: {
      stepOf: 'टप्पा {{current}} / {{total}}',
      restored: 'तुम्ही जे भरले होते ते सर्व आम्ही जपून ठेवले आहे.',
      staleDraft: 'तुम्ही हे {{days}} दिवसांपूर्वी सुरू केले होते. सर्व काही अजूनही इथेच आहे — जिथे थांबलात तिथून पुढे चला.',
      discard: 'सुरुवातीपासून करा',
      submit: 'तपासणीसाठी पाठवा',
      submitting: 'पाठवत आहे…',
      incomplete: 'पाठवण्यापूर्वी प्रत्येक टप्पा पूर्ण करा.',
      submitted: {
        title: 'तपासणीसाठी पाठवले',
        body: 'तुमचा अर्ज AIEC टीमकडे आहे. मंजुरी मिळताच आम्ही कळवू — साधारणपणे एका कामकाजाच्या दिवसात.',
        action: 'साइन इनकडे परत',
      },
      error: {
        title: 'पाठवता आले नाही',
        body: 'तुमची उत्तरे सुरक्षित आहेत आणि याच डिव्हाइसवर जतन आहेत. थोड्या वेळाने पुन्हा पाठवा.',
        already_applied: 'या मोबाइल नंबरवरून आलेला अर्ज आधीच तपासणीच्या प्रतीक्षेत आहे. निर्णय होताच आम्ही तुम्हाला कळवू.',
        phone_taken: 'हा मोबाइल नंबर आधीच दुसऱ्या AIEC खात्याशी जोडलेला आहे. त्याने साइन इन करा, किंवा दुसरा नंबर वापरा.',
      },
    },
  },
};

export default translations;
