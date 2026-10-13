import type { ScreenTranslations } from '@/i18n/types';

/** Screen 179. A customer's referral code, the people they referred and the reward, and the public page a referred person lands on, in three languages. `alert.*` titles are read by the alerts board, `link.*` by the screens that link here. */
const translations: ScreenTranslations = {
  en: {
    automationRules: {
      title: 'Automation rules',
      subtitle: 'Every automation the system runs on its own, by category, with its health and an emergency pause.',
      loading: 'Loading…',
      error: {
        title: 'We could not load this',
        body: 'Nothing has changed. Check your connection and try again.',
      },
      refresh: 'Refresh',
      close: 'Close',
      link: {
        monitor: 'Health Monitor',
        open: 'Automation rules',
      },
      hero: {
        title: 'The whole system',
        same: 'Health here is the Health Monitor\'s own telemetry, grouped by category. The two always agree.',
        stat: {
          categories: 'Categories',
          rules: 'Active rules and checks',
          paused: 'Paused',
          attention: 'Need a look',
          actions: 'Actions in 24 hours',
        },
      },
      paused: {
        title_one: '{{count}} category is paused',
        title_other: '{{count}} categories are paused',
        line: '{{name}}: since {{date}}, by {{by}}',
        resume: 'Resume',
      },
      card: {
        rules_one: '{{count}} rule switched on',
        rules_other: '{{count}} rules switched on',
        checks: '{{on}} of {{total}} scheduled checks running',
        lastAction: 'Last action {{when}}',
        noAction: 'Nothing has acted on its own yet',
        actions: '{{count}} actions in 24 hours',
        pause: 'Running',
        paused: 'Paused',
        protected: 'Always on',
        protectedHint: 'This is what makes sure every promise is kept, and that anything you pause is asked about again. It cannot be paused.',
        new: 'New',
        open: 'Open its settings',
        details: 'Details',
        attention: 'Needs a look',
      },
      category: {
        communications: {
          name: 'Communications',
          hint: 'Message sequences, trigger rules and scheduled quotation sends.',
        },
        payments: {
          name: 'Payments',
          hint: 'Payment reminders and stage invoices.',
        },
        finance: {
          name: 'Finance',
          hint: 'Daily bank reconciliation and GST checks.',
        },
        suppliers: {
          name: 'Suppliers',
          hint: 'Purchase order drafts, supplier payments, invoices and disputes.',
        },
        logistics: {
          name: 'Logistics',
          hint: 'Shipment milestones, carrier feeds and delivery delays.',
        },
        field: {
          name: 'Field work',
          hint: 'Site safety, problem reports, schedule clashes and hand-overs.',
        },
        quality: {
          name: 'Quality',
          hint: 'Inspector independence, check failures and snag follow-up.',
        },
        training: {
          name: 'Training',
          hint: 'Refreshers, certifications, compliance and procedure rollouts.',
        },
        recruitment: {
          name: 'Recruitment',
          hint: 'Intake, interviews, verification, offers and exits.',
        },
        payouts: {
          name: 'Partner payouts',
          hint: 'Payout runs, tax obligations and payout disputes.',
        },
        rewards: {
          name: 'Rewards',
          hint: 'Contest lifecycle and badge awards.',
        },
        customerCare: {
          name: 'Customer care',
          hint: 'Service requests, support chats and warranty reminders.',
        },
        commitments: {
          name: 'Follow-ups',
          hint: 'The engine that keeps every promise on someone\'s list and escalates what is late.',
        },
        custom: {
          name: 'Custom rules',
          hint: 'Plain-language rules you built yourself.',
        },
        other: {
          name: 'Other',
          hint: 'Automations that do not belong to a named category yet.',
        },
        newHint: 'A new kind of automation: it appeared because something ran under this name. It is listed here so it is never invisible.',
      },
      detail: {
        checks: 'Scheduled checks',
        noChecks: 'No scheduled checks in this category.',
        configured: '{{count}} rules configured in their own screens.',
        lastRun: 'Last ran {{when}}',
        error: 'Last error: {{error}}',
        history: 'Pause history',
        noHistory: 'This category has never been paused.',
        historyLine: '{{kind}} {{date}} by {{by}}',
        kind: {
          paused: 'Paused',
          resumed: 'Resumed',
        },
        skipped: '{{count}} runs did not happen',
        reason: 'Reason: {{reason}}',
      },
      pause: {
        title: 'Pause {{name}}?',
        intro: 'A blunt, fast stop for when the quickest right action is to stop everything in this category now. Here is exactly what it does.',
        does: {
          title: 'What a pause does',
          '1': 'Its scheduled checks stop running from now, so none of them takes any action on its own.',
          '2': 'Anything partway through is left exactly where it is, and carries on from there when you resume.',
          '3': 'Admin is asked a day later whether it should still be paused, so a pause is not forgotten.',
        },
        doesnot: {
          title: 'What it does not do',
          '1': 'It does not undo anything already done, or call back a message already sent.',
          '2': 'It does not stop money or goods already with a bank or a carrier.',
          '3': 'It does not stop anything a person does by hand: a reminder you send yourself still goes.',
          '4': 'It does not stop the clock on anyone\'s promises: due dates keep running and owners still see what is late.',
        },
        resume: {
          title: 'When you resume',
          '1': 'Each rule picks up under its own catch-up rule. Nothing is replayed all at once, and a step that is too old to be useful goes to the people who handle late things instead.',
        },
        affects: '{{count}} scheduled checks will stop. In the last day this category took {{actions}} actions on its own.',
        reason: 'Why are you pausing it?',
        reasonHint: 'At least 10 letters. It is kept with the pause and shown to whoever looks at it later.',
        confirm: 'Pause {{name}}',
        cancel: 'Not now',
      },
      resume: {
        title: 'Resume {{name}}?',
        body: 'Paused since {{date}} by {{by}}. {{count}} runs did not happen meanwhile. Each rule picks up under its own catch-up rule; nothing is replayed all at once.',
        confirm: 'Resume',
      },
      toast: {
        paused: '{{name}} paused',
        resumed: '{{name}} resumed',
      },
      activity: {
        title: 'Recent activity',
        hint: 'What the system did on its own in the last 24 hours. Many of the same kind close together are folded into one line.',
        all: 'All',
        count: '×{{count}}',
        latest: 'latest {{when}}',
        empty: 'Nothing has happened on its own in the last 24 hours.',
      },
      notice: {
        placeholders: 'Which categories can be paused, the 30-minute folding of the activity list and the 24-hour window are starting rules for the owner to confirm.',
      },
      alert: {
        paused: 'An automation category is paused',
        unitFailing: 'A scheduled check keeps failing',
      },
      problem: {
        reason_short: 'Please give a reason of at least 10 letters.',
        already_paused: 'That category is already paused.',
        not_paused: 'That category is not paused.',
        protected_category: 'That one cannot be paused: it keeps every promise on someone\'s list.',
        unknown_category: 'That category does not exist.',
        forbidden: 'Only Admin can do this.',
        generic: 'That did not work. Please try again.',
      },
    },
  },
  hi: {
    automationRules: {
      title: 'ऑटोमेशन नियम',
      subtitle: 'सिस्टम अपने आप जो भी ऑटोमेशन चलाता है, श्रेणी के अनुसार, उसकी स्थिति और आपातकालीन रोक के साथ।',
      loading: 'लोड हो रहा है…',
      error: {
        title: 'हम इसे लोड नहीं कर सके',
        body: 'कुछ नहीं बदला है। अपना कनेक्शन देखें और फिर कोशिश करें।',
      },
      refresh: 'ताज़ा करें',
      close: 'बंद करें',
      link: {
        monitor: 'हेल्थ मॉनिटर',
        open: 'ऑटोमेशन नियम',
      },
      hero: {
        title: 'पूरा सिस्टम',
        same: 'यहाँ की स्थिति हेल्थ मॉनिटर की अपनी टेलीमेट्री है, श्रेणी के अनुसार। दोनों हमेशा एक जैसे रहते हैं।',
        stat: {
          categories: 'श्रेणियाँ',
          rules: 'सक्रिय नियम और जाँचें',
          paused: 'रुकी हुई',
          attention: 'ध्यान चाहिए',
          actions: '24 घंटे में कार्रवाइयाँ',
        },
      },
      paused: {
        title_one: '{{count}} श्रेणी रुकी हुई है',
        title_other: '{{count}} श्रेणियाँ रुकी हुई हैं',
        line: '{{name}}: {{date}} से, {{by}} द्वारा',
        resume: 'फिर शुरू करें',
      },
      card: {
        rules_one: '{{count}} नियम चालू',
        rules_other: '{{count}} नियम चालू',
        checks: '{{total}} में से {{on}} निर्धारित जाँचें चल रही हैं',
        lastAction: 'आख़िरी कार्रवाई {{when}}',
        noAction: 'अभी तक अपने आप कुछ नहीं हुआ',
        actions: '24 घंटे में {{count}} कार्रवाइयाँ',
        pause: 'चल रहा है',
        paused: 'रुका हुआ',
        protected: 'हमेशा चालू',
        protectedHint: 'यही सुनिश्चित करता है कि हर वादा निभाया जाए, और आपने जो रोका है उसके बारे में फिर पूछा जाए। इसे रोका नहीं जा सकता।',
        new: 'नई',
        open: 'इसकी सेटिंग खोलें',
        details: 'विवरण',
        attention: 'ध्यान चाहिए',
      },
      category: {
        communications: {
          name: 'संचार',
          hint: 'संदेश अनुक्रम, ट्रिगर नियम और निर्धारित कोटेशन भेजना।',
        },
        payments: {
          name: 'भुगतान',
          hint: 'भुगतान की याद और चरण इनवॉइस।',
        },
        finance: {
          name: 'वित्त',
          hint: 'दैनिक बैंक मिलान और GST जाँच।',
        },
        suppliers: {
          name: 'सप्लायर',
          hint: 'परचेज़ ऑर्डर ड्राफ़्ट, सप्लायर भुगतान, इनवॉइस और विवाद।',
        },
        logistics: {
          name: 'लॉजिस्टिक्स',
          hint: 'शिपमेंट पड़ाव, कैरियर फ़ीड और डिलीवरी में देरी।',
        },
        field: {
          name: 'फ़ील्ड कार्य',
          hint: 'साइट सुरक्षा, समस्या रिपोर्ट, शेड्यूल टकराव और हैंड-ओवर।',
        },
        quality: {
          name: 'गुणवत्ता',
          hint: 'निरीक्षक की स्वतंत्रता, जाँच विफलताएँ और स्नैग फ़ॉलो-अप।',
        },
        training: {
          name: 'प्रशिक्षण',
          hint: 'रिफ़्रेशर, प्रमाणन, अनुपालन और प्रक्रिया रोलआउट।',
        },
        recruitment: {
          name: 'भर्ती',
          hint: 'इनटेक, इंटरव्यू, सत्यापन, ऑफ़र और निकास।',
        },
        payouts: {
          name: 'पार्टनर भुगतान',
          hint: 'भुगतान रन, कर दायित्व और भुगतान विवाद।',
        },
        rewards: {
          name: 'पुरस्कार',
          hint: 'प्रतियोगिता जीवनचक्र और बैज पुरस्कार।',
        },
        customerCare: {
          name: 'ग्राहक सेवा',
          hint: 'सर्विस अनुरोध, सपोर्ट चैट और वारंटी की याद।',
        },
        commitments: {
          name: 'फ़ॉलो-अप',
          hint: 'वह इंजन जो हर वादे को किसी की सूची में रखता है और देर से हुई चीज़ों को आगे बढ़ाता है।',
        },
        custom: {
          name: 'कस्टम नियम',
          hint: 'आपके खुद बनाए सादे भाषा वाले नियम।',
        },
        other: {
          name: 'अन्य',
          hint: 'ऐसे ऑटोमेशन जो अभी किसी नामित श्रेणी में नहीं हैं।',
        },
        newHint: 'एक नए प्रकार का ऑटोमेशन: यह इसलिए दिखा क्योंकि इस नाम से कुछ चला। इसे यहाँ सूचीबद्ध किया गया है ताकि यह कभी अदृश्य न रहे।',
      },
      detail: {
        checks: 'निर्धारित जाँचें',
        noChecks: 'इस श्रेणी में कोई निर्धारित जाँच नहीं।',
        configured: '{{count}} नियम अपनी-अपनी स्क्रीन में कॉन्फ़िगर हैं।',
        lastRun: 'आख़िरी बार {{when}} चली',
        error: 'आख़िरी त्रुटि: {{error}}',
        history: 'रोक का इतिहास',
        noHistory: 'इस श्रेणी को कभी रोका नहीं गया।',
        historyLine: '{{kind}} {{date}}, {{by}} द्वारा',
        kind: {
          paused: 'रोका गया',
          resumed: 'फिर शुरू किया',
        },
        skipped: '{{count}} रन नहीं हुए',
        reason: 'कारण: {{reason}}',
      },
      pause: {
        title: '{{name}} को रोकें?',
        intro: 'एक सीधा, तेज़ रोक, जब सबसे तेज़ सही कदम इस श्रेणी का सब कुछ अभी रोकना हो। यह ठीक-ठीक क्या करता है, नीचे है।',
        does: {
          title: 'रोक क्या करती है',
          '1': 'इसकी निर्धारित जाँचें अभी से चलना बंद कर देती हैं, इसलिए कोई भी अपने आप कोई कार्रवाई नहीं करती।',
          '2': 'जो कुछ आधा हो चुका है वह वैसा ही रहता है, और आपके दोबारा शुरू करने पर वहीं से आगे बढ़ता है।',
          '3': 'एक दिन बाद Admin से पूछा जाता है कि क्या इसे अब भी रोके रखना है, ताकि रोक भुला न दी जाए।',
        },
        doesnot: {
          title: 'यह क्या नहीं करती',
          '1': 'जो हो चुका है उसे वापस नहीं करती, और भेजे जा चुके संदेश को वापस नहीं बुलाती।',
          '2': 'यह उस पैसे या सामान को नहीं रोकती जो पहले से बैंक या कैरियर के पास है।',
          '3': 'यह किसी व्यक्ति द्वारा हाथ से की गई कोई चीज़ नहीं रोकती: आप खुद जो याद भेजते हैं वह जाती है।',
          '4': 'यह किसी के वादों की घड़ी नहीं रोकती: देय तिथियाँ चलती रहती हैं और मालिक देर वाली चीज़ें देखते रहते हैं।',
        },
        resume: {
          title: 'दोबारा शुरू करने पर',
          '1': 'हर नियम अपने कैच-अप नियम के अनुसार आगे बढ़ता है। सब कुछ एक साथ दोबारा नहीं चलता, और बहुत पुराना कदम उन लोगों के पास जाता है जो देर वाली चीज़ें सँभालते हैं।',
        },
        affects: '{{count}} निर्धारित जाँचें रुक जाएँगी। पिछले एक दिन में इस श्रेणी ने अपने आप {{actions}} कार्रवाइयाँ कीं।',
        reason: 'आप इसे क्यों रोक रहे हैं?',
        reasonHint: 'कम से कम 10 अक्षर। यह रोक के साथ रखा जाता है और बाद में देखने वाले को दिखता है।',
        confirm: '{{name}} को रोकें',
        cancel: 'अभी नहीं',
      },
      resume: {
        title: '{{name}} फिर शुरू करें?',
        body: '{{date}} से {{by}} द्वारा रुका हुआ। इस बीच {{count}} रन नहीं हुए। हर नियम अपने कैच-अप नियम से आगे बढ़ता है; सब कुछ एक साथ दोबारा नहीं चलता।',
        confirm: 'फिर शुरू करें',
      },
      toast: {
        paused: '{{name}} रुका',
        resumed: '{{name}} फिर शुरू',
      },
      activity: {
        title: 'हाल की गतिविधि',
        hint: 'पिछले 24 घंटों में सिस्टम ने अपने आप क्या किया। पास-पास हुई एक ही तरह की कई चीज़ें एक पंक्ति में समेटी गई हैं।',
        all: 'सभी',
        count: '×{{count}}',
        latest: 'ताज़ा {{when}}',
        empty: 'पिछले 24 घंटों में अपने आप कुछ नहीं हुआ।',
      },
      notice: {
        placeholders: 'कौन-सी श्रेणियाँ रोकी जा सकती हैं, गतिविधि सूची का 30 मिनट का समेटना और 24 घंटे की अवधि मालिक के पुष्टि करने के लिए शुरुआती नियम हैं।',
      },
      alert: {
        paused: 'एक ऑटोमेशन श्रेणी रुकी हुई है',
        unitFailing: 'एक निर्धारित जाँच बार-बार विफल हो रही है',
      },
      problem: {
        reason_short: 'कृपया कम से कम 10 अक्षरों का कारण दें।',
        already_paused: 'वह श्रेणी पहले से रुकी हुई है।',
        not_paused: 'वह श्रेणी रुकी हुई नहीं है।',
        protected_category: 'इसे रोका नहीं जा सकता: यह हर वादे को किसी की सूची में रखता है।',
        unknown_category: 'वह श्रेणी मौजूद नहीं है।',
        forbidden: 'यह केवल Admin कर सकता है।',
        generic: 'यह नहीं हो सका। कृपया फिर कोशिश करें।',
      },
    },
  },
  mr: {
    automationRules: {
      title: 'ऑटोमेशन नियम',
      subtitle: 'सिस्टम स्वतः जे काही ऑटोमेशन चालवते ते श्रेणीनुसार, त्याची स्थिती आणि आणीबाणी थांब्यासह.',
      loading: 'लोड होत आहे…',
      error: {
        title: 'आम्ही हे लोड करू शकलो नाही',
        body: 'काही बदललेले नाही. तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.',
      },
      refresh: 'ताजे करा',
      close: 'बंद करा',
      link: {
        monitor: 'हेल्थ मॉनिटर',
        open: 'ऑटोमेशन नियम',
      },
      hero: {
        title: 'संपूर्ण सिस्टम',
        same: 'येथील स्थिती हेल्थ मॉनिटरची स्वतःची टेलिमेट्री आहे, श्रेणीनुसार. दोन्ही नेहमी सारखे असतात.',
        stat: {
          categories: 'श्रेण्या',
          rules: 'सक्रिय नियम आणि तपासण्या',
          paused: 'थांबवलेल्या',
          attention: 'लक्ष हवे',
          actions: '24 तासांत कृती',
        },
      },
      paused: {
        title_one: '{{count}} श्रेणी थांबवलेली आहे',
        title_other: '{{count}} श्रेण्या थांबवलेल्या आहेत',
        line: '{{name}}: {{date}} पासून, {{by}} यांनी',
        resume: 'पुन्हा सुरू करा',
      },
      card: {
        rules_one: '{{count}} नियम चालू',
        rules_other: '{{count}} नियम चालू',
        checks: '{{total}} पैकी {{on}} नियोजित तपासण्या चालू आहेत',
        lastAction: 'शेवटची कृती {{when}}',
        noAction: 'अजून स्वतः काहीही झालेले नाही',
        actions: '24 तासांत {{count}} कृती',
        pause: 'चालू आहे',
        paused: 'थांबवलेले',
        protected: 'नेहमी चालू',
        protectedHint: 'हेच प्रत्येक वचन पाळले जाईल, आणि तुम्ही जे थांबवले त्याबद्दल पुन्हा विचारले जाईल याची खात्री करते. हे थांबवता येत नाही.',
        new: 'नवीन',
        open: 'त्याची सेटिंग उघडा',
        details: 'तपशील',
        attention: 'लक्ष हवे',
      },
      category: {
        communications: {
          name: 'संवाद',
          hint: 'संदेश क्रम, ट्रिगर नियम आणि नियोजित कोटेशन पाठवणे.',
        },
        payments: {
          name: 'पेमेंट',
          hint: 'पेमेंट आठवण आणि टप्प्याचे इनव्हॉइस.',
        },
        finance: {
          name: 'वित्त',
          hint: 'दैनिक बँक जुळवणी आणि GST तपासण्या.',
        },
        suppliers: {
          name: 'पुरवठादार',
          hint: 'खरेदी ऑर्डर मसुदे, पुरवठादार पेमेंट, इनव्हॉइस आणि वाद.',
        },
        logistics: {
          name: 'लॉजिस्टिक्स',
          hint: 'शिपमेंट टप्पे, कॅरियर फीड आणि डिलिव्हरी उशीर.',
        },
        field: {
          name: 'फील्ड काम',
          hint: 'साइट सुरक्षा, समस्या अहवाल, वेळापत्रक टक्कर आणि हँड-ओव्हर.',
        },
        quality: {
          name: 'गुणवत्ता',
          hint: 'निरीक्षकाचे स्वातंत्र्य, तपासणी अपयश आणि स्नॅग पाठपुरावा.',
        },
        training: {
          name: 'प्रशिक्षण',
          hint: 'रिफ्रेशर, प्रमाणन, अनुपालन आणि प्रक्रिया रोलआउट.',
        },
        recruitment: {
          name: 'भरती',
          hint: 'इनटेक, मुलाखती, पडताळणी, ऑफर आणि निर्गमन.',
        },
        payouts: {
          name: 'पार्टनर पेमेंट',
          hint: 'पेमेंट रन, कर जबाबदाऱ्या आणि पेमेंट वाद.',
        },
        rewards: {
          name: 'बक्षिसे',
          hint: 'स्पर्धा जीवनचक्र आणि बॅज पुरस्कार.',
        },
        customerCare: {
          name: 'ग्राहक सेवा',
          hint: 'सर्व्हिस विनंत्या, सपोर्ट चॅट आणि वॉरंटी आठवण.',
        },
        commitments: {
          name: 'पाठपुरावा',
          hint: 'प्रत्येक वचन कुणाच्या तरी यादीत ठेवणारे आणि उशिरा झालेल्या गोष्टी पुढे नेणारे इंजिन.',
        },
        custom: {
          name: 'कस्टम नियम',
          hint: 'तुम्ही स्वतः बनवलेले सोप्या भाषेतील नियम.',
        },
        other: {
          name: 'इतर',
          hint: 'असे ऑटोमेशन जे अजून कोणत्याही नावाच्या श्रेणीत नाहीत.',
        },
        newHint: 'एक नवीन प्रकारचे ऑटोमेशन: या नावाने काहीतरी चालले म्हणून ते दिसले. ते कधीही अदृश्य राहू नये म्हणून इथे दाखवले आहे.',
      },
      detail: {
        checks: 'नियोजित तपासण्या',
        noChecks: 'या श्रेणीत नियोजित तपासण्या नाहीत.',
        configured: '{{count}} नियम त्यांच्या स्वतःच्या स्क्रीनमध्ये कॉन्फिगर केले आहेत.',
        lastRun: 'शेवटची {{when}} चालली',
        error: 'शेवटची त्रुटी: {{error}}',
        history: 'थांब्याचा इतिहास',
        noHistory: 'ही श्रेणी कधीही थांबवलेली नाही.',
        historyLine: '{{kind}} {{date}}, {{by}} यांनी',
        kind: {
          paused: 'थांबवले',
          resumed: 'पुन्हा सुरू केले',
        },
        skipped: '{{count}} रन झाले नाहीत',
        reason: 'कारण: {{reason}}',
      },
      pause: {
        title: '{{name}} थांबवायचे?',
        intro: 'एक थेट, जलद थांबा, जेव्हा सर्वात जलद योग्य कृती म्हणजे या श्रेणीतील सर्व काही आत्ता थांबवणे. तो नेमके काय करतो ते खाली आहे.',
        does: {
          title: 'थांबा काय करतो',
          '1': 'त्याच्या नियोजित तपासण्या आत्तापासून चालणे थांबवतात, म्हणून कोणतीही स्वतःहून कृती करत नाही.',
          '2': 'जे अर्धवट झाले आहे ते तसेच राहते, आणि तुम्ही पुन्हा सुरू केल्यावर तिथूनच पुढे जाते.',
          '3': 'एका दिवसानंतर Admin ला विचारले जाते की ते अजूनही थांबवलेले ठेवायचे का, म्हणजे थांबा विसरला जात नाही.',
        },
        doesnot: {
          title: 'तो काय करत नाही',
          '1': 'जे आधीच झाले आहे ते परत करत नाही, किंवा आधी पाठवलेला संदेश परत बोलावत नाही.',
          '2': 'बँक किंवा कॅरियरकडे आधीच असलेले पैसे किंवा माल थांबवत नाही.',
          '3': 'एखाद्या व्यक्तीने हाताने केलेली कोणतीही गोष्ट थांबवत नाही: तुम्ही स्वतः पाठवलेली आठवण जाते.',
          '4': 'ही कोणाच्याही वचनांचे घड्याळ थांबवत नाही: देय तारखा चालू राहतात आणि मालकांना उशिरा झालेल्या गोष्टी दिसत राहतात.',
        },
        resume: {
          title: 'पुन्हा सुरू केल्यावर',
          '1': 'प्रत्येक नियम स्वतःच्या कॅच-अप नियमानुसार पुढे जातो. सर्व काही एकदम पुन्हा चालत नाही, आणि खूप जुनी पायरी उशिरा झालेल्या गोष्टी सांभाळणाऱ्यांकडे जाते.',
        },
        affects: '{{count}} नियोजित तपासण्या थांबतील. गेल्या एका दिवसात या श्रेणीने स्वतः {{actions}} कृती केल्या.',
        reason: 'तुम्ही ते का थांबवत आहात?',
        reasonHint: 'किमान 10 अक्षरे. ते थांब्यासोबत ठेवले जाते आणि नंतर पाहणाऱ्याला दिसते.',
        confirm: '{{name}} थांबवा',
        cancel: 'आत्ता नाही',
      },
      resume: {
        title: '{{name}} पुन्हा सुरू करायचे?',
        body: '{{date}} पासून {{by}} यांनी थांबवलेले. दरम्यान {{count}} रन झाले नाहीत. प्रत्येक नियम स्वतःच्या कॅच-अप नियमानुसार पुढे जातो; सर्व काही एकदम पुन्हा चालत नाही.',
        confirm: 'पुन्हा सुरू करा',
      },
      toast: {
        paused: '{{name}} थांबवले',
        resumed: '{{name}} पुन्हा सुरू',
      },
      activity: {
        title: 'अलीकडील हालचाल',
        hint: 'गेल्या 24 तासांत सिस्टमने स्वतः काय केले. जवळजवळ झालेल्या एकाच प्रकारच्या अनेक गोष्टी एका ओळीत एकत्र केल्या आहेत.',
        all: 'सर्व',
        count: '×{{count}}',
        latest: 'ताजे {{when}}',
        empty: 'गेल्या 24 तासांत स्वतः काहीही झालेले नाही.',
      },
      notice: {
        placeholders: 'कोणत्या श्रेण्या थांबवता येतात, हालचाल यादीचे 30 मिनिटांचे एकत्रीकरण आणि 24 तासांचा कालावधी हे मालकाने निश्चित करण्यासाठी सुरुवातीचे नियम आहेत.',
      },
      alert: {
        paused: 'एक ऑटोमेशन श्रेणी थांबवलेली आहे',
        unitFailing: 'एक नियोजित तपासणी वारंवार अयशस्वी होत आहे',
      },
      problem: {
        reason_short: 'कृपया किमान 10 अक्षरांचे कारण द्या.',
        already_paused: 'ती श्रेणी आधीच थांबवलेली आहे.',
        not_paused: 'ती श्रेणी थांबवलेली नाही.',
        protected_category: 'ते थांबवता येत नाही: ते प्रत्येक वचन कुणाच्या तरी यादीत ठेवते.',
        unknown_category: 'ती श्रेणी अस्तित्वात नाही.',
        forbidden: 'हे फक्त Admin करू शकतो.',
        generic: 'ते झाले नाही. कृपया पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
