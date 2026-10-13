import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    permissions: {
      title: 'A few things AIEC needs',
      subtitle: 'Here is exactly what each one is for, before your phone asks.',
      enableAll: 'Enable all',
      continue: 'Continue',
      skip: 'Not now',
      allow: 'Allow',
      notNow: 'Not now',
      recheck: 'Check again',
      changedNotice: 'A permission changed on your device since you were last here.',
      locationWarning:
        'Without location, you can still use AIEC — you just will not be able to check in at a site or have your route planned for you. You can turn it on any time.',
      openSettings: 'This is switched off in your device settings',
      openSettingsHint:
        'Your phone will not ask again, so it has to be changed there: Settings → Apps → AIEC → Permissions.',
      state: {
        granted: 'Allowed',
        denied: 'Not allowed',
        blocked: 'Blocked in settings',
        unsupported: 'Not available on this device',
        prompt: 'Not asked yet',
      },
      item: {
        location: {
          title: 'Location',
          why: 'So we can confirm you were actually at the site, and plan a route that does not send you back and forth across the city.',
          ifDenied: 'Turn this off and site check-ins and route planning stop working.',
        },
        camera: {
          title: 'Camera',
          why: 'To photograph the site and each installation step, which is what proves the work was done properly.',
          ifDenied: 'Without the camera you cannot capture a lead or complete a safety step.',
        },
        notifications: {
          title: 'Notifications',
          why: 'So a new lead, a job update, or a payment landing reaches you without you having to keep checking.',
          ifDenied: 'You will still see everything in the app — it just will not come to you.',
        },
      },
    },
  },

  hi: {
    permissions: {
      title: 'AIEC को कुछ चीज़ों की ज़रूरत है',
      subtitle: 'फ़ोन पूछे उससे पहले, हर एक किस काम की है यह साफ़-साफ़ पढ़ लीजिए।',
      enableAll: 'सब चालू करें',
      continue: 'आगे बढ़ें',
      skip: 'अभी नहीं',
      allow: 'अनुमति दें',
      notNow: 'अभी नहीं',
      recheck: 'फिर से जाँचें',
      changedNotice: 'पिछली बार के बाद आपके डिवाइस पर कोई अनुमति बदली है।',
      locationWarning:
        'लोकेशन के बिना भी AIEC चलेगा — बस आप साइट पर चेक-इन नहीं कर पाएँगे और आपका रूट अपने आप नहीं बनेगा। इसे कभी भी चालू कर सकते हैं।',
      openSettings: 'यह आपके डिवाइस की सेटिंग में बंद है',
      openSettingsHint:
        'अब आपका फ़ोन दोबारा नहीं पूछेगा, इसलिए वहीं बदलना होगा: सेटिंग → ऐप्स → AIEC → अनुमतियाँ।',
      state: {
        granted: 'अनुमति है',
        denied: 'अनुमति नहीं',
        blocked: 'सेटिंग में बंद',
        unsupported: 'इस डिवाइस पर उपलब्ध नहीं',
        prompt: 'अभी पूछा नहीं गया',
      },
      item: {
        location: {
          title: 'लोकेशन',
          why: 'ताकि हम पक्का कर सकें कि आप सचमुच साइट पर थे, और ऐसा रूट बना सकें जो आपको बार-बार शहर के आर-पार न भेजे।',
          ifDenied: 'इसे बंद रखेंगे तो साइट चेक-इन और रूट प्लानिंग काम नहीं करेंगे।',
        },
        camera: {
          title: 'कैमरा',
          why: 'साइट और इंस्टॉलेशन के हर चरण की फ़ोटो लेने के लिए — यही साबित करता है कि काम ठीक से हुआ।',
          ifDenied: 'कैमरे के बिना आप न लीड दर्ज कर सकते हैं, न कोई सुरक्षा चरण पूरा।',
        },
        notifications: {
          title: 'सूचनाएँ',
          why: 'ताकि नया लीड, काम का अपडेट, या भुगतान आने की ख़बर आप तक पहुँचे, बार-बार देखना न पड़े।',
          ifDenied: 'सब कुछ ऐप में दिखता रहेगा — बस अपने आप आपके पास नहीं आएगा।',
        },
      },
    },
  },

  mr: {
    permissions: {
      title: 'AIEC ला काही गोष्टींची गरज आहे',
      subtitle: 'फोन विचारण्यापूर्वी, प्रत्येक गोष्ट कशासाठी आहे ते स्पष्ट वाचून घ्या.',
      enableAll: 'सर्व चालू करा',
      continue: 'पुढे जा',
      skip: 'आत्ता नको',
      allow: 'परवानगी द्या',
      notNow: 'आत्ता नको',
      recheck: 'पुन्हा तपासा',
      changedNotice: 'मागच्या वेळेनंतर तुमच्या डिव्हाइसवर एखादी परवानगी बदलली आहे.',
      locationWarning:
        'स्थानाशिवायही AIEC चालेल — फक्त तुम्हाला साइटवर चेक-इन करता येणार नाही आणि मार्ग आपोआप आखला जाणार नाही. हे कधीही चालू करू शकता.',
      openSettings: 'हे तुमच्या डिव्हाइसच्या सेटिंगमध्ये बंद आहे',
      openSettingsHint:
        'आता तुमचा फोन पुन्हा विचारणार नाही, त्यामुळे तिथेच बदलावे लागेल: सेटिंग → ॲप्स → AIEC → परवानग्या.',
      state: {
        granted: 'परवानगी आहे',
        denied: 'परवानगी नाही',
        blocked: 'सेटिंगमध्ये बंद',
        unsupported: 'या डिव्हाइसवर उपलब्ध नाही',
        prompt: 'अजून विचारलेले नाही',
      },
      item: {
        location: {
          title: 'स्थान',
          why: 'तुम्ही खरोखर साइटवर होतात हे पक्के करण्यासाठी, आणि तुम्हाला वारंवार शहरभर फिरवणार नाही असा मार्ग आखण्यासाठी.',
          ifDenied: 'हे बंद ठेवले तर साइट चेक-इन आणि मार्ग आखणी चालणार नाही.',
        },
        camera: {
          title: 'कॅमेरा',
          why: 'साइटचे आणि बसवणुकीच्या प्रत्येक टप्प्याचे फोटो घेण्यासाठी — तेच काम व्यवस्थित झाल्याचे सिद्ध करते.',
          ifDenied: 'कॅमेऱ्याशिवाय तुम्हाला ना लीड नोंदवता येईल, ना सुरक्षा टप्पा पूर्ण करता येईल.',
        },
        notifications: {
          title: 'सूचना',
          why: 'नवीन लीड, कामाचे अपडेट, किंवा पैसे आल्याची बातमी तुमच्यापर्यंत यावी, वारंवार पहावे लागू नये म्हणून.',
          ifDenied: 'सर्व काही ॲपमध्ये दिसतच राहील — फक्त ते आपणहून तुमच्याकडे येणार नाही.',
        },
      },
    },
  },
};

export default translations;
