import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDate, formatINR, useToast } from '@/design-system';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { VaultDocRow, VaultDocument, VaultValue, VaultView } from '@/data/repository';
import { bundleHtml, documentHtml, fileNameOf } from '@/features/documents/vault';
import type { HtmlDocument, VaultKind } from '@/features/documents/vault';
import { DOCUMENT_KEYS as K, POLL_MS, readTokens, viewKey } from './document-vault.types';

export type DocumentVaultState = ReturnType<typeof useDocumentVault>;
type T = ReturnType<typeof useTranslation>['t'];

/** A value on a document in the reader's language: the repository hands back numbers, dates and keys, and this is the only place they become words. */
export function valueText(t: T, lang: string, v: VaultValue): string {
  switch (v.t) {
    case 'text': return v.v;
    case 'money': return formatINR(v.v);
    case 'date': return formatDate(v.v, lang);
    case 'num': return String(v.v);
    case 'key': return t(v.k);
  }
}
/** "Invoice", "Corrected invoice", "Service plan (AMC)": the kind, made specific by an invoice's type. */
export function titleOf(t: T, row: Pick<VaultDocRow, 'kind' | 'subKind'>): string {
  if (row.kind === 'invoice' && row.subKind) return t(`documentVault.invoiceType.${row.subKind}`);
  return t(`documentVault.kind.${row.kind}`);
}
const blobOf = (html: string) => new Blob([html], { type: 'text/html;charset=utf-8' });
function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Screen 173. The vault keeps nothing of its own: one read of the documents the records behind it issued, the last good list kept on the phone, and files built on the device. */
export function useDocumentVault() {
  const repository = useData();
  const { user } = useSession();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const kind = (params.get('kind') ?? '') as VaultKind | '';
  const project = params.get('p') ?? '';
  const earlier = params.get('old') === '1';
  const docId = params.get('doc') ?? '';
  const [q, setQ] = useState('');
  const [view, setView] = useState<VaultView | null>(() => {
    if (!user) return null;
    try { const v = JSON.parse(localStorage.getItem(viewKey(user.id)) ?? 'null'); return v && Array.isArray(v.rows) ? (v as VaultView) : null; } catch { return null; }
  });
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>(view ? 'ready' : 'loading');
  const [offline, setOffline] = useState(false);
  const [detail, setDetail] = useState<{ state: 'loading' | 'ready' | 'missing'; doc: VaultDocument | null }>({ state: 'loading', doc: null });
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  const seq = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    const mine = ++seq.current;
    try {
      const v = await repository.getDocumentVault(user.id);
      if (!alive.current || mine !== seq.current) return;
      setView(v); setLoad('ready'); setOffline(false);
      try { localStorage.setItem(viewKey(user.id), JSON.stringify(v)); } catch { /* the phone may refuse; the screen still works */ }
    } catch {
      if (alive.current && mine === seq.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); }
    }
  }, [repository, user]);
  useEffect(() => { void read(); const id = window.setInterval(() => void read(), POLL_MS); const onShow = () => { if (document.visibilityState === 'visible') void read(); }; document.addEventListener('visibilitychange', onShow); return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); }; }, [read]);

  useEffect(() => {
    if (!docId || !user) return;
    let on = true;
    setDetail({ state: 'loading', doc: null });
    repository.getVaultDocument(docId, user.id).then((d) => { if (on) setDetail({ state: 'ready', doc: d }); }, () => { if (on) setDetail({ state: 'missing', doc: null }); });
    return () => { on = false; };
  }, [repository, user, docId]);

  const patch = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  const lang = i18n.language;

  const matches = useCallback((r: VaultDocRow) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return [titleOf(t, r), t(`documentVault.kind.${r.kind}`), r.code ?? '', r.siteName, r.dealCode].some((x) => x.toLowerCase().includes(needle));
  }, [q, t]);

  /** Everything the filters leave, grouped so a replaced document sits under the one that replaced it. */
  const shown = useMemo(() => {
    const rows = (view?.rows ?? []).filter((r) => (!kind || r.kind === kind) && (!project || r.dealId === project) && matches(r));
    const current = rows.filter((r) => r.status !== 'superseded');
    const old = rows.filter((r) => r.status === 'superseded');
    const chains = (c: VaultDocRow) => old.filter((o) => o.chainId === c.chainId).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
    return { current, chains, hiddenOnly: current.length === 0 && old.length > 0, total: rows.length };
  }, [view, kind, project, matches]);
  /** What the filters other than the search leave, for the "nothing yet" versus "nothing matches" difference. */
  const filtered = !!(kind || project || q.trim());

  const htmlOf = useCallback((d: VaultDocument): HtmlDocument => {
    const r = d.row;
    return {
      title: titleOf(t, r), number: r.code ?? '', issued: formatDate(r.issuedAt, lang), status: t(`documentVault.status.${r.status}`), project: `${r.siteName} · ${r.dealCode}`,
      validity: r.validity ? t(`documentVault.validity.${r.validity.kind}`, { date: r.validity.until ? formatDate(r.validity.until, lang) : '' }) : null,
      sections: d.sections.map((s) => ({ heading: t(s.headingKey), fields: s.fields.map((f) => ({ label: t(f.labelKey), value: valueText(t, lang, f.value) })) })),
      note: t(K.exactly),
    };
  }, [t, lang]);

  const fail = () => toast.push(t(K.toast.failed), 'error');
  const download = async (id: string) => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const d = await repository.getVaultDocument(id, user.id);
      const h = htmlOf(d);
      save(blobOf(documentHtml(h, readTokens(), lang)), fileNameOf(d.row.kind, d.row.code, 'html'));
      toast.push(t(K.toast.downloaded), 'success');
    } catch { fail(); } finally { if (alive.current) setBusy(false); }
  };
  const downloadAll = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const docs = await repository.getVaultBundle(user.id);
      if (docs.length === 0) { toast.push(t(K.toast.nothing), 'accent'); return; }
      save(blobOf(bundleHtml(t(K.bundle.title), docs.map(htmlOf), readTokens(), lang)), 'aiec-documents.html');
      toast.push(t(K.toast.downloaded), 'success');
    } catch { fail(); } finally { if (alive.current) setBusy(false); }
  };
  const share = async (d: VaultDocument) => {
    const h = htmlOf(d);
    const text = `${h.title} ${h.number}`.trim() + ` · ${h.project}`;
    try {
      const file = new File([blobOf(documentHtml(h, readTokens(), lang))], fileNameOf(d.row.kind, d.row.code, 'html'), { type: 'text/html' });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: h.title, text }); toast.push(t(K.toast.shared), 'success'); return; }
      if (navigator.share) { await navigator.share({ title: h.title, text }); toast.push(t(K.toast.shared), 'success'); return; }
      await navigator.clipboard.writeText(text);
      toast.push(t(K.toast.copied), 'success');
    } catch (e) {
      if ((e as { name?: string })?.name !== 'AbortError') fail();
    }
  };

  return {
    load, view, offline, kind, project, earlier, docId, q, detail, busy, shown, filtered,
    refresh: read,
    setQ,
    setKind: (k: string) => patch((n) => { if (k) n.set('kind', k); else n.delete('kind'); }),
    setProject: (p: string) => patch((n) => { if (p) n.set('p', p); else n.delete('p'); }),
    setEarlier: (on: boolean) => patch((n) => { if (on) n.set('old', '1'); else n.delete('old'); }),
    open: (id: string) => patch((n) => { n.set('doc', id); }),
    closeDoc: () => patch((n) => { n.delete('doc'); }),
    clear: () => { setQ(''); patch((n) => { n.delete('kind'); n.delete('p'); }); },
    download, downloadAll, share,
    goTo: (path: string) => navigate(path),
  };
}
