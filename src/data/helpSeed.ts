import type { HelpText } from './types';

/** Starting help articles (199). The wording is a first draft for the owner to check; each is role-tagged and points at the screens it talks about. */
export interface HelpSeed { id: string; category: string; roles: string[]; routes: string[]; title: Required<HelpText>; body: Required<HelpText>; reviewedDaysAgo: number }

export const seedHelpArticles: HelpSeed[] = [
  {
    id: 'ha-1', category: 'getting_started', roles: ['all'], routes: ['/settings'], reviewedDaysAgo: 40,
    title: { en: 'Signing in and keeping your account safe', hi: 'साइन इन करना और अपना खाता सुरक्षित रखना', mr: 'साइन इन करणे आणि तुमचे खाते सुरक्षित ठेवणे' },
    body: {
      en: 'You sign in with your mobile number and a one-time code sent to it. Never share that code with anyone, including someone who says they are from AIEC. If you lose your phone, tell the AIEC office at once so your account can be locked and then recovered. You can sign out from Settings.',
      hi: 'आप अपने मोबाइल नंबर और उस पर भेजे गए एक-बार के कोड से साइन इन करते हैं। यह कोड किसी को न बताएँ, उसे भी नहीं जो खुद को AIEC का बताए। फ़ोन खो जाए तो तुरंत AIEC कार्यालय को बताएँ ताकि आपका खाता लॉक करके बाद में वापस दिलाया जा सके। आप सेटिंग्स से साइन आउट कर सकते हैं।',
      mr: 'तुम्ही तुमच्या मोबाइल नंबरवर आलेल्या एकदा वापरायच्या कोडने साइन इन करता. हा कोड कोणालाही सांगू नका, स्वतःला AIEC चा म्हणवणाऱ्यालाही नाही. फोन हरवला तर लगेच AIEC कार्यालयाला कळवा म्हणजे तुमचे खाते लॉक करून नंतर परत मिळवता येईल. तुम्ही सेटिंग्जमधून साइन आउट करू शकता.',
    },
  },
  {
    id: 'ha-2', category: 'account', roles: ['all'], routes: ['/settings'], reviewedDaysAgo: 60,
    title: { en: 'Changing the language and the look of the app', hi: 'ऐप की भाषा और रूप बदलना', mr: 'अॅपची भाषा आणि स्वरूप बदलणे' },
    body: {
      en: 'Open Settings and choose English, Hindi or Marathi. You can also choose a light, dark or system theme. Your choice is saved to your own account, so it is the same on any phone you sign in on.',
      hi: 'सेटिंग्स खोलें और अंग्रेज़ी, हिन्दी या मराठी चुनें। आप हल्का, गहरा या सिस्टम थीम भी चुन सकते हैं। आपकी पसंद आपके अपने खाते में सहेजी जाती है, इसलिए जिस भी फ़ोन पर साइन इन करें वही रहती है।',
      mr: 'सेटिंग्ज उघडा आणि इंग्रजी, हिंदी किंवा मराठी निवडा. तुम्ही फिकट, गडद किंवा सिस्टम थीमही निवडू शकता. तुमची निवड तुमच्या स्वतःच्या खात्यात जतन होते, त्यामुळे कोणत्याही फोनवर साइन इन केले तरी तीच राहते.',
    },
  },
  {
    id: 'ha-3', category: 'payments', roles: ['customer'], routes: ['/my-payments'], reviewedDaysAgo: 30,
    title: { en: 'Where do I see what I owe and when?', hi: 'मुझे कितना और कब देना है, यह कहाँ दिखता है?', mr: 'मला किती आणि कधी द्यायचे आहे, ते कुठे दिसते?' },
    body: {
      en: 'Open Payments from your home screen. Each project shows its stages in order, and the one that needs you next is at the top with a Pay button. A stage that is past its date is marked as past due, and a stage we are looking into with you is shown as being looked into, with no reminders.',
      hi: 'अपनी होम स्क्रीन से भुगतान खोलें। हर प्रोजेक्ट के चरण क्रम से दिखते हैं, और जिस चरण में अगला कदम आपका है वह भुगतान बटन के साथ सबसे ऊपर रहता है। तारीख निकल चुका चरण देय-से-अधिक के रूप में चिह्नित होता है, और जिस चरण पर हम आपके साथ विचार कर रहे हैं वह विचाराधीन दिखता है, उसके लिए कोई अनुस्मारक नहीं आते।',
      mr: 'तुमच्या होम स्क्रीनवरून पेमेंट्स उघडा. प्रत्येक प्रकल्पाचे टप्पे क्रमाने दिसतात, आणि पुढचा तुमचा टप्पा पे बटणासह वर असतो. तारीख उलटलेला टप्पा मुदतीबाहेर म्हणून चिन्हांकित होतो, आणि ज्या टप्प्याची आम्ही तुमच्यासोबत तपासणी करत आहोत तो तपासणीत म्हणून दिसतो, त्यासाठी स्मरणे येत नाहीत.',
    },
  },
  {
    id: 'ha-4', category: 'payments', roles: ['customer'], routes: ['/my-payments', '/payments-history-old'], reviewedDaysAgo: 120,
    title: { en: 'My payment still shows as confirming', hi: 'मेरा भुगतान अभी भी पुष्टि हो रहा दिख रहा है', mr: 'माझे पेमेंट अजूनही पुष्टी होत असल्याचे दिसत आहे' },
    body: {
      en: 'Some payments, such as net banking, take a little while to settle. While we match your payment it shows as confirming, and the page turns to paid by itself. Keep your bank reference; if it is still confirming after a working day, ask us.',
      hi: 'कुछ भुगतान, जैसे नेट बैंकिंग, पूरे होने में थोड़ा समय लेते हैं। जब तक हम आपका भुगतान मिलाते हैं, वह पुष्टि हो रहा दिखता है, और पेज अपने आप भुगतान किया हुआ हो जाता है। अपना बैंक संदर्भ रखें; एक कार्य दिवस बाद भी पुष्टि हो रहा हो तो हमसे पूछें।',
      mr: 'काही पेमेंट्स, जसे नेट बँकिंग, पूर्ण होण्यास थोडा वेळ घेतात. आम्ही तुमचे पेमेंट जुळवत असताना ते पुष्टी होत असल्याचे दिसते, आणि पेज आपोआप भरलेले होते. तुमचा बँक संदर्भ ठेवा; एक कामकाजाच्या दिवसानंतरही पुष्टी होत असेल तर आम्हाला विचारा.',
    },
  },
  {
    id: 'ha-5', category: 'service', roles: ['customer'], routes: ['/maintenance'], reviewedDaysAgo: 25,
    title: { en: 'What does my warranty or AMC cover, and how do I book a visit?', hi: 'मेरी वारंटी या AMC में क्या शामिल है, और विज़िट कैसे बुक करूँ?', mr: 'माझ्या वॉरंटी किंवा AMC मध्ये काय येते, आणि भेट कशी बुक करू?' },
    body: {
      en: 'Open Book a service visit. It first tells you what covers your lift: the warranty, an AMC with visits left, or nothing yet. If you are covered, pick a day and we show only times that can really be kept. If you are not covered, a visit can still be booked and we confirm the charge before it happens.',
      hi: 'सर्विस विज़िट बुक करें खोलें। यह पहले बताता है कि आपकी लिफ़्ट को क्या कवर करता है: वारंटी, बची विज़िट वाला AMC, या अभी कुछ नहीं। कवर हों तो दिन चुनें और हम केवल वही समय दिखाते हैं जो सच में निभाए जा सकते हैं। कवर न हों तब भी विज़िट बुक हो सकती है और हम होने से पहले शुल्क की पुष्टि करते हैं।',
      mr: 'सर्व्हिस भेट बुक करा उघडा. ते आधी सांगते की तुमच्या लिफ्टला काय कव्हर करते: वॉरंटी, उरलेल्या भेटी असलेला AMC, किंवा अजून काही नाही. कव्हर असेल तर दिवस निवडा आणि आम्ही फक्त खरोखर पाळता येतील अशा वेळा दाखवतो. कव्हर नसेल तरी भेट बुक करता येते आणि होण्यापूर्वी आम्ही शुल्काची खात्री करतो.',
    },
  },
  {
    id: 'ha-6', category: 'service', roles: ['customer'], routes: ['/service-requests', '/support-chat'], reviewedDaysAgo: 20,
    title: { en: 'If something about your lift feels unsafe', hi: 'अगर आपकी लिफ़्ट असुरक्षित लगे', mr: 'तुमची लिफ्ट असुरक्षित वाटली तर' },
    body: {
      en: 'Stop using the lift. Open Service requests and use the emergency card at the top: it calls us, or alerts us with your location in one tap. Do not wait for a chat reply for anything that could hurt someone.',
      hi: 'लिफ़्ट का उपयोग बंद करें। सेवा अनुरोध खोलें और ऊपर के आपातकालीन कार्ड का उपयोग करें: यह हमें कॉल करता है, या एक टैप में आपके स्थान के साथ हमें सचेत करता है। किसी को चोट पहुँचा सकने वाली बात के लिए चैट के जवाब का इंतज़ार न करें।',
      mr: 'लिफ्ट वापरणे थांबवा. सेवा विनंत्या उघडा आणि वरचे आणीबाणी कार्ड वापरा: ते आम्हाला कॉल करते, किंवा एका टॅपमध्ये तुमच्या स्थानासह आम्हाला सावध करते. कोणाला इजा होऊ शकेल अशा गोष्टीसाठी चॅटच्या उत्तराची वाट पाहू नका.',
    },
  },
  {
    id: 'ha-7', category: 'documents', roles: ['customer'], routes: ['/vault'], reviewedDaysAgo: 50,
    title: { en: 'Finding your contract, invoices and warranty', hi: 'अपना अनुबंध, चालान और वारंटी ढूँढना', mr: 'तुमचा करार, बिले आणि वॉरंटी शोधणे' },
    body: {
      en: 'Open Documents. Your quotation, agreement, invoices, receipts, certificates and warranty are kept there, newest first. A later version never replaces an earlier one: the earlier one stays, marked as replaced. You can download one document or all of them.',
      hi: 'दस्तावेज़ खोलें। आपका कोटेशन, अनुबंध, चालान, रसीदें, प्रमाणपत्र और वारंटी वहीं रखे हैं, नए पहले। बाद का संस्करण पहले वाले को कभी नहीं बदलता: पहले वाला बदला हुआ चिह्नित होकर रहता है। आप एक दस्तावेज़ या सभी डाउनलोड कर सकते हैं।',
      mr: 'दस्तावेज उघडा. तुमचे कोटेशन, करार, बिले, पावत्या, प्रमाणपत्रे आणि वॉरंटी तिथे ठेवलेली आहेत, नवीन आधी. नंतरची आवृत्ती आधीची कधीही बदलत नाही: आधीची बदलली गेल्याची खूण घेऊन राहते. तुम्ही एक दस्तावेज किंवा सर्व डाउनलोड करू शकता.',
    },
  },
  {
    id: 'ha-8', category: 'leads_quotes', roles: ['surveyor'], routes: ['/surveyor/capture', '/surveyor/leads'], reviewedDaysAgo: 35,
    title: { en: 'Capturing a lead on site', hi: 'साइट पर लीड दर्ज करना', mr: 'साइटवर लीड नोंदवणे' },
    body: {
      en: 'Tap Capture, add the contact and the building details, then confirm. The app checks the phone number against leads already on record, so the same customer is not entered twice: the first person to capture a lead keeps it. A lead you captured appears under My leads.',
      hi: 'कैप्चर पर टैप करें, संपर्क और इमारत का विवरण जोड़ें, फिर पुष्टि करें। ऐप फ़ोन नंबर को पहले से दर्ज लीड से मिलाता है, ताकि एक ही ग्राहक दो बार दर्ज न हो: जो पहले लीड दर्ज करता है उसी की रहती है। आपकी दर्ज की हुई लीड मेरी लीड्स में दिखती है।',
      mr: 'कॅप्चर वर टॅप करा, संपर्क आणि इमारतीचा तपशील भरा, मग खात्री करा. अॅप फोन नंबर आधीच नोंदवलेल्या लीड्सशी तपासते, म्हणजे एकच ग्राहक दोनदा नोंदवला जात नाही: लीड जो आधी नोंदवतो त्याचीच राहते. तुम्ही नोंदवलेली लीड माझ्या लीड्समध्ये दिसते.',
    },
  },
  {
    id: 'ha-9', category: 'earnings', roles: ['surveyor'], routes: ['/surveyor/earnings'], reviewedDaysAgo: 45,
    title: { en: 'How your commission is worked out and when it is paid', hi: 'आपका कमीशन कैसे तय होता है और कब मिलता है', mr: 'तुमचे कमिशन कसे ठरते आणि कधी मिळते' },
    body: {
      en: 'Open Earnings. Money you have earned but that is not final yet is shown as a forecast, kept apart from what is final. Final amounts go through a check and are then paid in the weekly run. Each amount shows the rule it was worked out under; if something looks wrong, use Something looks wrong on that amount.',
      hi: 'कमाई खोलें। जो पैसा आपने कमाया है पर अभी अंतिम नहीं है, वह अनुमान के रूप में अलग दिखता है। अंतिम राशियाँ जाँच से गुज़रकर साप्ताहिक भुगतान में दी जाती हैं। हर राशि उस नियम के साथ दिखती है जिसके तहत वह तय हुई; कुछ गलत लगे तो उस राशि पर कुछ गलत लग रहा है का उपयोग करें।',
      mr: 'कमाई उघडा. तुम्ही कमावलेले पण अजून अंतिम नसलेले पैसे अंदाज म्हणून वेगळे दिसतात. अंतिम रकमा तपासणीतून जाऊन साप्ताहिक रनमध्ये दिल्या जातात. प्रत्येक रक्कम ज्या नियमाखाली ठरली तो दाखवते; काही चुकीचे वाटले तर त्या रकमेवर काहीतरी चुकले आहे वापरा.',
    },
  },
  {
    id: 'ha-10', category: 'projects', roles: ['technician'], routes: ['/technician'], reviewedDaysAgo: 30,
    title: { en: 'Starting a job: check in, steps and photos', hi: 'काम शुरू करना: चेक-इन, चरण और फ़ोटो', mr: 'काम सुरू करणे: चेक-इन, टप्पे आणि फोटो' },
    body: {
      en: 'Open the job from your home screen and check in when you arrive. Work through the steps in the order the site allows; each step that needs proof asks for its photos. Everything you do is saved on the phone first, so you can keep working without signal and it is sent when the signal returns.',
      hi: 'अपनी होम स्क्रीन से काम खोलें और पहुँचने पर चेक-इन करें। साइट जितना अनुमति दे, उस क्रम में चरण पूरे करें; प्रमाण चाहिए वाले चरण अपनी फ़ोटो माँगते हैं। आप जो भी करते हैं वह पहले फ़ोन में सहेजा जाता है, इसलिए बिना सिग्नल के काम चलता रहता है और सिग्नल लौटने पर भेज दिया जाता है।',
      mr: 'तुमच्या होम स्क्रीनवरून काम उघडा आणि पोहोचल्यावर चेक-इन करा. साइट जितकी परवानगी देते त्या क्रमाने टप्पे पूर्ण करा; पुरावा लागणारा प्रत्येक टप्पा त्याचे फोटो मागतो. तुम्ही जे करता ते आधी फोनमध्ये जतन होते, त्यामुळे सिग्नलशिवाय काम चालू राहते आणि सिग्नल परतल्यावर पाठवले जाते.',
    },
  },
  {
    id: 'ha-11', category: 'projects', roles: ['technician'], routes: ['/job-issues'], reviewedDaysAgo: 20,
    title: { en: 'Reporting a problem or a safety concern on a job', hi: 'काम पर किसी समस्या या सुरक्षा चिंता की रिपोर्ट करना', mr: 'कामावरील समस्या किंवा सुरक्षेची चिंता कळवणे' },
    body: {
      en: 'Use Report a problem on the job. A safety concern can never be filed as minor, and it stops the job until the office has dealt with it. If you cannot get signal, the report waits on the phone and the screen shows a number to call. If you are in danger, use the SOS button first.',
      hi: 'काम पर समस्या की रिपोर्ट करें का उपयोग करें। सुरक्षा की चिंता कभी मामूली के रूप में दर्ज नहीं हो सकती, और जब तक कार्यालय उसे सुलझा न ले, काम रुक जाता है। सिग्नल न मिले तो रिपोर्ट फ़ोन में रुकी रहती है और स्क्रीन कॉल करने का नंबर दिखाती है। खतरे में हों तो पहले SOS बटन दबाएँ।',
      mr: 'कामावर समस्या कळवा वापरा. सुरक्षेची चिंता कधीही किरकोळ म्हणून नोंदवता येत नाही, आणि कार्यालयाने ती हाताळेपर्यंत काम थांबते. सिग्नल मिळाला नाही तर रिपोर्ट फोनमध्ये थांबतो आणि स्क्रीन कॉल करण्याचा नंबर दाखवते. धोक्यात असाल तर आधी SOS बटण दाबा.',
    },
  },
  {
    id: 'ha-12', category: 'orders', roles: ['supplier'], routes: ['/orders'], reviewedDaysAgo: 40,
    title: { en: 'Acknowledging and updating an order', hi: 'ऑर्डर स्वीकार करना और अपडेट करना', mr: 'ऑर्डर मान्य करणे आणि अपडेट करणे' },
    body: {
      en: 'Open Orders. Acknowledge a new order so AIEC knows you have it, then move each line forward as it is made, packed and sent. If a line cannot meet its date, say so early in the order thread rather than letting the date pass.',
      hi: 'ऑर्डर खोलें। नई ऑर्डर स्वीकार करें ताकि AIEC को पता चले कि आपके पास है, फिर हर पंक्ति को बनने, पैक होने और भेजे जाने के साथ आगे बढ़ाएँ। कोई पंक्ति अपनी तारीख पर पूरी न हो सके तो तारीख निकलने देने के बजाय ऑर्डर थ्रेड में जल्दी बताएँ।',
      mr: 'ऑर्डर्स उघडा. नवीन ऑर्डर मान्य करा म्हणजे AIEC ला कळते की ती तुमच्याकडे आहे, मग प्रत्येक ओळ तयार होताना, पॅक होताना आणि पाठवली जाताना पुढे न्या. एखादी ओळ तिच्या तारखेला पूर्ण होऊ शकत नसेल तर तारीख जाऊ देण्याऐवजी ऑर्डर थ्रेडमध्ये लवकर सांगा.',
    },
  },
  {
    id: 'ha-13', category: 'orders', roles: ['supplier'], routes: ['/supplier-invoices', '/supplier-payment-history'], reviewedDaysAgo: 55,
    title: { en: 'Sending an invoice, and why a payment may be held', hi: 'चालान भेजना, और भुगतान क्यों रोका जा सकता है', mr: 'बिल पाठवणे, आणि पेमेंट का थांबवले जाऊ शकते' },
    body: {
      en: 'Send your invoice from Invoices once the delivery has been confirmed. It is checked line by line against the order and what was accepted on delivery. A payment is held when the invoice does not match, or when a report or dispute on the order is still open. The reason is shown, and you can ask about any payment from Payments.',
      hi: 'डिलीवरी की पुष्टि होने के बाद चालान से अपना चालान भेजें। उसे पंक्ति-दर-पंक्ति ऑर्डर और डिलीवरी पर स्वीकार की गई मात्रा से मिलाया जाता है। चालान न मिलने पर, या ऑर्डर पर कोई रिपोर्ट या विवाद खुला हो तो भुगतान रोका जाता है। कारण दिखाया जाता है, और आप भुगतान से किसी भी भुगतान के बारे में पूछ सकते हैं।',
      mr: 'डिलिव्हरीची खात्री झाल्यावर बिले मधून तुमचे बिल पाठवा. ते ओळीनुसार ऑर्डर आणि डिलिव्हरीवर स्वीकारलेल्या प्रमाणाशी तपासले जाते. बिल जुळत नसेल, किंवा ऑर्डरवरील रिपोर्ट किंवा वाद खुला असेल तेव्हा पेमेंट थांबवले जाते. कारण दाखवले जाते, आणि तुम्ही पेमेंट्स मधून कोणत्याही पेमेंटबद्दल विचारू शकता.',
    },
  },
  {
    id: 'ha-14', category: 'training', roles: ['surveyor', 'technician', 'supplier'], routes: ['/training'], reviewedDaysAgo: 30,
    title: { en: 'Training, tests and certificates', hi: 'प्रशिक्षण, परीक्षाएँ और प्रमाणपत्र', mr: 'प्रशिक्षण, चाचण्या आणि प्रमाणपत्रे' },
    body: {
      en: 'Open Training to see what is required for your role. Finish the lessons, then take the test; passing it earns your certificate. Some training must be current before you can be given new jobs, and a certificate can end, so renew it in good time.',
      hi: 'अपनी भूमिका के लिए क्या आवश्यक है यह देखने के लिए प्रशिक्षण खोलें। पाठ पूरे करें, फिर परीक्षा दें; पास होने पर आपका प्रमाणपत्र मिलता है। कुछ प्रशिक्षण नए काम मिलने से पहले चालू होना ज़रूरी है, और प्रमाणपत्र समाप्त हो सकता है, इसलिए समय पर नवीनीकृत करें।',
      mr: 'तुमच्या भूमिकेसाठी काय आवश्यक आहे ते पाहण्यासाठी प्रशिक्षण उघडा. धडे पूर्ण करा, मग चाचणी द्या; उत्तीर्ण झाल्यावर तुम्हाला प्रमाणपत्र मिळते. काही प्रशिक्षण नवीन काम मिळण्यापूर्वी चालू असणे आवश्यक आहे, आणि प्रमाणपत्र संपू शकते, म्हणून वेळेत नूतनीकरण करा.',
    },
  },
  {
    id: 'ha-15', category: 'admin', roles: ['admin'], routes: ['/admin/alerts'], reviewedDaysAgo: 25,
    title: { en: 'What to do with an alert', hi: 'किसी अलर्ट का क्या करें', mr: 'अलर्टचे काय करावे' },
    body: {
      en: 'Open Alerts and start with the red ones: only genuine errors and safety matters use that colour. Acknowledge an alert to say you have it; it is resolved when the cause is dealt with. An alert nobody acknowledges climbs the escalation chain, so acknowledge or hand it to your backup.',
      hi: 'अलर्ट खोलें और लाल वालों से शुरू करें: केवल वास्तविक त्रुटियाँ और सुरक्षा के मामले उस रंग का उपयोग करते हैं। यह बताने के लिए कि आपने देख लिया, अलर्ट स्वीकार करें; कारण सुलझने पर वह हल हो जाता है। जिस अलर्ट को कोई स्वीकार न करे वह एस्केलेशन श्रृंखला में ऊपर चढ़ता है, इसलिए स्वीकार करें या अपने बैकअप को दें।',
      mr: 'अलर्ट्स उघडा आणि लाल असलेल्यांपासून सुरुवात करा: फक्त खऱ्या चुका आणि सुरक्षेच्या बाबी तो रंग वापरतात. तुम्हाला ते मिळाले असे सांगण्यासाठी अलर्ट मान्य करा; कारण हाताळल्यावर तो निकाली निघतो. कोणीही मान्य न केलेला अलर्ट एस्कलेशन साखळीत वर चढतो, म्हणून मान्य करा किंवा तुमच्या बॅकअपकडे द्या.',
    },
  },
  {
    id: 'ha-16', category: 'admin', roles: ['admin'], routes: ['/access-control', '/security'], reviewedDaysAgo: 210,
    title: { en: 'Giving someone access to a screen, and keeping accounts safe', hi: 'किसी को स्क्रीन की पहुँच देना, और खाते सुरक्षित रखना', mr: 'कोणाला स्क्रीनचा प्रवेश देणे, आणि खाती सुरक्षित ठेवणे' },
    body: {
      en: 'Open Access control to see what each role can open. A change for one person needs a reason and is watched; an exception with no end is looked at again every 90 days. Use Security to see who is signed in where, end a session, or lock an account whose phone was lost.',
      hi: 'हर भूमिका क्या खोल सकती है यह देखने के लिए पहुँच नियंत्रण खोलें। एक व्यक्ति के लिए बदलाव में कारण चाहिए और उस पर नज़र रखी जाती है; बिना अंत वाला अपवाद हर 90 दिन में फिर देखा जाता है। कौन कहाँ साइन इन है यह देखने, सत्र समाप्त करने, या जिसका फ़ोन खो गया उस खाते को लॉक करने के लिए सुरक्षा का उपयोग करें।',
      mr: 'प्रत्येक भूमिका काय उघडू शकते ते पाहण्यासाठी प्रवेश नियंत्रण उघडा. एका व्यक्तीसाठीच्या बदलाला कारण लागते आणि त्यावर लक्ष ठेवले जाते; शेवट नसलेला अपवाद दर 90 दिवसांनी पुन्हा पाहिला जातो. कोण कुठे साइन इन आहे ते पाहण्यासाठी, सत्र संपवण्यासाठी किंवा ज्याचा फोन हरवला त्याचे खाते लॉक करण्यासाठी सुरक्षा वापरा.',
    },
  },
];
