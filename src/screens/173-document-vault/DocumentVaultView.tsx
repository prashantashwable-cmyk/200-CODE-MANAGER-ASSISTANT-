import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, DownloadSimple, FileText, ShareNetwork } from '@phosphor-icons/react';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, formatDate } from '@/design-system';
import type { VaultDocRow, VaultDocument } from '@/data/repository';
import { DOCUMENT_KEYS as K, KIND_ORDER } from './document-vault.types';
import { titleOf, useDocumentVault, valueText } from './useDocumentVault';
import type { DocumentVaultState } from './useDocumentVault';

type T = ReturnType<typeof useTranslation>['t'];

/** Screen 173 — Document Vault. Everything AIEC has issued to the customer, kept exactly as issued: nothing is copied here, each document is read from the record that issued it, a newer version never rewrites an older one, and a customer can take any of it away as a file. */
export function DocumentVaultScreen() {
  const { t, i18n } = useTranslation();
  const s = useDocumentVault();
  const v = s.view;
  const head = (all?: boolean) => (
    <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={
      <span className="row gap-2">
        {all && <Button size="sm" variant="secondary" data-download-all disabled={s.busy} onClick={() => void s.downloadAll()}><DownloadSimple size={14} aria-hidden="true" /> {t(K.actions.downloadAll)}</Button>}
        <Button size="sm" variant="ghost" data-refresh onClick={() => void s.refresh()}><ArrowsClockwise size={14} aria-hidden="true" /> {t(K.refresh)}</Button>
      </span>
    } />
  );
  if (s.load === 'loading' && !v) return <Screen width="default">{head()}<LoadingState label={t(K.loading)} variant="list" rows={4} /></Screen>;
  if (s.load === 'error' && !v) return <Screen width="default">{head()}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  if (!v) return null;
  if (v.rows.length === 0) return <Screen width="default">{head()}<EmptyState title={t(K.list.empty.title)} body={t(K.list.empty.body)} /></Screen>;
  const kinds = KIND_ORDER.filter((k) => v.counts[k] > 0 || v.rows.some((r) => r.kind === k));
  const { current, chains } = s.shown;
  return (
    <Screen width="default">
      {head(true)}
      {s.offline && <p className="t-xs t-muted mb-2" data-offline>{t(K.offline)}</p>}
      {v.beforeAccount > 0 && <Card><p className="t-sm" data-before-account>{t(K.beforeAccount.note, { count: v.beforeAccount })}</p></Card>}
      <div className="stack gap-2 mb-2 sticky-under-shell" data-filters>
        <Input value={s.q} placeholder={t(K.search.placeholder)} aria-label={t(K.search.label)} onChange={(e) => s.setQ(e.target.value)} data-f="q" />
        <div className="row gap-2" data-kinds style={{ overflowX: 'auto', paddingBottom: 4 }}>
          <span style={{ flex: '0 0 auto' }} data-kind=""><Chip pressed={!s.kind} onClick={() => s.setKind('')}>{t(K.filter.all)}</Chip></span>
          {kinds.map((k) => <span key={k} style={{ flex: '0 0 auto' }} data-kind={k}><Chip pressed={s.kind === k} onClick={() => s.setKind(k)}>{t(`documentVault.kind.${k}`)} · {v.rows.filter((r) => r.kind === k && r.status !== 'superseded').length}</Chip></span>)}
        </div>
      </div>
      <div className="stack gap-2 mb-3">
        {v.projects.length > 1 && (
          <Select value={s.project} aria-label={t(K.project.label)} onChange={(e) => s.setProject(e.target.value)} data-f="project">
            <option value="">{t(K.project.all)}</option>
            {v.projects.map((p) => <option key={p.dealId} value={p.dealId}>{p.siteName} · {p.dealCode}</option>)}
          </Select>
        )}
        <label className="row gap-2 t-sm" style={{ alignItems: 'center' }}>
          <input type="checkbox" checked={s.earlier} onChange={(e) => s.setEarlier(e.target.checked)} data-f="earlier" />
          {t(K.showEarlier)}
        </label>
      </div>
      {current.length === 0 ? (
        <EmptyState title={t(K.list.none.title)} body={t(K.list.none.body)} actionLabel={s.filtered ? t(K.list.clear) : undefined} onAction={s.filtered ? s.clear : undefined} />
      ) : (
        <div className="grid-auto" data-list>
          {current.map((r) => <DocCard key={r.id} r={r} older={chains(r)} s={s} t={t} lang={i18n.language} />)}
        </div>
      )}
      <Sheet open={!!s.docId} onClose={s.closeDoc} title={t(K.title)} closeLabel={t(K.close)}>
        <Detail s={s} t={t} lang={i18n.language} />
      </Sheet>
    </Screen>
  );
}

function ValidityBadge({ r, t, lang }: { r: VaultDocRow; t: T; lang: string }) {
  if (!r.validity || !r.validity.until) return null;
  const tone = r.validity.state === 'expired' ? 'error' : r.validity.state === 'expiring' ? 'warning' : 'success';
  return <Badge tone={tone} data-validity={r.validity.state}>{t(`documentVault.validity.state.${r.validity.state}`)} · {formatDate(r.validity.until, lang)}</Badge>;
}

