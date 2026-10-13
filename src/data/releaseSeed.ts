import type { ReleaseItem } from './types';

/** The app's own history, written for the people who use it (200). The wording is a first draft for the owner to check. */
export interface ReleaseSeed { version: string; daysAgo: number; items: Omit<ReleaseItem, 'id'>[] }

export const seedReleases: ReleaseSeed[] = [
  {
    version: '0.1.0', daysAgo: 3,
    items: [
      { kind: 'workflow', roles: ['admin'], route: '/security', text: { en: 'When you sign in as Admin you now meet a second step. Keep your phone with you; the setup takes a minute.', hi: 'Admin के रूप में साइन इन करने पर अब आपको एक दूसरा चरण मिलेगा। अपना फ़ोन पास रखें; सेटअप में एक मिनट लगता है।', mr: 'Admin म्हणून साइन इन केल्यावर आता तुम्हाला दुसरा टप्पा येईल. फोन जवळ ठेवा; सेटअप एका मिनिटात होतो.' } },
      { kind: 'new', roles: ['all'], route: '/help', text: { en: 'Help & support: answers written for your own role, and a way to reach a person when they do not solve it.', hi: 'सहायता और समर्थन: आपकी अपनी भूमिका के लिए लिखे उत्तर, और हल न होने पर किसी व्यक्ति तक पहुँचने का रास्ता।', mr: 'मदत आणि समर्थन: तुमच्या स्वतःच्या भूमिकेसाठी लिहिलेली उत्तरे, आणि त्यांनी सुटले नाही तर माणसापर्यंत पोहोचण्याचा मार्ग.' } },
      { kind: 'new', roles: ['admin'], route: '/legal-templates', text: { en: 'Legal and contract wording is now kept in one place, with its versions, the day each takes effect, and when a lawyer last reviewed it.', hi: 'कानूनी और अनुबंध शब्दावली अब एक जगह रखी जाती है, उसके संस्करणों, लागू होने के दिन और वकील की आखिरी समीक्षा के साथ।', mr: 'कायदेशीर आणि करार मजकूर आता एका ठिकाणी ठेवला जातो, त्याच्या आवृत्त्या, लागू होण्याचा दिवस आणि वकिलाच्या शेवटच्या पुनरावलोकनासह.' } },
      { kind: 'improved', roles: ['admin'], route: '/billing', text: { en: 'You are told before a card on a software service expires or a renewal is missed.', hi: 'किसी सॉफ़्टवेयर सेवा का कार्ड समाप्त होने या नवीनीकरण छूटने से पहले आपको बताया जाता है।', mr: 'सॉफ्टवेअर सेवेचे कार्ड संपण्यापूर्वी किंवा नूतनीकरण चुकण्यापूर्वी तुम्हाला सांगितले जाते.' } },
    ],
  },
  {
    version: '0.0.9', daysAgo: 24,
    items: [
      { kind: 'workflow', roles: ['customer'], route: '/project-status', text: { en: 'The Installation tab now opens your project status page, with the whole journey and photos, instead of the older timeline.', hi: 'इंस्टॉलेशन टैब अब पुरानी टाइमलाइन की जगह आपके प्रोजेक्ट की स्थिति का पेज खोलता है, पूरी यात्रा और फ़ोटो के साथ।', mr: 'इन्स्टॉलेशन टॅब आता जुन्या टाइमलाइनऐवजी तुमच्या प्रकल्पाच्या स्थितीचे पेज उघडतो, संपूर्ण प्रवास आणि फोटोंसह.' } },
      { kind: 'new', roles: ['customer'], route: '/documents', text: { en: 'A Documents tab keeps your contract, invoices, receipts, certificates and warranty together.', hi: 'दस्तावेज़ टैब आपके अनुबंध, चालान, रसीदें, प्रमाणपत्र और वारंटी को एक साथ रखता है।', mr: 'दस्तावेज टॅब तुमचा करार, बिले, पावत्या, प्रमाणपत्रे आणि वॉरंटी एकत्र ठेवतो.' } },
      { kind: 'improved', roles: ['customer'], route: '/notifications', text: { en: 'You can choose how you hear from us. Notices that matter, like a payment due, always reach you, in the app if nowhere else.', hi: 'आप चुन सकते हैं कि हमसे कैसे सुनना है। ज़रूरी सूचनाएँ, जैसे देय भुगतान, हमेशा आप तक पहुँचती हैं, और कहीं नहीं तो ऐप में।', mr: 'आमच्याकडून कसे ऐकायचे ते तुम्ही निवडू शकता. महत्त्वाच्या सूचना, जसे देय पेमेंट, नेहमी तुमच्यापर्यंत पोहोचतात, इतरत्र नाही तर अॅपमध्ये.' } },
    ],
  },
  {
    version: '0.0.8', daysAgo: 49,
    items: [
      { kind: 'workflow', roles: ['technician'], route: '/technician', text: { en: 'The step for the door safety sensors now needs its photo before it can be finished. The other steps work as before.', hi: 'दरवाज़े के सुरक्षा सेंसर वाले चरण को पूरा करने से पहले अब उसकी फ़ोटो चाहिए। बाकी चरण पहले जैसे हैं।', mr: 'दाराच्या सुरक्षा सेन्सरच्या टप्प्यासाठी तो पूर्ण करण्यापूर्वी आता त्याचा फोटो लागतो. इतर टप्पे पूर्वीसारखेच आहेत.' } },
      { kind: 'new', roles: ['technician'], route: '/technician', text: { en: 'A safety checklist is checked on site before a job goes to quality check, and a failed check cannot be waved through.', hi: 'काम गुणवत्ता जाँच में जाने से पहले साइट पर सुरक्षा चेकलिस्ट जाँची जाती है, और असफल जाँच को यूँ ही पास नहीं किया जा सकता।', mr: 'काम गुणवत्ता तपासणीला जाण्यापूर्वी साइटवर सुरक्षा चेकलिस्ट तपासली जाते, आणि अयशस्वी तपासणी सहज पास करता येत नाही.' } },
      { kind: 'improved', roles: ['technician'], route: '/job-issues', text: { en: 'Reporting a problem now works without signal: it waits on the phone and is sent when the signal returns.', hi: 'समस्या की रिपोर्ट अब बिना सिग्नल के भी चलती है: वह फ़ोन में रुकी रहती है और सिग्नल लौटने पर भेजी जाती है।', mr: 'समस्या कळवणे आता सिग्नलशिवाय चालते: ते फोनमध्ये थांबते आणि सिग्नल परतल्यावर पाठवले जाते.' } },
    ],
  },
  {
    version: '0.0.7', daysAgo: 78,
    items: [
      { kind: 'workflow', roles: ['supplier'], route: '/supplier-invoices', text: { en: 'A payment can now wait until your invoice matches the order and what was accepted on delivery. The reason is shown.', hi: 'अब भुगतान तब तक रुक सकता है जब तक आपका चालान ऑर्डर और डिलीवरी पर स्वीकार की गई मात्रा से मेल न खाए। कारण दिखाया जाता है।', mr: 'आता तुमचे बिल ऑर्डर आणि डिलिव्हरीवर स्वीकारलेल्या प्रमाणाशी जुळेपर्यंत पेमेंट थांबू शकते. कारण दाखवले जाते.' } },
      { kind: 'new', roles: ['supplier'], route: '/supplier-invoices', text: { en: 'An Invoices tab lets you send an invoice and see whether it matched.', hi: 'चालान टैब से आप चालान भेज सकते हैं और देख सकते हैं कि वह मेल खाया या नहीं।', mr: 'बिले टॅबमधून तुम्ही बिल पाठवू शकता आणि ते जुळले का ते पाहू शकता.' } },
      { kind: 'new', roles: ['surveyor'], route: '/surveyor/earnings', text: { en: 'Your earnings show what is final and what is still a forecast, kept apart, with the rule each amount was worked out under.', hi: 'आपकी कमाई दिखाती है कि क्या अंतिम है और क्या अभी अनुमान है, अलग-अलग, और हर राशि किस नियम से तय हुई।', mr: 'तुमची कमाई काय अंतिम आहे आणि काय अजून अंदाज आहे ते वेगळे दाखवते, आणि प्रत्येक रक्कम कोणत्या नियमाखाली ठरली ते.' } },
    ],
  },
  {
    version: '0.0.6', daysAgo: 110,
    items: [
      { kind: 'fixed', roles: ['all'], text: { en: 'Progress bars now fill as they should, and the tab you are on is highlighted correctly.', hi: 'प्रगति पट्टियाँ अब ठीक से भरती हैं, और आप जिस टैब पर हैं वह सही ढंग से उभरा दिखता है।', mr: 'प्रगती पट्ट्या आता नीट भरतात, आणि तुम्ही ज्या टॅबवर आहात तो बरोबर उठून दिसतो.' } },
      { kind: 'improved', roles: ['all'], text: { en: 'Hindi and Marathi now use their own fonts everywhere, so nothing falls back to a plain system face.', hi: 'हिन्दी और मराठी अब हर जगह अपने फ़ॉन्ट इस्तेमाल करती हैं, इसलिए कुछ भी साधारण सिस्टम फ़ॉन्ट पर नहीं गिरता।', mr: 'हिंदी आणि मराठी आता सर्वत्र आपले फॉन्ट वापरतात, त्यामुळे काहीही साध्या सिस्टम फॉन्टवर जात नाही.' } },
    ],
  },
];
