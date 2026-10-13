import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useData } from '@/data/DataProvider';
import type { BrandView } from '@/data/repository';
import { brandCss, displayName } from './brand';

/** Fired by the company-profile screen after a publish, so every open view picks the new brand up at once. */
export const BRAND_CHANGED = 'aiec:brand-changed';
const REFRESH_MS = 60_000;
const STYLE_ID = 'aiec-brand-tokens';

interface BrandContext { brand: BrandView | null; name: (lang: string) => string; refresh: () => void }
const Ctx = createContext<BrandContext>({ brand: null, name: () => '', refresh: () => undefined });

/**
 * The one place the brand reaches the app (191): the version in force now is read from the repository, its colour and heading-font choices are written as one override stylesheet
 * (the dark and instrument modes keep their own accents), and everything that shows the name or the logo reads it from here.
 */
export function BrandProvider({ children }: { children: ReactNode }) {
  const repository = useData();
  const [brand, setBrand] = useState<BrandView | null>(null);
  const read = useCallback(() => { void repository.getBrand().then(setBrand).catch(() => undefined); }, [repository]);
  useEffect(() => {
    read();
    const id = window.setInterval(read, REFRESH_MS);
    const onShow = () => { if (document.visibilityState === 'visible') read(); };
    document.addEventListener('visibilitychange', onShow);
    window.addEventListener(BRAND_CHANGED, read);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); window.removeEventListener(BRAND_CHANGED, read); };
  }, [read]);
  useEffect(() => {
    if (!brand) return;
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    const css = brandCss(brand.tokens);
    if (!css) { el?.remove(); return; }
    if (!el) { el = document.createElement('style'); el.id = STYLE_ID; document.head.appendChild(el); }
    el.textContent = css;
  }, [brand]);
  const value = useMemo<BrandContext>(() => ({ brand, name: (lang) => (brand ? displayName(brand, lang) : ''), refresh: read }), [brand, read]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useBrand = (): BrandContext => useContext(Ctx);

/** The brand as it stood on the day a document was issued (the current one while `at` is empty): what an old invoice or contract must keep showing. */
export function useBrandAt(at: string | null | undefined): BrandView | null {
  const repository = useData();
  const current = useBrand().brand;
  const [past, setPast] = useState<{ at: string; view: BrandView } | null>(null);
  useEffect(() => {
    if (!at) return;
    let live = true;
    void repository.getBrand(at).then((view) => { if (live) setPast({ at, view }); }).catch(() => undefined);
    return () => { live = false; };
  }, [repository, at]);
  return at ? (past && past.at === at ? past.view : null) : current;
}
