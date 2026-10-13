import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    onbSurveyor: {
      title: 'Join as a surveyor',
      subtitle: 'Four short steps. Everything saves as you go, so you can stop and come back.',
      step: {
        personal: 'Your details',
        identity: 'ID proof',
        bank: 'Where we pay you',
        area: 'Where you work',
      },
      field: {
        fullName: 'Full name',
        phone: 'Mobile number',
        city: 'City',
        aadhaar: 'Aadhaar number',
        aadhaarHint: 'AIEC keeps only the last four digits. The full number stays on this phone.',
        pan: 'PAN',
        accountHolder: 'Name on the account',
        accountNumber: 'Account number',
        ifsc: 'IFSC code',
        twoWheeler: 'I have my own two-wheeler',
        twoWheelerHint: 'This helps us plan routes that are realistic for you.',
      },
      doc: {
        aadhaar: 'Photo of your Aadhaar',
        aadhaarHint: 'Use a masked Aadhaar (only the last four digits showing) if you have one. Lay it flat, fill the frame, and avoid direct light on the card.',
        pan: 'Photo of your PAN card',
        bank: 'Passbook or cancelled cheque',
        bankHint: 'The account number and IFSC must both be readable in the photo.',
      },
      invalid: {
        fullName: 'Please enter your full name as it appears on your ID.',
        phone: 'Enter a 10-digit Indian mobile number.',
        aadhaar: "That Aadhaar number doesn't check out. Have another look at the digits.",
        pan: 'A PAN looks like ABCDE1234F.',
        ifsc: 'An IFSC looks like HDFC0001234 — four letters, a zero, then six characters.',
        accountNumber: 'An account number is between 9 and 18 digits.',
      },
      penny: {
        explain: 'Verify this account with a ₹1 test deposit',
        start: 'Verify account',
        running: 'Checking with your bank…',
        verified: 'Account verified',
        failed: 'Verification failed',
        retry: 'Try verification again',
        notConnected: 'The bank check is not connected yet, so this account has not been verified. AIEC confirms it with you before the first payment.',
        blockedBanner:
          'Your bank account could not be verified. You can finish signing up, but commission payouts stay on hold until this is sorted.',
      },
      area: {
        heading: 'Pick the areas you can cover',
        body: 'We use this to send you leads near you and to plan your daily route. Choose at least one.',
        required: 'Choose at least one area to continue.',
        loading: 'Loading areas',
        error: 'We could not load the list of areas. Check your connection and try again.',
        empty: 'No areas have been set up yet. Your admin will assign one after approval.',
        leadCount: '{{count}} leads',
      },
      identityNote:
        'Give us either Aadhaar or PAN — whichever you have to hand. Both is better, but one is enough to continue.',
    },
  },

  hi: {
    onbSurveyor: {
      title: 'सर्वेक्षक के रूप में जुड़िए',
      subtitle: 'चार छोटे चरण। सब कुछ साथ-साथ सहेजा जाता है, इसलिए रुककर बाद में भी आ सकते हैं।',
      step: {
        personal: 'आपकी जानकारी',
        identity: 'पहचान प्रमाण',
        bank: 'भुगतान कहाँ भेजें',
        area: 'आप कहाँ काम करेंगे',
      },
      field: {
        fullName: 'पूरा नाम',
        phone: 'मोबाइल नंबर',
        city: 'शहर',
        aadhaar: 'आधार नंबर',
        aadhaarHint: 'AIEC केवल आख़िरी चार अंक रखता है। पूरा नंबर इसी फ़ोन पर रहता है।',
        pan: 'पैन',
        accountHolder: 'खाते पर लिखा नाम',
        accountNumber: 'खाता संख्या',
        ifsc: 'IFSC कोड',
        twoWheeler: 'मेरे पास अपनी दोपहिया गाड़ी है',
        twoWheelerHint: 'इससे हमें आपके लिए व्यावहारिक रूट बनाने में मदद मिलती है।',
      },
      doc: {
        aadhaar: 'आधार की फ़ोटो',
        aadhaarHint: 'अगर आपके पास मास्क्ड आधार है (केवल आख़िरी चार अंक दिखते हैं), तो उसी की फ़ोटो लें। सीधा रखकर, पूरे फ़्रेम में लीजिए, और कार्ड पर सीधी रोशनी न पड़ने दीजिए।',
        pan: 'पैन कार्ड की फ़ोटो',
        bank: 'पासबुक या रद्द किया हुआ चेक',
        bankHint: 'फ़ोटो में खाता संख्या और IFSC दोनों पढ़े जाने चाहिए।',
      },
      invalid: {
        fullName: 'अपना पूरा नाम वैसे ही लिखिए जैसे पहचान पत्र पर है।',
        phone: '10 अंकों का भारतीय मोबाइल नंबर डालिए।',
        aadhaar: 'यह आधार नंबर जँच नहीं रहा। अंक दोबारा देख लीजिए।',
        pan: 'पैन ऐसा दिखता है: ABCDE1234F।',
        ifsc: 'IFSC ऐसा दिखता है: HDFC0001234 — चार अक्षर, एक शून्य, फिर छह अक्षर-अंक।',
        accountNumber: 'खाता संख्या 9 से 18 अंकों की होती है।',
      },
      penny: {
        explain: '₹1 की जाँच-राशि भेजकर यह खाता सत्यापित कीजिए',
        start: 'खाता सत्यापित करें',
        running: 'आपके बैंक से जाँच हो रही है…',
        verified: 'खाता सत्यापित',
        failed: 'सत्यापन नहीं हुआ',
        retry: 'सत्यापन दोबारा करें',
        notConnected: 'बैंक जाँच अभी जुड़ी नहीं है, इसलिए यह खाता सत्यापित नहीं हुआ है। पहले भुगतान से पहले AIEC आपके साथ इसकी पुष्टि करेगा।',
        blockedBanner:
          'आपका बैंक खाता सत्यापित नहीं हो पाया। आप साइन अप पूरा कर सकते हैं, लेकिन जब तक यह ठीक नहीं होता, कमीशन का भुगतान रुका रहेगा।',
      },
      area: {
        heading: 'जिन इलाक़ों में आप जा सकते हैं, वे चुनिए',
        body: 'इसी से हम आपके पास के लीड भेजते हैं और आपका रोज़ का रूट बनाते हैं। कम से कम एक चुनिए।',
        required: 'आगे बढ़ने के लिए कम से कम एक इलाक़ा चुनिए।',
        loading: 'इलाक़े लोड हो रहे हैं',
        error: 'हम इलाक़ों की सूची लोड नहीं कर पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
        empty: 'अभी कोई इलाक़ा तय नहीं हुआ है। मंज़ूरी के बाद आपका एडमिन एक इलाक़ा देगा।',
        leadCount: '{{count}} लीड',
      },
      identityNote:
        'आधार या पैन — जो भी आपके पास मौजूद हो, वही दे दीजिए। दोनों बेहतर हैं, पर आगे बढ़ने के लिए एक ही काफ़ी है।',
    },
  },

  mr: {
    onbSurveyor: {
      title: 'सर्वेक्षक म्हणून सामील व्हा',
      subtitle: 'चार छोटे टप्पे. सर्व काही सोबतच जतन होते, त्यामुळे थांबून नंतरही येऊ शकता.',
      step: {
        personal: 'तुमची माहिती',
        identity: 'ओळखपत्र',
        bank: 'पैसे कुठे पाठवायचे',
        area: 'तुम्ही कुठे काम कराल',
      },
      field: {
        fullName: 'पूर्ण नाव',
        phone: 'मोबाइल क्रमांक',
        city: 'शहर',
        aadhaar: 'आधार क्रमांक',
        aadhaarHint: 'AIEC फक्त शेवटचे चार अंक ठेवते. पूर्ण नंबर याच फोनवर राहतो.',
        pan: 'पॅन',
        accountHolder: 'खात्यावरील नाव',
        accountNumber: 'खाते क्रमांक',
        ifsc: 'IFSC कोड',
        twoWheeler: 'माझ्याकडे स्वतःची दुचाकी आहे',
        twoWheelerHint: 'यामुळे तुमच्यासाठी व्यवहार्य मार्ग आखणे आम्हाला सोपे जाते.',
      },
      doc: {
        aadhaar: 'आधारचा फोटो',
        aadhaarHint: 'तुमच्याकडे मास्क्ड आधार असल्यास (फक्त शेवटचे चार अंक दिसतात) त्याचाच फोटो घ्या. सपाट ठेवून, संपूर्ण चौकटीत घ्या, आणि कार्डावर थेट प्रकाश पडू देऊ नका.',
        pan: 'पॅन कार्डाचा फोटो',
        bank: 'पासबुक किंवा रद्द केलेला धनादेश',
        bankHint: 'फोटोत खाते क्रमांक आणि IFSC दोन्ही वाचता आले पाहिजेत.',
      },
      invalid: {
        fullName: 'ओळखपत्रावर आहे तसेच तुमचे पूर्ण नाव लिहा.',
        phone: '१० अंकी भारतीय मोबाइल क्रमांक टाका.',
        aadhaar: 'हा आधार क्रमांक जुळत नाही. अंक पुन्हा तपासा.',
        pan: 'पॅन असा दिसतो: ABCDE1234F.',
        ifsc: 'IFSC असा दिसतो: HDFC0001234 — चार अक्षरे, एक शून्य, मग सहा अक्षरे-अंक.',
        accountNumber: 'खाते क्रमांक ९ ते १८ अंकांचा असतो.',
      },
      penny: {
        explain: '₹१ ची चाचणी रक्कम पाठवून हे खाते पडताळा',
        start: 'खाते पडताळा',
        running: 'तुमच्या बँकेकडून तपासत आहे…',
        verified: 'खाते पडताळले',
        failed: 'पडताळणी झाली नाही',
        retry: 'पडताळणी पुन्हा करा',
        notConnected: 'बँक तपासणी अजून जोडलेली नाही, त्यामुळे हे खाते पडताळलेले नाही. पहिल्या पेमेंटपूर्वी AIEC तुमच्यासोबत त्याची खात्री करेल.',
        blockedBanner:
          'तुमचे बँक खाते पडताळता आले नाही. तुम्ही नोंदणी पूर्ण करू शकता, पण हे सुरळीत होईपर्यंत कमिशनचे पैसे थांबवले जातील.',
      },
      area: {
        heading: 'तुम्ही जाऊ शकाल असे भाग निवडा',
        body: 'याच आधारे आम्ही तुमच्या जवळचे लीड पाठवतो आणि तुमचा रोजचा मार्ग आखतो. किमान एक निवडा.',
        required: 'पुढे जाण्यासाठी किमान एक भाग निवडा.',
        loading: 'भाग लोड होत आहेत',
        error: 'आम्ही भागांची यादी लोड करू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
        empty: 'अजून कोणताही भाग ठरलेला नाही. मंजुरीनंतर तुमचा प्रशासक एक भाग देईल.',
        leadCount: '{{count}} लीड',
      },
      identityNote:
        'आधार किंवा पॅन — जे तुमच्याकडे असेल ते द्या. दोन्ही असणे चांगले, पण पुढे जाण्यासाठी एकच पुरेसे आहे.',
    },
  },
};

export default translations;
