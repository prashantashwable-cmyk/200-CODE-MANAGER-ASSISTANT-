import type { ScreenTranslations } from '@/i18n/types';

/** Screen 177. Customer maintenance and ratings, and Admin follow-up, in three languages. `alert.*` titles are read by the alerts board, `link.open` by the screens that link here. */
const translations: ScreenTranslations = {
  en: {
    maintenance: {
      title: 'Book a service visit',
      subtitle: 'Routine maintenance, or a call-out that is not urgent. Pick a time that suits you and see who is coming.',
      loading: 'Loading…',
      error: {
        title: 'We could not load this',
        body: 'Nothing has changed. Check your connection and try again.',
      },
      refresh: 'Refresh',
      close: 'Close',
      back: 'All visits',
      notFound: 'We could not find that visit.',
      link: {
        open: 'Book a service visit',
      },
      notice: {
        placeholders: 'The notice a change needs, how far ahead we offer times, and the arrival estimate are starting values for the owner to confirm.',
      },
      noLift: {
        title: 'No lift to book yet',
        body: 'Service visits are for lifts that have been handed over, and none on your account has yet.',
      },
      urgent: {
        title: 'Something wrong right now?',
        body: 'A fault, a strange noise or anything unsafe is not routine. Tell us through a service request and we treat it with the urgency it needs.',
        cta: 'Report a problem',
        call: 'Call now',
      },
      lift: {
        label: 'Which lift?',
      },
      cover: {
        title: 'Your cover',
        state: {
          active: 'Service plan active until {{date}}',
          expiring: 'Your service plan ends on {{date}}',
          lapsed: 'Your service plan ended on {{date}}',
          warranty: 'Under warranty until {{date}}. Routine maintenance is not part of the warranty.',
          none: 'No service plan on record',
        },
        visits: '{{left}} of {{total}} included visits left',
        renew: {
          expiring: 'Renew now so there is no gap, and your visits carry on.',
          lapsed: 'Your visits are not covered now. You can renew your plan, or book a paid visit below.',
          none: 'A service plan keeps your lift serviced and covered, with a quick response when you need us. You can also book a paid visit below.',
          cta: 'See plans and renew',
        },
        chargeable: 'This visit is not included, so it is chargeable. Estimated {{price}}; we confirm the price before the visit.',
        chargeableNoPrice: 'This visit is not included, so it is chargeable. We will confirm the price before the visit.',
        free: 'This visit is included in your plan.',
      },
      purpose: {
        title: 'What kind of visit?',
        routine: {
          title: 'Routine maintenance',
          body: 'A scheduled check and service of your lift.',
        },
        adhoc: {
          title: 'A call-out, not urgent',
          body: 'Something you would like looked at soon that is not an emergency.',
        },
      },
      note: {
        label: {
          routine: 'Anything we should know? (optional)',
          adhoc: 'What would you like looked at?',
        },
        hint: 'A few words help the technician arrive prepared.',
      },
      slots: {
        title: 'Choose a day and time',
        none: {
          skill_gap: 'We do not have a technician with the right skill and current safety clearance for this lift free right now. We will not promise a date we cannot keep: ask us to arrange it and a person will confirm.',
          none_soon: 'We cannot promise a date in the next few weeks. Ask us to arrange it and a person will confirm the earliest date.',
          none_in_window: 'Nothing is free in the next two weeks. The earliest we can do is {{date}}, {{window}}.',
        },
        earliest: 'Earliest available: {{date}}, {{window}}',
        day: {
          none: 'No time free',
        },
        arrangeTitle: 'Ask us to arrange a date',
        arrange: {
          body: 'No time is promised. A person will contact you with the earliest honest date.',
        },
      },
      window: {
        morning: 'Morning',
        afternoon: 'Afternoon',
      },
      tech: {
        title: 'Who will come',
        rating: '{{rating}} rating',
        unrated: 'Not rated yet',
        jobs_one: '{{count}} lift completed',
        jobs_other: '{{count}} lifts completed',
        note: 'Matched by the skill your lift needs, how busy they are that day, and how near they are.',
      },
      confirm: {
        submit: 'Confirm booking',
        arrange: 'Ask us to arrange',
        sending: 'Sending…',
      },
      done: {
        title: 'Visit booked',
        pending: {
          title: 'We will confirm a date',
        },
        body: '{{name}} will visit on {{date}}, {{window}}.',
        pendingBody: 'Your request is with our team. We will contact you with the earliest date we can keep.',
        reference: 'Reference {{code}}',
        open: 'See this visit',
      },
      bookings: {
        title: 'Your visits',
        empty: 'No bookings yet.',
        when: '{{date}}, {{window}}',
        pending: 'Waiting for a date',
      },
      detail: {
        technician: 'Your technician',
        rescheduleOpen: 'Change the time',
        reschedule: {
          hint: 'Pick another time below. Changes need at least {{hours}} hours of notice.',
          confirm: 'Move the visit',
        },
        cancelOpen: 'Cancel the visit',
        cancel: {
          title: 'Cancel this visit?',
          body: 'Tell us why, so we can close it properly.',
          reason: 'Reason',
          confirm: 'Cancel the visit',
          keep: 'Keep it',
        },
        moved: 'The visit has been moved.',
      },
      track: {
        title: 'On the day',
        not_today: 'Live arrival appears here on the day of your visit.',
        scheduled: 'Today is your visit, {{window}}. {{name}} will say when they set off.',
        on_the_way: '{{name}} is on the way.',
        eta: 'About {{minutes}} minutes away, from their position {{ago}} minutes ago.',
        noEta: 'We do not have a live position right now. They set off at {{time}}.',
        arrived: '{{name}} has arrived and started work.',
        done: 'The visit is done. Thank you.',
        missed: 'The visit did not happen as planned. We are arranging another and will tell you.',
        cancelled: 'This visit was cancelled.',
      },
      problem: {
        date_past: 'Choose today or a later day.',
        too_far: 'That is too far ahead.',
        date_invalid: 'Choose a valid day.',
        not_working_day: 'We do not visit on Sundays.',
        notice_short: 'That is too soon: a visit needs at least {{hours}} hours of notice.',
        slot_taken: 'That time has just been taken. Please pick another.',
        lift_required: 'Choose the lift this is for.',
        not_handed_over: 'That lift has not been handed over yet.',
        note_required: 'Tell us a little about what you would like looked at.',
        purpose_invalid: 'Choose the kind of visit.',
        invalid_state: 'That cannot be done at this stage.',
        note_short: 'Please write a little more.',
        generic: 'That did not work. Please try again.',
      },
    },
  },
  hi: {
    maintenance: {
      title: 'सर्विस विज़िट बुक करें',
      subtitle: 'नियमित मेंटेनेंस, या ऐसा कॉल-आउट जो तत्काल नहीं है। अपने अनुकूल समय चुनें और देखें कि कौन आ रहा है।',
      loading: 'लोड हो रहा है…',
      error: {
        title: 'हम इसे लोड नहीं कर सके',
        body: 'कुछ नहीं बदला है। अपना कनेक्शन देखें और फिर कोशिश करें।',
      },
      refresh: 'ताज़ा करें',
      close: 'बंद करें',
      back: 'सभी विज़िट',
      notFound: 'हमें वह विज़िट नहीं मिली।',
      link: {
        open: 'सर्विस विज़िट बुक करें',
      },
      notice: {
        placeholders: 'बदलाव के लिए ज़रूरी सूचना, हम कितने आगे के समय देते हैं, और पहुँचने का अनुमान शुरुआती मान हैं, जिन्हें मालिक को पक्का करना है।',
      },
      noLift: {
        title: 'अभी बुक करने के लिए कोई लिफ़्ट नहीं',
        body: 'सर्विस विज़िट सौंपी जा चुकी लिफ़्टों के लिए हैं, और आपके खाते में अभी कोई नहीं है।',
      },
      urgent: {
        title: 'अभी कुछ गड़बड़ है?',
        body: 'खराबी, अजीब आवाज़ या कुछ भी असुरक्षित नियमित नहीं है। सर्विस अनुरोध से हमें बताएँ, हम उसे ज़रूरी तात्कालिकता से लेंगे।',
        cta: 'समस्या बताएँ',
        call: 'अभी फ़ोन करें',
      },
      lift: {
        label: 'कौन-सी लिफ़्ट?',
      },
      cover: {
        title: 'आपका कवर',
        state: {
          active: 'सर्विस प्लान {{date}} तक सक्रिय',
          expiring: 'आपका सर्विस प्लान {{date}} को समाप्त होता है',
          lapsed: 'आपका सर्विस प्लान {{date}} को समाप्त हो गया',
          warranty: 'वारंटी {{date}} तक। नियमित मेंटेनेंस वारंटी का हिस्सा नहीं है।',
          none: 'रिकॉर्ड में कोई सर्विस प्लान नहीं',
        },
        visits: '{{total}} शामिल विज़िट में से {{left}} बाकी',
        renew: {
          expiring: 'अभी नवीनीकरण करें ताकि कोई अंतराल न रहे और आपकी विज़िट जारी रहें।',
          lapsed: 'आपकी विज़िट अभी कवर नहीं हैं। आप अपना प्लान नवीनीकृत कर सकते हैं, या नीचे सशुल्क विज़िट बुक कर सकते हैं।',
          none: 'सर्विस प्लान आपकी लिफ़्ट को सर्विस और कवर में रखता है, और ज़रूरत पर तेज़ प्रतिक्रिया देता है। आप नीचे सशुल्क विज़िट भी बुक कर सकते हैं।',
          cta: 'प्लान देखें और नवीनीकरण करें',
        },
        chargeable: 'यह विज़िट शामिल नहीं है, इसलिए सशुल्क है। अनुमानित {{price}}; विज़िट से पहले हम कीमत पक्की करेंगे।',
        chargeableNoPrice: 'यह विज़िट शामिल नहीं है, इसलिए सशुल्क है। विज़िट से पहले हम कीमत पक्की करेंगे।',
        free: 'यह विज़िट आपके प्लान में शामिल है।',
      },
      purpose: {
        title: 'किस तरह की विज़िट?',
        routine: {
          title: 'नियमित मेंटेनेंस',
          body: 'आपकी लिफ़्ट की निर्धारित जाँच और सर्विस।',
        },
        adhoc: {
          title: 'कॉल-आउट, तत्काल नहीं',
          body: 'कुछ ऐसा जिसे आप जल्द दिखवाना चाहते हैं पर आपातकाल नहीं।',
        },
      },
      note: {
        label: {
          routine: 'कुछ जो हमें जानना चाहिए? (वैकल्पिक)',
          adhoc: 'आप क्या दिखवाना चाहेंगे?',
        },
        hint: 'कुछ शब्द तकनीशियन को तैयार होकर आने में मदद करते हैं।',
      },
      slots: {
        title: 'दिन और समय चुनें',
        none: {
          skill_gap: 'इस लिफ़्ट के लिए सही कौशल और मौजूदा सुरक्षा मंज़ूरी वाला तकनीशियन अभी खाली नहीं है। हम वह तारीख़ नहीं देंगे जो निभा न सकें: हमसे व्यवस्था करने को कहें और कोई व्यक्ति पुष्टि करेगा।',
          none_soon: 'हम अगले कुछ हफ़्तों में तारीख़ का वादा नहीं कर सकते। हमसे व्यवस्था करने को कहें और कोई व्यक्ति सबसे जल्दी की तारीख़ पक्की करेगा।',
          none_in_window: 'अगले दो हफ़्तों में कुछ खाली नहीं है। हम सबसे जल्दी {{date}}, {{window}} को कर सकते हैं।',
        },
        earliest: 'सबसे जल्दी उपलब्ध: {{date}}, {{window}}',
        day: {
          none: 'कोई समय खाली नहीं',
        },
        arrangeTitle: 'हमसे तारीख़ तय करने को कहें',
        arrange: {
          body: 'कोई समय वादा नहीं किया जाता। कोई व्यक्ति सबसे जल्दी की सच्ची तारीख़ के साथ आपसे संपर्क करेगा।',
        },
      },
      window: {
        morning: 'सुबह',
        afternoon: 'दोपहर बाद',
      },
      tech: {
        title: 'कौन आएगा',
        rating: '{{rating}} रेटिंग',
        unrated: 'अभी रेटिंग नहीं',
        jobs_one: '{{count}} लिफ़्ट पूरी की',
        jobs_other: '{{count}} लिफ़्ट पूरी कीं',
        note: 'आपकी लिफ़्ट के लिए ज़रूरी कौशल, उस दिन उनकी व्यस्तता और उनकी निकटता के आधार पर चुना गया।',
      },
      confirm: {
        submit: 'बुकिंग पक्की करें',
        arrange: 'हमसे व्यवस्था करने को कहें',
        sending: 'भेज रहे हैं…',
      },
      done: {
        title: 'विज़िट बुक हो गई',
        pending: {
          title: 'हम तारीख़ पक्की करेंगे',
        },
        body: '{{name}} {{date}} को आएँगे, {{window}}।',
        pendingBody: 'आपका अनुरोध हमारी टीम के पास है। हम सबसे जल्दी की उस तारीख़ के साथ संपर्क करेंगे जो हम निभा सकें।',
        reference: 'संदर्भ {{code}}',
        open: 'यह विज़िट देखें',
      },
      bookings: {
        title: 'आपकी विज़िट',
        empty: 'अभी कोई बुकिंग नहीं।',
        when: '{{date}}, {{window}}',
        pending: 'तारीख़ की प्रतीक्षा',
      },
      detail: {
        technician: 'आपके तकनीशियन',
        rescheduleOpen: 'समय बदलें',
        reschedule: {
          hint: 'नीचे कोई और समय चुनें। बदलाव के लिए कम से कम {{hours}} घंटे की सूचना चाहिए।',
          confirm: 'विज़िट बदलें',
        },
        cancelOpen: 'विज़िट रद्द करें',
        cancel: {
          title: 'यह विज़िट रद्द करें?',
          body: 'हमें बताएँ क्यों, ताकि हम इसे ठीक से बंद कर सकें।',
          reason: 'कारण',
          confirm: 'विज़िट रद्द करें',
          keep: 'रहने दें',
        },
        moved: 'विज़िट बदल दी गई है।',
      },
      track: {
        title: 'उसी दिन',
        not_today: 'आपकी विज़िट के दिन यहाँ लाइव आगमन दिखेगा।',
        scheduled: 'आज आपकी विज़िट है, {{window}}। {{name}} निकलते समय बताएँगे।',
        on_the_way: '{{name}} रास्ते में हैं।',
        eta: 'लगभग {{minutes}} मिनट दूर, {{ago}} मिनट पहले की उनकी स्थिति से।',
        noEta: 'अभी हमारे पास लाइव स्थिति नहीं है। वे {{time}} पर निकले।',
        arrived: '{{name}} पहुँच गए हैं और काम शुरू कर दिया है।',
        done: 'विज़िट पूरी हो गई। धन्यवाद।',
        missed: 'विज़िट योजना के अनुसार नहीं हो सकी। हम दूसरी तय कर रहे हैं और आपको बताएँगे।',
        cancelled: 'यह विज़िट रद्द की गई।',
      },
      problem: {
        date_past: 'आज या बाद का दिन चुनें।',
        too_far: 'यह बहुत आगे है।',
        date_invalid: 'सही दिन चुनें।',
        not_working_day: 'हम रविवार को विज़िट नहीं करते।',
        notice_short: 'यह बहुत जल्दी है: विज़िट के लिए कम से कम {{hours}} घंटे की सूचना चाहिए।',
        slot_taken: 'वह समय अभी-अभी ले लिया गया। कृपया दूसरा चुनें।',
        lift_required: 'चुनें कि यह किस लिफ़्ट के लिए है।',
        not_handed_over: 'वह लिफ़्ट अभी सौंपी नहीं गई है।',
        note_required: 'थोड़ा बताएँ कि आप क्या दिखवाना चाहते हैं।',
        purpose_invalid: 'विज़िट का प्रकार चुनें।',
        invalid_state: 'इस चरण पर यह नहीं हो सकता।',
        note_short: 'कृपया थोड़ा और लिखें।',
        generic: 'यह नहीं हो सका। कृपया फिर कोशिश करें।',
      },
    },
  },
  mr: {
    maintenance: {
      title: 'सर्व्हिस भेट बुक करा',
      subtitle: 'नियमित मेंटेनन्स, किंवा तातडीची नसलेली कॉल-आउट. तुम्हाला सोयीची वेळ निवडा आणि कोण येत आहे ते पहा.',
      loading: 'लोड होत आहे…',
      error: {
        title: 'आम्ही हे लोड करू शकलो नाही',
        body: 'काहीही बदललेले नाही. तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.',
      },
      refresh: 'ताजे करा',
      close: 'बंद करा',
      back: 'सर्व भेटी',
      notFound: 'ती भेट आम्हाला सापडली नाही.',
      link: {
        open: 'सर्व्हिस भेट बुक करा',
      },
      notice: {
        placeholders: 'बदलासाठी लागणारी पूर्वसूचना, आम्ही किती पुढचे वेळ देतो, आणि पोहोचण्याचा अंदाज ही सुरुवातीची मूल्ये आहेत, जी मालकाने निश्चित करायची आहेत.',
      },
      noLift: {
        title: 'अजून बुक करण्यासाठी लिफ्ट नाही',
        body: 'सर्व्हिस भेटी सुपूर्द झालेल्या लिफ्टसाठी आहेत, आणि तुमच्या खात्यात अजून एकही नाही.',
      },
      urgent: {
        title: 'आत्ता काही बिघडले आहे का?',
        body: 'बिघाड, विचित्र आवाज किंवा काहीही असुरक्षित हे नियमित नाही. सर्व्हिस विनंतीद्वारे आम्हाला सांगा, आम्ही त्याला आवश्यक तातडीने हाताळू.',
        cta: 'समस्या कळवा',
        call: 'आत्ता फोन करा',
      },
      lift: {
        label: 'कोणती लिफ्ट?',
      },
      cover: {
        title: 'तुमचे संरक्षण',
        state: {
          active: 'सर्व्हिस प्लॅन {{date}} पर्यंत सक्रिय',
          expiring: 'तुमचा सर्व्हिस प्लॅन {{date}} रोजी संपतो',
          lapsed: 'तुमचा सर्व्हिस प्लॅन {{date}} रोजी संपला',
          warranty: 'वॉरंटी {{date}} पर्यंत. नियमित मेंटेनन्स वॉरंटीचा भाग नाही.',
          none: 'नोंदीत सर्व्हिस प्लॅन नाही',
        },
        visits: '{{total}} समाविष्ट भेटींपैकी {{left}} बाकी',
        renew: {
          expiring: 'आत्ताच नूतनीकरण करा म्हणजे खंड पडणार नाही आणि तुमच्या भेटी सुरू राहतील.',
          lapsed: 'तुमच्या भेटी आता समाविष्ट नाहीत. तुम्ही तुमचा प्लॅन नूतनीकृत करू शकता, किंवा खाली सशुल्क भेट बुक करू शकता.',
          none: 'सर्व्हिस प्लॅन तुमची लिफ्ट सर्व्हिस आणि संरक्षणात ठेवतो, आणि गरजेवेळी जलद प्रतिसाद देतो. तुम्ही खाली सशुल्क भेटही बुक करू शकता.',
          cta: 'प्लॅन पहा आणि नूतनीकरण करा',
        },
        chargeable: 'ही भेट समाविष्ट नाही, त्यामुळे शुल्कपात्र आहे. अंदाजे {{price}}; भेटीपूर्वी आम्ही किंमत निश्चित करू.',
        chargeableNoPrice: 'ही भेट समाविष्ट नाही, त्यामुळे शुल्कपात्र आहे. भेटीपूर्वी आम्ही किंमत निश्चित करू.',
        free: 'ही भेट तुमच्या प्लॅनमध्ये समाविष्ट आहे.',
      },
      purpose: {
        title: 'कोणत्या प्रकारची भेट?',
        routine: {
          title: 'नियमित मेंटेनन्स',
          body: 'तुमच्या लिफ्टची ठरलेली तपासणी आणि सर्व्हिस.',
        },
        adhoc: {
          title: 'कॉल-आउट, तातडीचे नाही',
          body: 'काहीतरी जे तुम्हाला लवकर पाहून घ्यायचे आहे पण आणीबाणी नाही.',
        },
      },
      note: {
        label: {
          routine: 'आम्हाला काही माहित असायला हवे का? (ऐच्छिक)',
          adhoc: 'तुम्हाला काय पाहून घ्यायचे आहे?',
        },
        hint: 'काही शब्द तंत्रज्ञाला तयार येण्यास मदत करतात.',
      },
      slots: {
        title: 'दिवस आणि वेळ निवडा',
        none: {
          skill_gap: 'या लिफ्टसाठी योग्य कौशल्य आणि सध्याची सुरक्षा मंजुरी असलेला तंत्रज्ञ आत्ता मोकळा नाही. आम्ही पाळू न शकणारी तारीख देणार नाही: आम्हाला व्यवस्था करण्यास सांगा आणि कोणीतरी माणूस खात्री करेल.',
          none_soon: 'आम्ही पुढच्या काही आठवड्यांत तारखेचे वचन देऊ शकत नाही. आम्हाला व्यवस्था करण्यास सांगा आणि कोणीतरी माणूस लवकरात लवकरची तारीख निश्चित करेल.',
          none_in_window: 'पुढच्या दोन आठवड्यांत काहीही मोकळे नाही. आम्ही लवकरात लवकर {{date}}, {{window}} रोजी करू शकतो.',
        },
        earliest: 'लवकरात लवकर उपलब्ध: {{date}}, {{window}}',
        day: {
          none: 'वेळ मोकळी नाही',
        },
        arrangeTitle: 'आम्हाला तारीख ठरवण्यास सांगा',
        arrange: {
          body: 'कोणतीही वेळ वचन दिलेली नाही. कोणीतरी माणूस लवकरात लवकरच्या प्रामाणिक तारखेसह तुमच्याशी संपर्क साधेल.',
        },
      },
      window: {
        morning: 'सकाळ',
        afternoon: 'दुपारनंतर',
      },
      tech: {
        title: 'कोण येणार',
        rating: '{{rating}} रेटिंग',
        unrated: 'अजून रेटिंग नाही',
        jobs_one: '{{count}} लिफ्ट पूर्ण केली',
        jobs_other: '{{count}} लिफ्ट पूर्ण केल्या',
        note: 'तुमच्या लिफ्टसाठी लागणारे कौशल्य, त्या दिवशी त्यांची व्यस्तता आणि त्यांची जवळीक यावरून निवडले.',
      },
      confirm: {
        submit: 'बुकिंग निश्चित करा',
        arrange: 'आम्हाला व्यवस्था करण्यास सांगा',
        sending: 'पाठवत आहोत…',
      },
      done: {
        title: 'भेट बुक झाली',
        pending: {
          title: 'आम्ही तारीख निश्चित करू',
        },
        body: '{{name}} {{date}} रोजी येतील, {{window}}.',
        pendingBody: 'तुमची विनंती आमच्या टीमकडे आहे. आम्ही पाळू शकू अशा लवकरात लवकरच्या तारखेसह संपर्क साधू.',
        reference: 'संदर्भ {{code}}',
        open: 'ही भेट पहा',
      },
      bookings: {
        title: 'तुमच्या भेटी',
        empty: 'अजून बुकिंग नाही.',
        when: '{{date}}, {{window}}',
        pending: 'तारखेची वाट',
      },
      detail: {
        technician: 'तुमचे तंत्रज्ञ',
        rescheduleOpen: 'वेळ बदला',
        reschedule: {
          hint: 'खाली दुसरी वेळ निवडा. बदलासाठी किमान {{hours}} तासांची पूर्वसूचना हवी.',
          confirm: 'भेट हलवा',
        },
        cancelOpen: 'भेट रद्द करा',
        cancel: {
          title: 'ही भेट रद्द करायची?',
          body: 'का ते सांगा, म्हणजे आम्ही ते नीट बंद करू शकू.',
          reason: 'कारण',
          confirm: 'भेट रद्द करा',
          keep: 'ठेवा',
        },
        moved: 'भेट हलवली आहे.',
      },
      track: {
        title: 'त्या दिवशी',
        not_today: 'तुमच्या भेटीच्या दिवशी येथे थेट आगमन दिसेल.',
        scheduled: 'आज तुमची भेट आहे, {{window}}. {{name}} निघताना सांगतील.',
        on_the_way: '{{name}} वाटेत आहेत.',
        eta: 'सुमारे {{minutes}} मिनिटे दूर, {{ago}} मिनिटांपूर्वीच्या त्यांच्या स्थानावरून.',
        noEta: 'सध्या आमच्याकडे थेट स्थान नाही. ते {{time}} वाजता निघाले.',
        arrived: '{{name}} पोहोचले आहेत आणि त्यांनी काम सुरू केले आहे.',
        done: 'भेट पूर्ण झाली. धन्यवाद.',
        missed: 'भेट ठरल्याप्रमाणे झाली नाही. आम्ही दुसरी ठरवत आहोत आणि तुम्हाला सांगू.',
        cancelled: 'ही भेट रद्द झाली.',
      },
      problem: {
        date_past: 'आज किंवा नंतरचा दिवस निवडा.',
        too_far: 'हे खूप पुढचे आहे.',
        date_invalid: 'योग्य दिवस निवडा.',
        not_working_day: 'आम्ही रविवारी भेट देत नाही.',
        notice_short: 'हे खूप लवकर आहे: भेटीसाठी किमान {{hours}} तासांची पूर्वसूचना हवी.',
        slot_taken: 'ती वेळ आत्ताच घेतली गेली. कृपया दुसरी निवडा.',
        lift_required: 'ही कोणत्या लिफ्टसाठी आहे ते निवडा.',
        not_handed_over: 'ती लिफ्ट अजून सुपूर्द झालेली नाही.',
        note_required: 'तुम्हाला काय पाहून घ्यायचे आहे ते थोडे सांगा.',
        purpose_invalid: 'भेटीचा प्रकार निवडा.',
        invalid_state: 'या टप्प्यावर हे करता येत नाही.',
        note_short: 'कृपया थोडे आणखी लिहा.',
        generic: 'ते झाले नाही. कृपया पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
