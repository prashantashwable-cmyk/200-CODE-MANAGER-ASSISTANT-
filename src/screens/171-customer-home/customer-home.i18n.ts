import type { ScreenTranslations } from '@/i18n/types';

/** Screen 171. The customer's home in three languages. `link.open` is read by the screens that link here, `alert.*` titles by the alerts board. */
const translations: ScreenTranslations = {
  en: {
    customerHome: {
      title: 'Home',
      greeting: {
        morning: 'Good morning, {{name}}',
        afternoon: 'Good afternoon, {{name}}',
        evening: 'Good evening, {{name}}',
      },
      loading: 'Loading your project…',
      error: {
        title: 'We could not load your home',
        body: 'Nothing has changed. Check your connection and try again.',
      },
      refresh: 'Refresh',
      switcher: {
        label: 'Your projects',
        mode: {
          starting: 'Getting started',
          project: 'In progress',
          service: 'In service',
        },
      },
      unread: 'New updates: {{count}}',
      unreadHint: 'Open the bell at the top to read them.',
      hero: {
        starting: 'We are putting the final details of your lift for {{site}} together.',
        stage: {
          agreed: 'Your order for {{site}} is confirmed. Next, we finalise the agreement with you.',
          contract: 'Your agreement for {{site}} is being finalised.',
          materials: 'We are getting your lift parts to {{site}}.',
          installation: 'Your lift at {{site}} is being installed.',
          quality: 'Installation is done. An independent quality check is under way at {{site}}.',
          handover: 'Almost there: we are preparing your handover at {{site}}.',
        },
        service: 'Your lift at {{site}} is in service and in good hands.',
        paused: 'Work at {{site}} is paused for a moment. We will tell you as soon as it resumes.',
      },
      stage: {
        agreed: 'Order confirmed',
        contract: 'Agreement',
        materials: 'Parts',
        installation: 'Installation',
        quality: 'Quality check',
        handover: 'Handover',
        doneOn: 'Done {{date}}',
        now: 'Now',
      },
      progress: {
        label: 'Installation progress',
        value: '{{percent}}% of the steps are done',
        hidden: 'Detailed progress will be available shortly.',
      },
      expected: 'Expected to be finished around {{date}}',
      lastUpdate: 'Last update {{date}}',
      openStatus: 'See the full project status',
      concern: {
        heading: 'Good to know',
        delay: 'Your installation is running about {{days}} days later than first planned.',
        paused: 'Work is paused for now, and we are taking care of it.',
        payment_disputed: 'We are looking into the payment you raised ({{amount}}). Nothing is needed from you right now.',
        viewPayments: 'See my payments',
      },
      next: {
        heading: 'Coming up',
        paymentDue: 'Payment of {{amount}} due {{date}}',
        paymentOverdue: 'Payment of {{amount}} was due {{date}}',
        payNow: 'Pay {{amount}}',
        on: 'around {{date}}',
        milestone: {
          agreed: 'We finalise your agreement with you',
          contract: 'We confirm your agreement and first payment',
          materials: 'Your lift parts reach the site',
          installation: 'Installation work',
          quality: 'The independent quality check',
          handover: 'Handover, and your warranty starts',
        },
        service: {
          warranty: 'Your service warranty runs until {{date}}',
          amc: 'Your service plan runs until {{date}}',
          none: 'Register your warranty and choose a service plan to keep your lift looked after.',
        },
        paidAlready: 'If you have already paid, thank you: it can take a day to show here.',
      },
      early: {
        heading: 'Here is what happens next',
        intro: 'Your project is just beginning. This is the road ahead; we keep it up to date here.',
        step: {
          agreed: 'We confirm your order and the final price with you.',
          contract: 'You review and sign your agreement. We never start without it.',
          materials: 'We order and deliver your lift parts to the site, checked on arrival.',
          installation: 'Our technicians install your lift, with photos at every step.',
          quality: 'A separate, independent inspector checks the work.',
          handover: 'We show you how everything works, register your warranty and hand over.',
        },
      },
      tile: {
        status: {
          title: 'Project status',
          hint: 'Every stage, with dates and photos',
        },
        payments: {
          title: 'Payments',
          hint: '{{received}} paid of {{total}}',
        },
        documents: {
          title: 'Documents',
          hint: 'Certificates and delivery records',
        },
        support: {
          title: 'Support',
          hint: 'Chat with your AIEC team',
        },
        service: {
          title: 'Book a service',
          hint: 'Warranty and service plan',
        },
      },
      service: {
        heading: 'Your lift in service',
        warranty: 'Warranty until {{date}}',
        warrantyNone: 'Your warranty details appear here once they are registered.',
        amc: {
          active: 'Service plan active until {{date}}',
          later: 'You chose to decide on a service plan later.',
          declined: 'No service plan chosen.',
        },
        open: 'Open warranty and service',
      },
      pay: {
        heading: 'Your payments',
        line: '{{received}} paid of {{total}}',
        open: 'See all payments',
      },
      contact: {
        heading: 'Need anything?',
        body: 'Your AIEC team is one call away.',
        call: 'Call AIEC',
      },
      empty: {
        title: 'Welcome to AIEC',
        body: 'Your project will appear here as soon as it begins. Until then, your AIEC team is one call away.',
      },
    },
  },
  hi: {
    customerHome: {
      title: 'होम',
      greeting: {
        morning: 'सुप्रभात, {{name}}',
        afternoon: 'नमस्कार, {{name}}',
        evening: 'शुभ संध्या, {{name}}',
      },
      loading: 'आपका प्रोजेक्ट लोड हो रहा है…',
      error: {
        title: 'हम आपका होम लोड नहीं कर सके',
        body: 'कुछ नहीं बदला है। अपना कनेक्शन देखें और फिर कोशिश करें।',
      },
      refresh: 'ताज़ा करें',
      switcher: {
        label: 'आपके प्रोजेक्ट',
        mode: {
          starting: 'शुरुआत',
          project: 'प्रगति में',
          service: 'सेवा में',
        },
      },
      unread: 'नए अपडेट: {{count}}',
      unreadHint: 'पढ़ने के लिए ऊपर की घंटी खोलें।',
      hero: {
        starting: 'हम {{site}} के लिए आपकी लिफ्ट के अंतिम ब्योरे तैयार कर रहे हैं।',
        stage: {
          agreed: '{{site}} के लिए आपका ऑर्डर पक्का है। अब हम आपके साथ समझौते को अंतिम रूप देते हैं।',
          contract: '{{site}} के लिए आपका समझौता अंतिम रूप में है।',
          materials: 'हम आपकी लिफ्ट के पुर्ज़े {{site}} तक पहुँचा रहे हैं।',
          installation: '{{site}} में आपकी लिफ्ट लगाई जा रही है।',
          quality: 'इंस्टॉलेशन पूरा हो गया। {{site}} में स्वतंत्र गुणवत्ता जाँच चल रही है।',
          handover: 'लगभग पूरा: हम {{site}} में आपका हैंडओवर तैयार कर रहे हैं।',
        },
        service: '{{site}} में आपकी लिफ्ट सेवा में है और सुरक्षित हाथों में है।',
        paused: '{{site}} में काम थोड़ी देर के लिए रुका है। शुरू होते ही हम आपको बताएँगे।',
      },
      stage: {
        agreed: 'ऑर्डर पक्की',
        contract: 'समझौता',
        materials: 'पुर्ज़े',
        installation: 'इंस्टॉलेशन',
        quality: 'गुणवत्ता जाँच',
        handover: 'हैंडओवर',
        doneOn: '{{date}} को पूरा',
        now: 'अभी',
      },
      progress: {
        label: 'इंस्टॉलेशन की प्रगति',
        value: '{{percent}}% चरण पूरे हो चुके हैं',
        hidden: 'विस्तृत प्रगति जल्द उपलब्ध होगी।',
      },
      expected: 'लगभग {{date}} तक पूरा होने की उम्मीद',
      lastUpdate: 'आखिरी अपडेट {{date}}',
      openStatus: 'पूरा प्रोजेक्ट स्टेटस देखें',
      concern: {
        heading: 'जानने लायक',
        delay: 'आपका इंस्टॉलेशन पहली योजना से लगभग {{days}} दिन देर से चल रहा है।',
        paused: 'काम फ़िलहाल रुका है और हम इसे संभाल रहे हैं।',
        payment_disputed: 'आपके उठाए भुगतान ({{amount}}) की हम जाँच कर रहे हैं। अभी आपसे कुछ नहीं चाहिए।',
        viewPayments: 'मेरे भुगतान देखें',
      },
      next: {
        heading: 'आगे क्या',
        paymentDue: '{{amount}} का भुगतान {{date}} को देय',
        paymentOverdue: '{{amount}} का भुगतान {{date}} को देय था',
        payNow: '{{amount}} चुकाएँ',
        on: 'लगभग {{date}}',
        milestone: {
          agreed: 'हम आपके साथ आपका समझौता अंतिम करते हैं',
          contract: 'हम आपका समझौता और पहला भुगतान पक्का करते हैं',
          materials: 'आपकी लिफ्ट के पुर्ज़े साइट पर पहुँचते हैं',
          installation: 'इंस्टॉलेशन का काम',
          quality: 'स्वतंत्र गुणवत्ता जाँच',
          handover: 'हैंडओवर, और आपकी वारंटी शुरू होती है',
        },
        service: {
          warranty: 'आपकी सर्विस वारंटी {{date}} तक चलती है',
          amc: 'आपका सर्विस प्लान {{date}} तक चलता है',
          none: 'अपनी लिफ्ट की देखभाल के लिए वारंटी दर्ज करें और सर्विस प्लान चुनें।',
        },
        paidAlready: 'अगर आप चुका चुके हैं तो धन्यवाद: यहाँ दिखने में एक दिन लग सकता है।',
      },
      early: {
        heading: 'आगे यह होगा',
        intro: 'आपका प्रोजेक्ट अभी शुरू हो रहा है। यह आगे का रास्ता है; हम इसे यहाँ ताज़ा रखते हैं।',
        step: {
          agreed: 'हम आपके साथ आपका ऑर्डर और अंतिम कीमत पक्की करते हैं।',
          contract: 'आप अपना समझौता देखकर हस्ताक्षर करते हैं। इसके बिना हम कभी शुरू नहीं करते।',
          materials: 'हम आपकी लिफ्ट के पुर्ज़े मँगवाकर साइट पर पहुँचाते हैं, आने पर जाँचे जाते हैं।',
          installation: 'हमारे तकनीशियन आपकी लिफ्ट लगाते हैं, हर चरण की तस्वीरों के साथ।',
          quality: 'एक अलग, स्वतंत्र निरीक्षक काम की जाँच करता है।',
          handover: 'हम आपको सब कुछ चलाना दिखाते हैं, वारंटी दर्ज करते हैं और हैंडओवर करते हैं।',
        },
      },
      tile: {
        status: {
          title: 'प्रोजेक्ट स्टेटस',
          hint: 'हर चरण, तारीखों और तस्वीरों के साथ',
        },
        payments: {
          title: 'भुगतान',
          hint: '{{total}} में से {{received}} चुकाया',
        },
        documents: {
          title: 'दस्तावेज़',
          hint: 'प्रमाणपत्र और डिलीवरी रिकॉर्ड',
        },
        support: {
          title: 'सहायता',
          hint: 'अपनी AIEC टीम से चैट करें',
        },
        service: {
          title: 'सर्विस बुक करें',
          hint: 'वारंटी और सर्विस प्लान',
        },
      },
      service: {
        heading: 'सेवा में आपकी लिफ्ट',
        warranty: 'वारंटी {{date}} तक',
        warrantyNone: 'वारंटी दर्ज होते ही उसका ब्योरा यहाँ दिखेगा।',
        amc: {
          active: 'सर्विस प्लान {{date}} तक चालू',
          later: 'आपने सर्विस प्लान बाद में तय करना चुना है।',
          declined: 'कोई सर्विस प्लान नहीं चुना गया।',
        },
        open: 'वारंटी और सर्विस खोलें',
      },
      pay: {
        heading: 'आपके भुगतान',
        line: '{{total}} में से {{received}} चुकाया',
        open: 'सभी भुगतान देखें',
      },
      contact: {
        heading: 'कुछ चाहिए?',
        body: 'आपकी AIEC टीम बस एक कॉल दूर है।',
        call: 'AIEC को कॉल करें',
      },
      empty: {
        title: 'AIEC में आपका स्वागत है',
        body: 'आपका प्रोजेक्ट शुरू होते ही यहाँ दिखेगा। तब तक आपकी AIEC टीम बस एक कॉल दूर है।',
      },
    },
  },
  mr: {
    customerHome: {
      title: 'मुख्यपृष्ठ',
      greeting: {
        morning: 'शुभ प्रभात, {{name}}',
        afternoon: 'नमस्कार, {{name}}',
        evening: 'शुभ संध्याकाळ, {{name}}',
      },
      loading: 'तुमचा प्रकल्प लोड होत आहे…',
      error: {
        title: 'आम्ही तुमचे मुख्यपृष्ठ लोड करू शकलो नाही',
        body: 'काहीही बदललेले नाही. तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.',
      },
      refresh: 'ताजे करा',
      switcher: {
        label: 'तुमचे प्रकल्प',
        mode: {
          starting: 'सुरुवात',
          project: 'प्रगतीत',
          service: 'सेवेत',
        },
      },
      unread: 'नवीन अपडेट: {{count}}',
      unreadHint: 'वाचण्यासाठी वरची घंटी उघडा.',
      hero: {
        starting: 'आम्ही {{site}} साठी तुमच्या लिफ्टचे अंतिम तपशील तयार करत आहोत.',
        stage: {
          agreed: '{{site}} साठी तुमची ऑर्डर निश्चित झाली आहे. आता आम्ही तुमच्यासोबत करार अंतिम करतो.',
          contract: '{{site}} साठी तुमचा करार अंतिम होत आहे.',
          materials: 'आम्ही तुमच्या लिफ्टचे भाग {{site}} ला पोहोचवत आहोत.',
          installation: '{{site}} येथे तुमची लिफ्ट बसवली जात आहे.',
          quality: 'इन्स्टॉलेशन पूर्ण झाले. {{site}} येथे स्वतंत्र गुणवत्ता तपासणी सुरू आहे.',
          handover: 'जवळजवळ पूर्ण: आम्ही {{site}} येथे तुमचे हस्तांतरण तयार करत आहोत.',
        },
        service: '{{site}} येथील तुमची लिफ्ट सेवेत आहे आणि सुरक्षित हातांत आहे.',
        paused: '{{site}} येथील काम काही काळ थांबले आहे. सुरू होताच आम्ही तुम्हाला कळवू.',
      },
      stage: {
        agreed: 'ऑर्डर निश्चित',
        contract: 'करार',
        materials: 'भाग',
        installation: 'इन्स्टॉलेशन',
        quality: 'गुणवत्ता तपासणी',
        handover: 'हस्तांतरण',
        doneOn: '{{date}} रोजी पूर्ण',
        now: 'आता',
      },
      progress: {
        label: 'इन्स्टॉलेशनची प्रगती',
        value: '{{percent}}% टप्पे पूर्ण झाले आहेत',
        hidden: 'सविस्तर प्रगती लवकरच उपलब्ध होईल.',
      },
      expected: 'सुमारे {{date}} पर्यंत पूर्ण होण्याची अपेक्षा',
      lastUpdate: 'शेवटचे अपडेट {{date}}',
      openStatus: 'संपूर्ण प्रकल्प स्थिती पहा',
      concern: {
        heading: 'जाणून घेण्यासारखे',
        delay: 'तुमचे इन्स्टॉलेशन पहिल्या नियोजनापेक्षा सुमारे {{days}} दिवस उशिराने सुरू आहे.',
        paused: 'काम सध्या थांबले आहे आणि आम्ही ते सांभाळत आहोत.',
        payment_disputed: 'तुम्ही मांडलेल्या पेमेंटची ({{amount}}) आम्ही तपासणी करत आहोत. सध्या तुमच्याकडून काही नको.',
        viewPayments: 'माझी पेमेंट पहा',
      },
      next: {
        heading: 'पुढे काय',
        paymentDue: '{{amount}} चे पेमेंट {{date}} रोजी देय',
        paymentOverdue: '{{amount}} चे पेमेंट {{date}} रोजी देय होते',
        payNow: '{{amount}} भरा',
        on: 'सुमारे {{date}}',
        milestone: {
          agreed: 'आम्ही तुमच्यासोबत तुमचा करार अंतिम करतो',
          contract: 'आम्ही तुमचा करार आणि पहिले पेमेंट निश्चित करतो',
          materials: 'तुमच्या लिफ्टचे भाग साइटवर पोहोचतात',
          installation: 'इन्स्टॉलेशनचे काम',
          quality: 'स्वतंत्र गुणवत्ता तपासणी',
          handover: 'हस्तांतरण, आणि तुमची वॉरंटी सुरू होते',
        },
        service: {
          warranty: 'तुमची सेवा वॉरंटी {{date}} पर्यंत चालते',
          amc: 'तुमचा सेवा प्लॅन {{date}} पर्यंत चालतो',
          none: 'तुमच्या लिफ्टच्या देखभालीसाठी वॉरंटी नोंदवा आणि सेवा प्लॅन निवडा.',
        },
        paidAlready: 'तुम्ही आधीच दिले असल्यास धन्यवाद: येथे दिसायला एक दिवस लागू शकतो.',
      },
      early: {
        heading: 'पुढे हे होईल',
        intro: 'तुमचा प्रकल्प नुकताच सुरू होत आहे. हा पुढचा रस्ता आहे; आम्ही तो येथे अद्ययावत ठेवतो.',
        step: {
          agreed: 'आम्ही तुमच्यासोबत तुमची ऑर्डर आणि अंतिम किंमत निश्चित करतो.',
          contract: 'तुम्ही तुमचा करार वाचून सही करता. त्याशिवाय आम्ही कधीही सुरू करत नाही.',
          materials: 'आम्ही तुमच्या लिफ्टचे भाग मागवून साइटवर पोहोचवतो, आल्यावर तपासले जातात.',
          installation: 'आमचे तंत्रज्ञ तुमची लिफ्ट बसवतात, प्रत्येक टप्प्याच्या फोटोंसह.',
          quality: 'एक वेगळा, स्वतंत्र निरीक्षक कामाची तपासणी करतो.',
          handover: 'आम्ही सर्व काही कसे चालते ते दाखवतो, वॉरंटी नोंदवतो आणि हस्तांतरण करतो.',
        },
      },
      tile: {
        status: {
          title: 'प्रकल्प स्थिती',
          hint: 'प्रत्येक टप्पा, तारखा आणि फोटोंसह',
        },
        payments: {
          title: 'पेमेंट',
          hint: '{{total}} पैकी {{received}} दिले',
        },
        documents: {
          title: 'कागदपत्रे',
          hint: 'प्रमाणपत्रे आणि डिलिव्हरी नोंदी',
        },
        support: {
          title: 'मदत',
          hint: 'तुमच्या AIEC टीमशी चॅट करा',
        },
        service: {
          title: 'सेवा बुक करा',
          hint: 'वॉरंटी आणि सेवा प्लॅन',
        },
      },
      service: {
        heading: 'सेवेतील तुमची लिफ्ट',
        warranty: 'वॉरंटी {{date}} पर्यंत',
        warrantyNone: 'वॉरंटी नोंदवली की तिचा तपशील येथे दिसेल.',
        amc: {
          active: 'सेवा प्लॅन {{date}} पर्यंत सुरू',
          later: 'तुम्ही सेवा प्लॅन नंतर ठरवण्याचे निवडले आहे.',
          declined: 'कोणताही सेवा प्लॅन निवडलेला नाही.',
        },
        open: 'वॉरंटी आणि सेवा उघडा',
      },
      pay: {
        heading: 'तुमची पेमेंट',
        line: '{{total}} पैकी {{received}} दिले',
        open: 'सर्व पेमेंट पहा',
      },
      contact: {
        heading: 'काही हवे आहे का?',
        body: 'तुमची AIEC टीम फक्त एका कॉलच्या अंतरावर आहे.',
        call: 'AIEC ला कॉल करा',
      },
      empty: {
        title: 'AIEC मध्ये तुमचे स्वागत आहे',
        body: 'तुमचा प्रकल्प सुरू होताच येथे दिसेल. तोपर्यंत तुमची AIEC टीम एका कॉलच्या अंतरावर आहे.',
      },
    },
  },
};

export default translations;
