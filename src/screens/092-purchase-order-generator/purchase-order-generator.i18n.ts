import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    purchaseOrderGenerator: {
      title: 'Purchase Orders',
      loading: 'Loading purchase orders',
      error: { title: 'Could not load purchase orders', body: 'Check your connection and try again.' },
      notReady: { title: 'No purchase order yet', body: 'This deal hasn\'t closed yet, or no eligible supplier could be matched — purchase orders draft automatically once it closes.' },
      empty: { title: 'No purchase order yet', body: 'Purchase orders draft automatically once this deal closes.' },
      hold: {
        automation_off: { title: 'Automatic PO drafting is off', body: 'Auto-PO rules have automatic drafting switched off, so this won deal is waiting for you. Draft now, or switch it back on in Auto-PO rules.' },
        awaiting_first_payment: { title: 'Waiting for the first payment', body: 'Auto-PO rules draft purchase orders once the advance payment clears, to limit exposure before the customer has paid. You can still draft now.' },
        draftNow: 'Draft now',
      },
      rulesLink: 'Why these suppliers? Auto-PO rules',

      status: {
        triggered: 'Triggered',
        failed: 'Failed',
        draft: 'Draft',
        pending_approval: 'Pending approval',
        approved: 'Approved',
        sent: 'Sent',
      },

      po: {
        supplierLabel: 'Supplier',
        notEligible: 'This supplier isn\'t currently KYC-approved and active — this PO can\'t be sent until that\'s resolved in the Supplier Directory.',
        agreementBlocked: 'No supplier agreement is in force (none on file, or it has lapsed). This PO can’t be sent until one is recorded or renewed.',
        viewAgreement: 'Open agreement',
        reassign: 'Reassign supplier',
        deliveryLabel: 'Expected delivery date',
        totalLabel: 'Total',
        approvalNeeded: 'One or more prices are outside the approval-free tolerance — approve pricing before sending.',
        approvalOverValue: 'This order is over the approval value set in Auto-PO rules — approve it before sending.',
        approvePricing: 'Approve pricing',
        send: 'Send to supplier',
        sentNote: 'Sent by {{by}}',
        track: 'Track this order',
      },

      line: {
        quantityLabel: 'Quantity',
        catalogPriceLabel: 'Catalog price at draft',
        agreedPriceLabel: 'Agreed unit price',
        priceChanged: 'Supplier\'s current catalog price is now {{price}} — this affects the deal\'s realized margin even though the customer\'s price is fixed.',
        whyAssigned: 'Chosen: the deal’s assigned supplier.',
        whyBest: 'Chosen: best match, score {{score}} (next: {{next}}, {{nextScore}}).',
        whyOnly: 'Chosen: the only eligible supplier listing this part.',
        driveTypeFallback: 'No listing fits this deal’s drive type — check this part before sending.',
      },

      reassignSheet: {
        title: 'Reassign supplier',
        hint: 'Every line re-prices from the new supplier\'s own current catalog — the old prices aren\'t carried over.',
        supplierLabel: 'New supplier',
        submit: 'Confirm reassignment',
      },

      toast: {
        lineUpdated: 'Line updated',
        reassigned: 'Supplier reassigned',
        deliverySet: 'Delivery date set',
        approved: 'Pricing approved',
        sent: 'Purchase order sent',
        drafted: 'Purchase orders drafted',
        error: 'Something went wrong',
      },
    },
  },
  hi: {
    purchaseOrderGenerator: {
      title: 'खरीद आदेश',
      loading: 'खरीद आदेश लोड हो रहे हैं',
      error: { title: 'खरीद आदेश लोड नहीं हो सके', body: 'अपना कनेक्शन जांचें और फिर से प्रयास करें।' },
      notReady: { title: 'अभी तक कोई खरीद आदेश नहीं', body: 'यह डील अभी बंद नहीं हुई है, या कोई पात्र सप्लायर मेल नहीं खाया — डील बंद होते ही खरीद आदेश अपने आप ड्राफ्ट हो जाते हैं।' },
      empty: { title: 'अभी तक कोई खरीद आदेश नहीं', body: 'यह डील बंद होते ही खरीद आदेश अपने आप ड्राफ्ट हो जाते हैं।' },
      hold: {
        automation_off: { title: 'स्वचालित PO ड्राफ्टिंग बंद है', body: 'ऑटो-PO नियमों में स्वचालित ड्राफ्टिंग बंद है, इसलिए यह जीती गई डील आपका इंतज़ार कर रही है। अभी ड्राफ्ट करें, या ऑटो-PO नियमों में इसे फिर चालू करें।' },
        awaiting_first_payment: { title: 'पहले भुगतान का इंतज़ार', body: 'ग्राहक के भुगतान से पहले जोखिम सीमित रखने के लिए ऑटो-PO नियम एडवांस भुगतान मिलने के बाद खरीद आदेश ड्राफ्ट करते हैं। आप अभी भी ड्राफ्ट कर सकते हैं।' },
        draftNow: 'अभी ड्राफ्ट करें',
      },
      rulesLink: 'ये सप्लायर क्यों? ऑटो-PO नियम',

      status: {
        triggered: 'ट्रिगर हुआ',
        failed: 'विफल',
        draft: 'ड्राफ्ट',
        pending_approval: 'अनुमोदन लंबित',
        approved: 'स्वीकृत',
        sent: 'भेजा गया',
      },

      po: {
        supplierLabel: 'सप्लायर',
        notEligible: 'यह सप्लायर अभी KYC-स्वीकृत और सक्रिय नहीं है — जब तक सप्लायर निर्देशिका में यह हल नहीं होता, यह खरीद आदेश भेजा नहीं जा सकता।',
        agreementBlocked: 'कोई सप्लायर अनुबंध लागू नहीं है (रिकॉर्ड में नहीं, या समाप्त हो गया)। अनुबंध दर्ज या नवीनीकृत होने तक यह PO नहीं भेजा जा सकता।',
        viewAgreement: 'अनुबंध खोलें',
        reassign: 'सप्लायर बदलें',
        deliveryLabel: 'अपेक्षित डिलीवरी तिथि',
        totalLabel: 'कुल',
        approvalNeeded: 'एक या अधिक कीमतें बिना-अनुमोदन सीमा से बाहर हैं — भेजने से पहले मूल्य निर्धारण स्वीकृत करें।',
        approvalOverValue: 'यह ऑर्डर ऑटो-PO नियमों में तय अनुमोदन मूल्य से ज़्यादा है — भेजने से पहले इसे स्वीकृत करें।',
        approvePricing: 'मूल्य निर्धारण स्वीकृत करें',
        send: 'सप्लायर को भेजें',
        sentNote: '{{by}} द्वारा भेजा गया',
        track: 'यह ऑर्डर ट्रैक करें',
      },

      line: {
        quantityLabel: 'मात्रा',
        catalogPriceLabel: 'ड्राफ्ट के समय कैटलॉग मूल्य',
        agreedPriceLabel: 'सहमत यूनिट मूल्य',
        priceChanged: 'सप्लायर का वर्तमान कैटलॉग मूल्य अब {{price}} है — ग्राहक की कीमत तय होने के बावजूद यह डील के वास्तविक मार्जिन को प्रभावित करता है।',
        whyAssigned: 'चुना गया: डील का तय सप्लायर।',
        whyBest: 'चुना गया: सबसे अच्छा मेल, स्कोर {{score}} (अगला: {{next}}, {{nextScore}})।',
        whyOnly: 'चुना गया: यह पार्ट सूचीबद्ध करने वाला एकमात्र योग्य सप्लायर।',
        driveTypeFallback: 'इस डील के ड्राइव प्रकार के लिए कोई लिस्टिंग नहीं — भेजने से पहले यह पार्ट जाँचें।',
      },

      reassignSheet: {
        title: 'सप्लायर बदलें',
        hint: 'हर लाइन नए सप्लायर के वर्तमान कैटलॉग से फिर से कीमत तय करती है — पुरानी कीमतें आगे नहीं बढ़ाई जातीं।',
        supplierLabel: 'नया सप्लायर',
        submit: 'बदलाव की पुष्टि करें',
      },

      toast: {
        lineUpdated: 'लाइन अपडेट हुई',
        reassigned: 'सप्लायर बदला गया',
        deliverySet: 'डिलीवरी तिथि सेट हुई',
        approved: 'मूल्य निर्धारण स्वीकृत हुआ',
        sent: 'खरीद आदेश भेजा गया',
        drafted: 'खरीद आदेश ड्राफ्ट किए गए',
        error: 'कुछ गलत हो गया',
      },
    },
  },
  mr: {
    purchaseOrderGenerator: {
      title: 'खरेदी ऑर्डर',
      loading: 'खरेदी ऑर्डर लोड होत आहेत',
      error: { title: 'खरेदी ऑर्डर लोड होऊ शकले नाहीत', body: 'तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.' },
      notReady: { title: 'अजून कोणताही खरेदी ऑर्डर नाही', body: 'ही डील अजून बंद झालेली नाही, किंवा कोणताही पात्र सप्लायर जुळला नाही — डील बंद होताच खरेदी ऑर्डर आपोआप तयार होतात.' },
      empty: { title: 'अजून कोणताही खरेदी ऑर्डर नाही', body: 'ही डील बंद होताच खरेदी ऑर्डर आपोआप तयार होतात.' },
      hold: {
        automation_off: { title: 'स्वयंचलित PO मसुदा बंद आहे', body: 'ऑटो-PO नियमांमध्ये स्वयंचलित मसुदा बंद आहे, त्यामुळे ही जिंकलेली डील तुमची वाट पाहत आहे. आता मसुदा तयार करा, किंवा ऑटो-PO नियमांमध्ये ते पुन्हा सुरू करा.' },
        awaiting_first_payment: { title: 'पहिल्या पेमेंटची प्रतीक्षा', body: 'ग्राहकाने पैसे भरण्यापूर्वीची जोखीम मर्यादित ठेवण्यासाठी ऑटो-PO नियम अ‍ॅडव्हान्स पेमेंट मिळाल्यावर खरेदी ऑर्डरचा मसुदा तयार करतात. तुम्ही तरीही आता मसुदा तयार करू शकता.' },
        draftNow: 'आता मसुदा तयार करा',
      },
      rulesLink: 'हे सप्लायर का? ऑटो-PO नियम',

      status: {
        triggered: 'ट्रिगर झाले',
        failed: 'अयशस्वी',
        draft: 'मसुदा',
        pending_approval: 'मंजुरी प्रलंबित',
        approved: 'मंजूर',
        sent: 'पाठवले',
      },

      po: {
        supplierLabel: 'सप्लायर',
        notEligible: 'हा सप्लायर सध्या KYC-मंजूर आणि सक्रिय नाही — सप्लायर निर्देशिकेत हे सोडवले जाईपर्यंत हा खरेदी ऑर्डर पाठवता येणार नाही.',
        agreementBlocked: 'कोणताही पुरवठादार करार लागू नाही (नोंदीत नाही, किंवा संपला आहे). करार नोंदवला किंवा नूतनीकृत होईपर्यंत हा PO पाठवता येणार नाही.',
        viewAgreement: 'करार उघडा',
        reassign: 'सप्लायर बदला',
        deliveryLabel: 'अपेक्षित डिलिव्हरी तारीख',
        totalLabel: 'एकूण',
        approvalNeeded: 'एक किंवा अधिक किंमती विना-मंजुरी मर्यादेबाहेर आहेत — पाठवण्यापूर्वी किंमत मंजूर करा.',
        approvalOverValue: 'हा ऑर्डर ऑटो-PO नियमांतील मंजुरी मूल्यापेक्षा जास्त आहे — पाठवण्यापूर्वी तो मंजूर करा.',
        approvePricing: 'किंमत मंजूर करा',
        send: 'सप्लायरला पाठवा',
        sentNote: '{{by}} यांनी पाठवले',
        track: 'हा ऑर्डर ट्रॅक करा',
      },

      line: {
        quantityLabel: 'प्रमाण',
        catalogPriceLabel: 'मसुदा तयार करतानाची कॅटलॉग किंमत',
        agreedPriceLabel: 'मान्य केलेली युनिट किंमत',
        priceChanged: 'सप्लायरची सध्याची कॅटलॉग किंमत आता {{price}} आहे — ग्राहकाची किंमत निश्चित असूनही याचा डीलच्या प्रत्यक्ष मार्जिनवर परिणाम होतो.',
        whyAssigned: 'निवडले: डीलचा ठरलेला सप्लायर.',
        whyBest: 'निवडले: सर्वोत्तम जुळणी, गुण {{score}} (पुढचा: {{next}}, {{nextScore}}).',
        whyOnly: 'निवडले: हा पार्ट सूचीबद्ध करणारा एकमेव पात्र सप्लायर.',
        driveTypeFallback: 'या डीलच्या ड्राइव्ह प्रकारासाठी कोणतीही लिस्टिंग नाही — पाठवण्यापूर्वी हा पार्ट तपासा.',
      },

      reassignSheet: {
        title: 'सप्लायर बदला',
        hint: 'प्रत्येक ओळ नवीन सप्लायरच्या सध्याच्या कॅटलॉगवरून पुन्हा किंमत ठरवते — जुन्या किंमती पुढे नेल्या जात नाहीत.',
        supplierLabel: 'नवीन सप्लायर',
        submit: 'बदलाची पुष्टी करा',
      },

      toast: {
        lineUpdated: 'ओळ अद्ययावत केली',
        reassigned: 'सप्लायर बदलला',
        deliverySet: 'डिलिव्हरी तारीख सेट केली',
        approved: 'किंमत मंजूर केली',
        sent: 'खरेदी ऑर्डर पाठवला',
        drafted: 'खरेदी ऑर्डरचा मसुदा तयार झाला',
        error: 'काहीतरी चुकले',
      },
    },
  },
};

export default translations;
