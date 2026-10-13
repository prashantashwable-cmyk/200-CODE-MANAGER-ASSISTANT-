import type { ScreenTranslations } from '@/i18n/types';

const translations: ScreenTranslations = {
  en: {
    heatmap: {
      title: 'Lead density',
      subtitle: 'Where the work comes from, and where it actually turns into money.',
      loading: 'Building the heatmap',
      mapLabel: 'Heatmap of lead density by area',
      metric: { leads: 'Leads captured', deals: 'Deals closed' },
      range: { '7': 'Last 7 days', '30': 'Last 30 days', '90': 'Last 90 days' },
      normalisedNote:
        'Heat is per square kilometre, not raw count — otherwise a large quiet area would always look busier than a small dense one.',
      batchNote:
        'This is a planning view and refreshes daily rather than live. It reads the same lead records as every other screen.',
      ranking: 'Areas ranked by density',
      drillIn: 'See the leads',
      notEnoughData: 'Not enough data yet to colour honestly',
      noCoverage: 'No AIEC coverage in this window',
      conversionGap:
        'These areas produce plenty of leads but convert poorly: {{zones}}. Worth checking who covers them and what is going wrong after the survey.',
      column: {
        zone: 'Area',
        leads: 'Leads',
        deals: 'Closed',
        density: 'Per km²',
        conversion: 'Conversion',
        change: 'vs previous',
      },
      sheet: { title: 'Leads in {{zone}}', empty: 'No leads in this area for the selected window.' },
      empty: {
        title: 'No areas defined',
        body: 'Draw territories first — the heatmap groups leads by the areas you define.',
      },
      error: {
        title: 'Could not build the heatmap',
        body: 'We could not reach the lead data. Check your connection and try again.',
      },
    },
  },

  hi: {
    heatmap: {
      title: 'लीड घनत्व',
      subtitle: 'काम कहाँ से आता है, और कहाँ वह सचमुच पैसे में बदलता है।',
      loading: 'हीटमैप बन रहा है',
      mapLabel: 'इलाक़ों के हिसाब से लीड घनत्व का हीटमैप',
      metric: { leads: 'दर्ज लीड', deals: 'बंद सौदे' },
      range: { '7': 'पिछले 7 दिन', '30': 'पिछले 30 दिन', '90': 'पिछले 90 दिन' },
      normalisedNote:
        'गर्मी प्रति वर्ग किलोमीटर है, कुल गिनती नहीं — वरना बड़ा शांत इलाक़ा हमेशा छोटे घने इलाक़े से ज़्यादा व्यस्त दिखता।',
      batchNote:
        'यह योजना बनाने का दृश्य है और लाइव नहीं, रोज़ाना ताज़ा होता है। यह वही लीड रिकॉर्ड पढ़ता है जो बाक़ी हर स्क्रीन पढ़ती है।',
      ranking: 'घनत्व के हिसाब से इलाक़े',
      drillIn: 'लीड देखें',
      notEnoughData: 'ईमानदारी से रंग देने लायक डेटा अभी नहीं',
      noCoverage: 'इस अवधि में यहाँ AIEC का काम नहीं था',
      conversionGap:
        'इन इलाक़ों में लीड ख़ूब आते हैं पर सौदे कम बनते हैं: {{zones}}। देखिए इन्हें कौन देखता है और सर्वे के बाद क्या ग़लत हो रहा है।',
      column: {
        zone: 'इलाक़ा',
        leads: 'लीड',
        deals: 'बंद',
        density: 'प्रति वर्ग किमी',
        conversion: 'रूपांतरण',
        change: 'पिछली अवधि से',
      },
      sheet: { title: '{{zone}} के लीड', empty: 'चुनी हुई अवधि में इस इलाक़े में कोई लीड नहीं।' },
      empty: {
        title: 'कोई इलाक़ा तय नहीं',
        body: 'पहले इलाक़े बनाइए — हीटमैप आपके बनाए इलाक़ों के हिसाब से लीड जोड़ता है।',
      },
      error: {
        title: 'हीटमैप नहीं बन पाया',
        body: 'हम लीड डेटा तक नहीं पहुँच पाए। नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।',
      },
    },
  },

  mr: {
    heatmap: {
      title: 'लीड घनता',
      subtitle: 'काम कुठून येते, आणि कुठे ते खरोखर पैशात बदलते.',
      loading: 'हीटमॅप तयार होत आहे',
      mapLabel: 'भागानुसार लीड घनतेचा हीटमॅप',
      metric: { leads: 'नोंदवलेले लीड', deals: 'पूर्ण झालेले व्यवहार' },
      range: { '7': 'गेले ७ दिवस', '30': 'गेले ३० दिवस', '90': 'गेले ९० दिवस' },
      normalisedNote:
        'उष्णता प्रति चौरस किलोमीटर आहे, एकूण संख्या नाही — अन्यथा मोठा शांत भाग नेहमी लहान दाट भागापेक्षा जास्त गजबजलेला दिसला असता.',
      batchNote:
        'हे नियोजनाचे दृश्य आहे आणि थेट नाही, रोज ताजे होते. ते इतर प्रत्येक स्क्रीन वाचते तेच लीड रेकॉर्ड वाचते.',
      ranking: 'घनतेनुसार भाग',
      drillIn: 'लीड पहा',
      notEnoughData: 'प्रामाणिकपणे रंग देण्याइतकी माहिती अजून नाही',
      noCoverage: 'या कालावधीत इथे AIEC चे काम नव्हते',
      conversionGap:
        'या भागांत लीड भरपूर येतात पण व्यवहार कमी होतात: {{zones}}. हे कोण पाहतो आणि सर्वेक्षणानंतर काय चुकते ते तपासा.',
      column: {
        zone: 'भाग',
        leads: 'लीड',
        deals: 'पूर्ण',
        density: 'प्रति चौ. किमी',
        conversion: 'रूपांतर',
        change: 'मागील कालावधीशी',
      },
      sheet: { title: '{{zone}} मधील लीड', empty: 'निवडलेल्या कालावधीत या भागात एकही लीड नाही.' },
      empty: {
        title: 'कोणताही भाग ठरलेला नाही',
        body: 'आधी भाग आखा — हीटमॅप तुम्ही आखलेल्या भागांनुसार लीड एकत्र करतो.',
      },
      error: {
        title: 'हीटमॅप तयार होऊ शकला नाही',
        body: 'आम्ही लीड माहितीपर्यंत पोहोचू शकलो नाही. नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
