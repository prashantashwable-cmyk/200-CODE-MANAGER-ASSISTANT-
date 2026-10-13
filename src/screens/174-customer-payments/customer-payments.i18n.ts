import type { ScreenTranslations } from '@/i18n/types';

/** Screen 174. The customer payments screen in three languages. */
const translations: ScreenTranslations = {
  en: {
    customerPayments: {
      title: 'Payments',
      subtitle: 'What you owe, when it is due, and what you have already paid.',
      loading: 'Loading your payments…',
      error: {
        title: 'We could not load your payments',
        body: 'Nothing has changed. Check your connection and try again.',
      },
      offline: 'Showing what we last loaded. It will update when you are back online.',
      refresh: 'Refresh',
      close: 'Close',
      empty: {
        title: 'No payments to show yet',
        body: 'Your payment schedule will appear here once your order is confirmed.',
      },
      project: {
        separate: 'Each project has its own schedule. Pick the one you want to see.',
      },
      hero: {
        overdue: {
          title: '{{amount}} is waiting to be paid',
          body_one: 'It was due on {{date}}, {{count}} day ago. Pay when you are ready. If anything looks wrong, please call us.',
          body_other: 'It was due on {{date}}, {{count}} days ago. Pay when you are ready. If anything looks wrong, please call us.',
        },
        due: {
          title: '{{amount}} is due',
          body: 'Due on {{date}}.',
        },
        confirming: {
          title: 'Payment received, confirming',
          body: 'We can see your payment of {{amount}} and are matching it to your account. It will show as paid soon. You do not need to pay again.',
        },
        disputed: {
          title: 'We are looking into your question',
          body: '{{amount}} is being reviewed with you. Nothing is needed from you right now, and no reminders are sent for it.',
        },
        upcoming: {
          title: 'Nothing is due right now',
          body: 'Your next payment is {{amount}}, due on {{date}}.',
        },
        complete: {
          title: 'Everything is paid. Thank you.',
          body: 'You have paid {{amount}} for this project.',
        },
        empty: {
          title: 'No payments to show yet',
          body: 'Your schedule appears here once your order is confirmed.',
        },
        payNow: 'Pay {{amount}} now',
        forStage: 'For: {{stage}}',
      },
      summary: {
        paid: 'Paid so far',
        total: 'Project total',
        remaining: 'Still to pay',
        percent: '{{percent}}% paid',
        inQuestion: 'Of this, {{amount}} is being looked into with you.',
      },
      held: {
        body: 'Installation is paused until a payment matter is settled. It starts again as soon as it is, and we will tell you.',
      },
      section: {
        schedule: 'Your payment schedule',
        received: 'Money received',
        loan: 'Pay over time',
        reminders: 'Coming reminders',
        help: 'Need help?',
      },
      stage: {
        advance: 'Advance',
        material: 'Materials',
        installation: 'Installation',
        handover: 'At handover',
        retention: 'Final retention',
      },
      state: {
        paid: 'Paid',
        confirming: 'Confirming',
        overdue: 'Past due',
        due: 'Due now',
        upcoming: 'Coming up',
        disputed: 'Being looked into',
        refunded: 'Refunded',
      },
      row: {
        dueOn: 'Due {{date}}',
        paidOn: 'Paid {{date}}',
        partial: '{{received}} received, {{remaining}} to go',
        raised: 'You raised a question on {{date}}',
        raisedNoDate: 'You raised a question',
        confirming: 'Confirming {{amount}}',
        refund: '{{amount}} refunded',
        pay: 'Pay',
      },
      detail: {
        amount: 'Stage amount',
        received: 'Received',
        remaining: 'Still to pay',
        due: 'Due date',
        paidOn: 'Paid on',
        method: 'Paid by',
        reference: 'Reference',
        receipt: 'View receipt',
        pay: 'Pay {{amount}}',
        call: 'Call us',
        confirming: {
          gateway: 'Your online payment is being confirmed with your bank. This usually takes a few minutes. You do not need to pay again.',
          bank: 'Our bank statement shows {{amount}} received on {{date}} that looks like your payment. We are matching it to this stage. If it is not yours, please call us.',
        },
        dispute: {
          open: 'You raised a question about this payment. It is being looked into, it is not shown as late, and no reminders are sent for it. We will tell you the outcome.',
          rejected: 'Your question was reviewed and the amount stands as invoiced.',
          full_refund: 'Your question was decided in your favour: {{amount}} is being refunded.',
          partial_refund: 'Your question was reviewed: {{amount}} is being refunded.',
        },
        later: 'This is not due yet. We will remind you before it is.',
      },
      loan: {
        available: {
          body: 'If it would help to spread the remaining {{amount}}, you can apply for an instalment (EMI) plan with our financing partner. It is entirely optional, and the first check is non-binding.',
          cta: 'See financing options',
        },
        in_progress: {
          body: 'Your financing application is with our partner. We will tell you as soon as there is news.',
        },
        approved: {
          body: 'Your financing is approved and we are waiting for the partner to release it. Your schedule updates when it arrives.',
        },
        disbursed: {
          body: 'Your financing has been received and applied to your schedule.',
        },
        view: 'View my application',
      },
      reminders: {
        line: '{{date}} · by {{channel}}',
        none: 'No reminders are scheduled right now.',
        paused: 'Reminders are paused for this project.',
        body: 'We remind you gently around each due date, by message.',
      },
      received: {
        empty: 'Nothing received yet.',
        history: 'Full payment history',
        documents: 'Receipts and invoices',
      },
      help: {
        body: 'Something not right about an amount or a date? Call us and we will sort it out with you.',
      },
      link: {
        open: 'Open my payments',
      },
    },
  },
  hi: {
    customerPayments: {
      title: 'भुगतान',
      subtitle: 'आपको क्या देना है, कब देना है और आप क्या दे चुके हैं।',
      loading: 'आपके भुगतान लोड हो रहे हैं…',
      error: {
        title: 'हम आपके भुगतान लोड नहीं कर सके',
        body: 'कुछ नहीं बदला है। अपना कनेक्शन देखें और फिर कोशिश करें।',
      },
      offline: 'आखिरी लोड की गई जानकारी दिखा रहे हैं। ऑनलाइन होते ही अपडेट होगी।',
      refresh: 'ताज़ा करें',
      close: 'बंद करें',
      empty: {
        title: 'अभी दिखाने के लिए कोई भुगतान नहीं',
        body: 'आपका ऑर्डर पक्का होते ही आपका भुगतान कार्यक्रम यहाँ दिखेगा।',
      },
      project: {
        separate: 'हर प्रोजेक्ट का अपना कार्यक्रम है। जो देखना हो वह चुनें।',
      },
      hero: {
        overdue: {
          title: '{{amount}} का भुगतान बाकी है',
          body_one: 'यह {{date}} को देय था, {{count}} दिन पहले। जब सुविधा हो तब भुगतान करें। कुछ गलत लगे तो कृपया हमें फ़ोन करें।',
          body_other: 'यह {{date}} को देय था, {{count}} दिन पहले। जब सुविधा हो तब भुगतान करें। कुछ गलत लगे तो कृपया हमें फ़ोन करें।',
        },
        due: {
          title: '{{amount}} देय है',
          body: '{{date}} को देय।',
        },
        confirming: {
          title: 'भुगतान मिल गया, पुष्टि हो रही है',
          body: 'हमें आपका {{amount}} का भुगतान दिख रहा है और हम उसे आपके खाते से मिला रहे हैं। यह जल्द ही चुकाया हुआ दिखेगा। दोबारा भुगतान करने की ज़रूरत नहीं।',
        },
        disputed: {
          title: 'हम आपके सवाल की जाँच कर रहे हैं',
          body: '{{amount}} की आपके साथ समीक्षा हो रही है। अभी आपसे कुछ नहीं चाहिए, और इसके लिए कोई रिमाइंडर नहीं भेजा जाता।',
        },
        upcoming: {
          title: 'अभी कुछ भी देय नहीं है',
          body: 'आपका अगला भुगतान {{amount}} है, जो {{date}} को देय है।',
        },
        complete: {
          title: 'सब कुछ चुका दिया गया है। धन्यवाद।',
          body: 'आपने इस प्रोजेक्ट के लिए {{amount}} चुकाए हैं।',
        },
        empty: {
          title: 'अभी दिखाने के लिए कोई भुगतान नहीं',
          body: 'आपका ऑर्डर पक्का होते ही कार्यक्रम यहाँ दिखेगा।',
        },
        payNow: 'अभी {{amount}} चुकाएँ',
        forStage: 'किसके लिए: {{stage}}',
      },
      summary: {
        paid: 'अब तक चुकाया',
        total: 'प्रोजेक्ट कुल',
        remaining: 'अभी चुकाना बाकी',
        percent: '{{percent}}% चुकाया',
        inQuestion: 'इसमें से {{amount}} की आपके साथ जाँच हो रही है।',
      },
      held: {
        body: 'एक भुगतान संबंधी मामला निपटने तक इंस्टॉलेशन रुका है। निपटते ही यह फिर शुरू होगा और हम आपको बताएँगे।',
      },
      section: {
        schedule: 'आपका भुगतान कार्यक्रम',
        received: 'प्राप्त राशि',
        loan: 'किस्तों में चुकाएँ',
        reminders: 'आने वाले रिमाइंडर',
        help: 'मदद चाहिए?',
      },
      stage: {
        advance: 'अग्रिम',
        material: 'सामग्री',
        installation: 'इंस्टॉलेशन',
        handover: 'हैंडओवर पर',
        retention: 'अंतिम रोकी गई राशि',
      },
      state: {
        paid: 'चुकाया',
        confirming: 'पुष्टि हो रही है',
        overdue: 'देय तिथि निकली',
        due: 'अभी देय',
        upcoming: 'आगे',
        disputed: 'जाँच में',
        refunded: 'वापस किया गया',
      },
      row: {
        dueOn: 'देय {{date}}',
        paidOn: 'चुकाया {{date}}',
        partial: '{{received}} मिले, {{remaining}} बाकी',
        raised: 'आपने {{date}} को सवाल उठाया',
        raisedNoDate: 'आपने सवाल उठाया',
        confirming: '{{amount}} की पुष्टि हो रही है',
        refund: '{{amount}} वापस किए गए',
        pay: 'चुकाएँ',
      },
      detail: {
        amount: 'चरण की राशि',
        received: 'प्राप्त',
        remaining: 'चुकाना बाकी',
        due: 'देय तिथि',
        paidOn: 'चुकाया गया',
        method: 'भुगतान का तरीका',
        reference: 'संदर्भ',
        receipt: 'रसीद देखें',
        pay: '{{amount}} चुकाएँ',
        call: 'हमें फ़ोन करें',
        confirming: {
          gateway: 'आपके ऑनलाइन भुगतान की आपके बैंक से पुष्टि हो रही है। इसमें आमतौर पर कुछ मिनट लगते हैं। दोबारा भुगतान करने की ज़रूरत नहीं।',
          bank: 'हमारे बैंक स्टेटमेंट में {{date}} को {{amount}} प्राप्त दिख रहा है जो आपके भुगतान जैसा है। हम इसे इस चरण से मिला रहे हैं। यदि यह आपका नहीं है तो कृपया हमें फ़ोन करें।',
        },
        dispute: {
          open: 'आपने इस भुगतान के बारे में सवाल उठाया है। उसकी जाँच हो रही है, इसे देर से नहीं दिखाया जाता और इसके लिए कोई रिमाइंडर नहीं भेजा जाता। हम आपको नतीजा बताएँगे।',
          rejected: 'आपके सवाल की समीक्षा हुई और राशि चालान के अनुसार ही रहेगी।',
          full_refund: 'आपके सवाल का फ़ैसला आपके पक्ष में हुआ: {{amount}} वापस किए जा रहे हैं।',
          partial_refund: 'आपके सवाल की समीक्षा हुई: {{amount}} वापस किए जा रहे हैं।',
        },
        later: 'यह अभी देय नहीं है। देय होने से पहले हम आपको याद दिलाएँगे।',
      },
      loan: {
        available: {
          body: 'यदि बाकी {{amount}} को किस्तों में बाँटना सुविधाजनक हो, तो आप हमारे फ़ाइनेंस पार्टनर के साथ किस्त (EMI) योजना के लिए आवेदन कर सकते हैं। यह पूरी तरह वैकल्पिक है, और पहली जाँच बाध्यकारी नहीं है।',
          cta: 'फ़ाइनेंस विकल्प देखें',
        },
        in_progress: {
          body: 'आपका फ़ाइनेंस आवेदन हमारे पार्टनर के पास है। कोई खबर आते ही हम आपको बताएँगे।',
        },
        approved: {
          body: 'आपका फ़ाइनेंस मंज़ूर हो गया है और हम पार्टनर द्वारा राशि जारी करने की प्रतीक्षा में हैं। राशि आते ही आपका कार्यक्रम अपडेट होगा।',
        },
        disbursed: {
          body: 'आपका फ़ाइनेंस प्राप्त हो गया है और आपके कार्यक्रम में लगा दिया गया है।',
        },
        view: 'मेरा आवेदन देखें',
      },
      reminders: {
        line: '{{date}} · {{channel}} से',
        none: 'अभी कोई रिमाइंडर निर्धारित नहीं है।',
        paused: 'इस प्रोजेक्ट के लिए रिमाइंडर रुके हुए हैं।',
        body: 'हम हर देय तिथि के आसपास संदेश से धीरे से याद दिलाते हैं।',
      },
      received: {
        empty: 'अभी तक कुछ प्राप्त नहीं हुआ।',
        history: 'पूरा भुगतान इतिहास',
        documents: 'रसीदें और इनवॉइस',
      },
      help: {
        body: 'किसी राशि या तारीख में कुछ गड़बड़ लगे? हमें फ़ोन करें, हम आपके साथ मिलकर उसे सुलझाएँगे।',
      },
      link: {
        open: 'मेरे भुगतान खोलें',
      },
    },
  },
  mr: {
    customerPayments: {
      title: 'पेमेंट',
      subtitle: 'तुम्हाला काय द्यायचे, केव्हा आणि तुम्ही काय दिले आहे.',
      loading: 'तुमची पेमेंट लोड होत आहेत…',
      error: {
        title: 'आम्ही तुमची पेमेंट लोड करू शकलो नाही',
        body: 'काहीही बदललेले नाही. तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.',
      },
      offline: 'शेवटची लोड केलेली माहिती दाखवत आहोत. ऑनलाइन येताच अपडेट होईल.',
      refresh: 'ताजे करा',
      close: 'बंद करा',
      empty: {
        title: 'अजून दाखवण्यासाठी पेमेंट नाही',
        body: 'तुमची ऑर्डर निश्चित होताच तुमचे पेमेंट वेळापत्रक येथे दिसेल.',
      },
      project: {
        separate: 'प्रत्येक प्रकल्पाचे स्वतःचे वेळापत्रक आहे. तुम्हाला जे पाहायचे ते निवडा.',
      },
      hero: {
        overdue: {
          title: '{{amount}} चे पेमेंट बाकी आहे',
          body_one: 'हे {{date}} रोजी देय होते, {{count}} दिवसापूर्वी. सोयीनुसार पेमेंट करा. काही चुकीचे वाटल्यास कृपया आम्हाला फोन करा.',
          body_other: 'हे {{date}} रोजी देय होते, {{count}} दिवसांपूर्वी. सोयीनुसार पेमेंट करा. काही चुकीचे वाटल्यास कृपया आम्हाला फोन करा.',
        },
        due: {
          title: '{{amount}} देय आहे',
          body: '{{date}} रोजी देय.',
        },
        confirming: {
          title: 'पेमेंट मिळाले, खात्री होत आहे',
          body: 'आम्हाला तुमचे {{amount}} चे पेमेंट दिसत आहे आणि आम्ही ते तुमच्या खात्याशी जुळवत आहोत. ते लवकरच भरलेले दिसेल. पुन्हा पेमेंट करण्याची गरज नाही.',
        },
        disputed: {
          title: 'आम्ही तुमच्या प्रश्नाची तपासणी करत आहोत',
          body: '{{amount}} चा तुमच्यासोबत आढावा घेतला जात आहे. सध्या तुमच्याकडून काही नको, आणि त्यासाठी कोणतेही स्मरण पाठवले जात नाही.',
        },
        upcoming: {
          title: 'सध्या काहीही देय नाही',
          body: 'तुमचे पुढचे पेमेंट {{amount}} आहे, जे {{date}} रोजी देय आहे.',
        },
        complete: {
          title: 'सर्व काही भरले आहे. धन्यवाद.',
          body: 'तुम्ही या प्रकल्पासाठी {{amount}} भरले आहेत.',
        },
        empty: {
          title: 'अजून दाखवण्यासाठी पेमेंट नाही',
          body: 'तुमची ऑर्डर निश्चित होताच वेळापत्रक येथे दिसेल.',
        },
        payNow: 'आता {{amount}} भरा',
        forStage: 'कशासाठी: {{stage}}',
      },
      summary: {
        paid: 'आतापर्यंत भरले',
        total: 'प्रकल्प एकूण',
        remaining: 'अजून भरायचे',
        percent: '{{percent}}% भरले',
        inQuestion: 'यापैकी {{amount}} ची तुमच्यासोबत तपासणी सुरू आहे.',
      },
      held: {
        body: 'एका पेमेंट संबंधी बाबीचा निकाल लागेपर्यंत इन्स्टॉलेशन थांबले आहे. तो लागताच ते पुन्हा सुरू होईल आणि आम्ही तुम्हाला कळवू.',
      },
      section: {
        schedule: 'तुमचे पेमेंट वेळापत्रक',
        received: 'मिळालेली रक्कम',
        loan: 'हप्त्यांमध्ये भरा',
        reminders: 'येणारी स्मरणे',
        help: 'मदत हवी?',
      },
      stage: {
        advance: 'आगाऊ',
        material: 'साहित्य',
        installation: 'इन्स्टॉलेशन',
        handover: 'हस्तांतरणावेळी',
        retention: 'अंतिम रोखलेली रक्कम',
      },
      state: {
        paid: 'भरले',
        confirming: 'खात्री होत आहे',
        overdue: 'देय तारीख उलटली',
        due: 'आता देय',
        upcoming: 'पुढे',
        disputed: 'तपासणीत',
        refunded: 'परत केले',
      },
      row: {
        dueOn: 'देय {{date}}',
        paidOn: 'भरले {{date}}',
        partial: '{{received}} मिळाले, {{remaining}} बाकी',
        raised: 'तुम्ही {{date}} रोजी प्रश्न मांडला',
        raisedNoDate: 'तुम्ही प्रश्न मांडला',
        confirming: '{{amount}} ची खात्री होत आहे',
        refund: '{{amount}} परत केले',
        pay: 'भरा',
      },
      detail: {
        amount: 'टप्प्याची रक्कम',
        received: 'मिळाले',
        remaining: 'भरायचे बाकी',
        due: 'देय तारीख',
        paidOn: 'भरल्याची तारीख',
        method: 'पेमेंटची पद्धत',
        reference: 'संदर्भ',
        receipt: 'पावती पहा',
        pay: '{{amount}} भरा',
        call: 'आम्हाला फोन करा',
        confirming: {
          gateway: 'तुमच्या ऑनलाइन पेमेंटची तुमच्या बँकेकडून खात्री होत आहे. यास साधारणपणे काही मिनिटे लागतात. पुन्हा पेमेंट करण्याची गरज नाही.',
          bank: 'आमच्या बँक स्टेटमेंटमध्ये {{date}} रोजी {{amount}} मिळालेले दिसते जे तुमच्या पेमेंटसारखे आहे. आम्ही ते या टप्प्याशी जुळवत आहोत. ते तुमचे नसल्यास कृपया आम्हाला फोन करा.',
        },
        dispute: {
          open: 'तुम्ही या पेमेंटबद्दल प्रश्न मांडला आहे. त्याची तपासणी सुरू आहे, ते उशिराचे म्हणून दाखवले जात नाही आणि त्यासाठी कोणतेही स्मरण पाठवले जात नाही. निकाल आम्ही तुम्हाला कळवू.',
          rejected: 'तुमच्या प्रश्नाचा आढावा घेतला गेला आणि रक्कम इन्व्हॉइसप्रमाणेच राहील.',
          full_refund: 'तुमच्या प्रश्नाचा निर्णय तुमच्या बाजूने झाला: {{amount}} परत केले जात आहेत.',
          partial_refund: 'तुमच्या प्रश्नाचा आढावा घेतला गेला: {{amount}} परत केले जात आहेत.',
        },
        later: 'हे अजून देय नाही. देय होण्यापूर्वी आम्ही तुम्हाला आठवण करून देऊ.',
      },
      loan: {
        available: {
          body: 'उर्वरित {{amount}} हप्त्यांमध्ये विभागणे सोयीचे असेल, तर तुम्ही आमच्या फायनान्स पार्टनरकडे हप्ता (EMI) योजनेसाठी अर्ज करू शकता. हे पूर्णपणे ऐच्छिक आहे, आणि पहिली तपासणी बंधनकारक नाही.',
          cta: 'फायनान्सचे पर्याय पहा',
        },
        in_progress: {
          body: 'तुमचा फायनान्स अर्ज आमच्या पार्टनरकडे आहे. काही बातमी येताच आम्ही तुम्हाला कळवू.',
        },
        approved: {
          body: 'तुमचा फायनान्स मंजूर झाला आहे आणि पार्टनरने रक्कम जारी करण्याची आम्ही वाट पाहत आहोत. ती येताच तुमचे वेळापत्रक अपडेट होईल.',
        },
        disbursed: {
          body: 'तुमचा फायनान्स मिळाला आहे आणि तुमच्या वेळापत्रकात लावला आहे.',
        },
        view: 'माझा अर्ज पहा',
      },
      reminders: {
        line: '{{date}} · {{channel}} द्वारे',
        none: 'सध्या कोणतेही स्मरण ठरलेले नाही.',
        paused: 'या प्रकल्पासाठी स्मरणे थांबवली आहेत.',
        body: 'आम्ही प्रत्येक देय तारखेच्या आसपास संदेशाद्वारे हळुवारपणे आठवण करून देतो.',
      },
      received: {
        empty: 'अजून काही मिळालेले नाही.',
        history: 'संपूर्ण पेमेंट इतिहास',
        documents: 'पावत्या आणि इन्व्हॉइस',
      },
      help: {
        body: 'एखाद्या रकमेत किंवा तारखेत काही चुकीचे वाटते? आम्हाला फोन करा, आम्ही तुमच्यासोबत ते सोडवू.',
      },
      link: {
        open: 'माझी पेमेंट उघडा',
      },
    },
  },
};

export default translations;
