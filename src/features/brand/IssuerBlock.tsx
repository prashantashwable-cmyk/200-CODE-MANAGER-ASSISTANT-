import { useTranslation } from 'react-i18next';
import { displayName } from './brand';
import { useBrandAt } from './BrandProvider';

/** Who issued a formal document, exactly as AIEC's identity read on the day it was issued: the name, the registered address and the GSTIN, with the logo where there is one. */
export function IssuerBlock({ at, align = 'start' }: { at?: string | null; align?: 'start' | 'center' }) {
  const { t, i18n } = useTranslation();
  const b = useBrandAt(at ?? null);
  if (!b) return null;
  return (
    <div className="stack gap-1" data-issuer data-brand-version={b.version} style={{ textAlign: align }}>
      {b.logo && <img src={b.logo.dataUrl} alt={b.companyName} style={{ height: 36, width: 'auto', maxWidth: 160, objectFit: 'contain', alignSelf: align === 'center' ? 'center' : 'flex-start' }} />}
      <span className="t-sm t-semibold">{displayName(b, i18n.language)}</span>
      <span className="t-xs t-muted">{b.addressLine}</span>
      <span className="t-xs t-muted">{t('brand.issuer.gstin')}: <span className="num">{b.gstin}</span></span>
    </div>
  );
}