function Row({ r, s, t, lang, quiet }: { r: VaultDocRow; s: DocumentVaultState; t: T; lang: string; quiet?: boolean }) {
  return (
    <div className="row gap-2" data-doc={r.id} style={{ alignItems: 'center', justifyContent: 'space-between', opacity: quiet ? 0.85 : 1 }}>
      <button type="button" className="stack gap-0 t-left" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'inherit', cursor: 'pointer', minWidth: 0 }} onClick={() => s.open(r.id)}>
        <span className="row gap-2" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          <FileText size={18} aria-hidden="true" style={{ flex: '0 0 auto', marginTop: 2 }} />
          <span className="t-sm t-semibold" style={{ overflowWrap: 'anywhere' }}>{titleOf(t, r)}{r.code ? ` · ${r.code}` : ''}{r.version && r.kind === 'quotation' ? ` · ${t(K.detail.version, { n: r.version })}` : ''}</span>
        </span>
        <span className="t-xs t-muted">{t(K.issuedOn, { date: formatDate(r.issuedAt, lang) })} · {r.siteName}</span>
        <span className="row gap-1" style={{ flexWrap: 'wrap', marginTop: 4 }}>
          {r.status === 'superseded' && <Badge tone="neutral">{r.supersededByCode ? t(K.supersededBy, { code: r.supersededByCode }) : t(K.status.superseded)}</Badge>}
          <ValidityBadge r={r} t={t} lang={lang} />
          {r.beforeAccount && <Badge tone="neutral" data-before>{t(K.beforeAccount.badge)}</Badge>}
        </span>
      </button>
      <Button size="sm" variant="ghost" aria-label={`${t(K.actions.download)} ${titleOf(t, r)}`} data-download={r.id} disabled={s.busy} onClick={() => void s.download(r.id)}><DownloadSimple size={16} aria-hidden="true" /></Button>
    </div>
  );
}

function DocCard({ r, older, s, t, lang }: { r: VaultDocRow; older: VaultDocRow[]; s: DocumentVaultState; t: T; lang: string }) {
  return (
    <Card>
      <div className="stack gap-2" data-card={r.kind}>
        <Row r={r} s={s} t={t} lang={lang} />
        {older.length > 0 && (s.earlier ? (
          <div className="stack gap-2" data-earlier style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
            {older.map((o) => <Row key={o.id} r={o} s={s} t={t} lang={lang} quiet />)}
          </div>
        ) : (
          <button type="button" className="t-xs t-muted" data-earlier-count style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer', color: 'inherit' }} onClick={() => s.setEarlier(true)}>{t(K.earlier, { count: older.length })}</button>
        ))}
      </div>
    </Card>
  );
}

function Detail({ s, t, lang }: { s: DocumentVaultState; t: T; lang: string }) {
  if (s.detail.state === 'loading') return <LoadingState label={t(K.detail.loading)} variant="list" rows={3} />;
  const d: VaultDocument | null = s.detail.doc;
  if (s.detail.state === 'missing' || !d) return <p className="t-sm" data-missing>{t(K.detail.notFound)}</p>;
  const r = d.row;
  return (
    <div className="stack gap-3" data-detail={r.id}>
      <div className="stack gap-1">
        <h2 className="t-lg t-semibold">{titleOf(t, r)}{r.code ? ` · ${r.code}` : ''}</h2>
        <p className="t-sm t-muted">{r.siteName} · {r.dealCode}</p>
        <span className="row gap-1" style={{ flexWrap: 'wrap' }}>
          <Badge tone={r.status === 'current' ? 'success' : 'neutral'}>{t(`documentVault.status.${r.status}`)}</Badge>
          <ValidityBadge r={r} t={t} lang={lang} />
          {r.beforeAccount && <Badge tone="neutral">{t(K.beforeAccount.badge)}</Badge>}
        </span>
        {r.validity?.state === 'expiring' && <p className="t-xs t-muted">{t(K.validity.expiringNote)}</p>}
        {d.issuedBy && <p className="t-xs t-muted">{t(K.detail.issuedBy, { name: d.issuedBy })}</p>}
      </div>
      {d.sections.map((sec) => (
        <section key={sec.headingKey} className="stack gap-1" data-section={sec.headingKey}>
          <h3 className="t-md t-semibold">{t(sec.headingKey)}</h3>
          <dl className="stack gap-1">
            {sec.fields.map((f, i) => (
              <div key={`${f.labelKey}-${i}`} className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <dt className="t-sm t-muted">{t(f.labelKey)}</dt>
                <dd className="t-sm" style={{ textAlign: 'right', margin: 0, overflowWrap: 'anywhere' }}>{valueText(t, lang, f.value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      {d.versions.length > 1 && (
        <section className="stack gap-1" data-versions>
          <h3 className="t-md t-semibold">{t(K.detail.versions)}</h3>
          {d.versions.map((x) => (
            <button key={x.id} type="button" className="row gap-2" data-version={x.id} onClick={() => s.open(x.id)} style={{ justifyContent: 'space-between', background: 'none', border: 0, padding: '6px 0', cursor: 'pointer', color: 'inherit', textAlign: 'left' }}>
              <span className="t-sm">{x.code ?? titleOf(t, x)}{x.version ? ` · ${t(K.detail.version, { n: x.version })}` : ''}{x.id === r.id ? ' ✓' : ''}</span>
              <span className="t-xs t-muted">{formatDate(x.issuedAt, lang)} · {t(`documentVault.status.${x.status}`)}</span>
            </button>
          ))}
        </section>
      )}
      <p className="t-xs t-muted">{t(K.exactly)}</p>
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        <Button data-act="download" disabled={s.busy} onClick={() => void s.download(r.id)}><DownloadSimple size={16} aria-hidden="true" /> {t(K.actions.download)}</Button>
        <Button variant="secondary" data-act="share" onClick={() => void s.share(d)}><ShareNetwork size={16} aria-hidden="true" /> {t(K.actions.share)}</Button>
        {r.route && <Button variant="ghost" data-act="origin" onClick={() => s.goTo(r.route as string)}>{t(K.actions.openOrigin)}</Button>}
      </div>
    </div>
  );
}
