import type { ScreenTranslations } from '@/i18n/types';

/**
 * Screen 066 owns the shared `quotation.reason.*` namespace — the
 * `createdReasonKey` values written by the repository whenever a new
 * quotation version is produced (a discount approval, an expired re-quote,
 * a restored old version).
 */
const translations: ScreenTranslations = {
  en: {
    quotation: {
      reason: {
        discountApproved: 'Discount approved',
        expiredRequote: 'Re-quoted after expiry',
        restored: 'Restored from an earlier version',
      },
    },
    quotationHistory: {
      title: 'Version history',
      subtitle: 'Every version of every quotation, oldest first — nothing is ever edited in place.',
      loading: 'Loading history',
      error: { title: 'Could not load version history', body: 'Check your connection and try again.' },
      empty: { title: 'No quotations yet', body: 'Once a quotation exists, its full version trail will appear here.' },
      lineageRow: { versions: '{{count}} version(s)' },
      versionCard: {
        current: 'Current',
        createdBy: 'v{{version}} — {{name}}',
        noChanges: 'No configuration change — internal record only.',
        restore: 'Restore as new version',
        delivery: 'Sent via {{channels}} on {{date}}',
        notSent: 'Never sent',
      },
      diff: {
        driveType: 'Drive type',
        finishTier: 'Finish',
        capacityPersons: 'Capacity',
        stopsCount: 'Stops',
        finalPrice: 'Price',
        validityDate: 'Valid until',
      },
      showAll: 'Show {{count}} earlier version(s)',
      toast: {
        restored: 'Restored as a new version',
        error: 'Could not restore — try again.',
      },
    },
  },

  hi: {
    quotation: {
      reason: {
        discountApproved: 'छूट स्वीकृत हुई',
        expiredRequote: 'समाप्ति के बाद फिर से कोटेशन',
        restored: 'पुराने वर्शन से पुनर्स्थापित',
      },
    },
    quotationHistory: {
      title: 'वर्शन इतिहास',
      subtitle: 'हर कोटेशन का हर वर्शन, सबसे पुराना पहले — कभी भी सीधे संपादित नहीं होता।',
      loading: 'इतिहास लोड हो रहा है',
      error: { title: 'वर्शन इतिहास लोड नहीं हो पाया', body: 'नेटवर्क जाँचिए और दोबारा कोशिश कीजिए।' },
      empty: { title: 'अभी कोई कोटेशन नहीं', body: 'कोटेशन बनते ही उसका पूरा वर्शन इतिहास यहाँ दिखेगा।' },
      lineageRow: { versions: '{{count}} वर्शन' },
      versionCard: {
        current: 'मौजूदा',
        createdBy: 'v{{version}} — {{name}}',
        noChanges: 'कोई कॉन्फ़िगरेशन बदलाव नहीं — केवल आंतरिक रिकॉर्ड।',
        restore: 'नए वर्शन के रूप में पुनर्स्थापित करें',
        delivery: '{{date}} को {{channels}} के ज़रिए भेजा गया',
        notSent: 'कभी नहीं भेजा गया',
      },
      diff: {
        driveType: 'ड्राइव प्रकार',
        finishTier: 'फ़िनिश',
        capacityPersons: 'क्षमता',
        stopsCount: 'स्टॉप',
        finalPrice: 'कीमत',
        validityDate: 'मान्य तक',
      },
      showAll: '{{count}} पुराने वर्शन दिखाएँ',
      toast: {
        restored: 'नए वर्शन के रूप में पुनर्स्थापित हुआ',
        error: 'पुनर्स्थापित नहीं किया जा सका — दोबारा कोशिश करें।',
      },
    },
  },

  mr: {
    quotation: {
      reason: {
        discountApproved: 'सूट मंजूर झाली',
        expiredRequote: 'मुदत संपल्यानंतर पुन्हा कोटेशन',
        restored: 'जुन्या आवृत्तीवरून पुनर्संचयित',
      },
    },
    quotationHistory: {
      title: 'आवृत्ती इतिहास',
      subtitle: 'प्रत्येक कोटेशनची प्रत्येक आवृत्ती, सर्वात जुनी आधी — कधीही थेट संपादित होत नाही.',
      loading: 'इतिहास लोड होत आहे',
      error: { title: 'आवृत्ती इतिहास लोड होऊ शकला नाही', body: 'नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.' },
      empty: { title: 'अजून कोणतेही कोटेशन नाही', body: 'कोटेशन तयार होताच त्याचा संपूर्ण आवृत्ती इतिहास इथे दिसेल.' },
      lineageRow: { versions: '{{count}} आवृत्ती' },
      versionCard: {
        current: 'सध्याची',
        createdBy: 'v{{version}} — {{name}}',
        noChanges: 'कोणताही कॉन्फिगरेशन बदल नाही — फक्त अंतर्गत नोंद.',
        restore: 'नवीन आवृत्ती म्हणून पुनर्संचयित करा',
        delivery: '{{date}} रोजी {{channels}} द्वारे पाठवले',
        notSent: 'कधीही पाठवले नाही',
      },
      diff: {
        driveType: 'ड्राइव्ह प्रकार',
        finishTier: 'फिनिश',
        capacityPersons: 'क्षमता',
        stopsCount: 'थांबे',
        finalPrice: 'किंमत',
        validityDate: 'वैध पर्यंत',
      },
      showAll: '{{count}} जुन्या आवृत्त्या दाखवा',
      toast: {
        restored: 'नवीन आवृत्ती म्हणून पुनर्संचयित झाले',
        error: 'पुनर्संचयित करता आले नाही — पुन्हा प्रयत्न करा.',
      },
    },
  },
};

export default translations;
