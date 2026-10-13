import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, CalendarCheck, Check, ImageSquare, ShieldWarning, WarningOctagon, X } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Checkbox, Chip, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, TextArea, formatDate, useToast } from '@/design-system';
import type { CompanyProfileVersionView, CompanyProfileView } from '@/data/repository';
import { DEFAULT_TOKENS, HEADING_FONT_IDS, HEADING_FONTS, NOTE_MIN, REASON_MIN_COSMETIC, REASON_MIN_LEGAL, STATE_NAMES, contrastChecks, displayName, draftHash, hexProblem, lettersOf, previewStyle, profileProblems } from '@/features/brand/brand';
import type { BrandDraft, FieldChange, ProfileProblem } from '@/features/brand/brand';
import { COMPANY_PROFILE_KEYS as K } from './company-profile.types';
import { useCompanyProfile } from './useCompanyProfile';
import type { CompanyProfileState } from './useCompanyProfile';

type T = ReturnType<typeof useTranslation>['t'];
const errText = (t: T, code: string) => t(`companyProfile.error.${code}`, { defaultValue: t(K.error.generic) });
const fieldName = (t: T, f: string) => t(`companyProfile.change.field.${f}`, { defaultValue: f });
const shortFont = (t: T, id: string) => t(`companyProfile.font.${id}`, { defaultValue: id }).split(' (')[0];
const valueText = (t: T, field: string, v: string) => (v === '' ? t(K.change.empty) : field === 'headingFont' ? shortFont(t, v) : v);
const STATUS_TONE: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = { current: 'success', scheduled: 'warning', past: 'neutral', cancelled: 'neutral' };
const FIELD_OF: Partial<Record<ProfileProblem, string>> = { name_short: 'companyName', name_long: 'companyName', owner_short: 'ownerName', gstin_missing: 'gstin', gstin_format: 'gstin', gstin_state: 'gstin', address_short: 'line1', city_short: 'city', state_missing: 'state', pincode_format: 'pincode', hex_primary: 'accentPrimary', hex_secondary: 'accentSecondary', font_unknown: 'headingFont', logo_type: 'logo', logo_size: 'logo', contrast_primary: 'accentPrimary', contrast_secondary: 'accentSecondary' };
const todayStr = (): string => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function Section({ title, hint, danger, children }: { title: string; hint?: string; danger?: boolean; children: ReactNode }) {
  return (
    <section className="stack gap-3" data-group>
      <h2 className="t-md t-semibold row gap-2" style={{ borderTop: `1px solid ${danger ? 'var(--color-error)' : 'var(--color-accent-primary)'}`, paddingTop: 12, alignItems: 'center', color: danger ? 'var(--color-error)' : undefined }}>{danger && <ShieldWarning size={18} aria-hidden="true" />}{title}</h2>
      {hint && <p className="t-xs t-muted">{hint}</p>}
      {children}
    </section>
  );
}

/** Screen 191 — Company Profile & Branding. A settings layout: what is in use today is always on show beside each setting, the legal details are set apart with their own care, a preview shows every pending change together on a quotation, an invoice and the customer's home, and nothing goes live except as a new version with a day, a reason and a confirmation. */
export function CompanyProfileScreen() {
  const { t, i18n } = useTranslation();
  const s = useCompanyProfile();
  const [reviewing, setReviewing] = useState(false);
  const v = s.view;
  const d = s.draft;
  const head = <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh onClick={() => void s.refresh()}>{t(K.refresh)}</Button>} />;
  if (s.load === 'loading' && !v) return <Screen width="default">{head}<LoadingState label={t(K.loading)} variant="list" rows={4} /></Screen>;
  if (s.load === 'error' && !v) return <Screen width="default">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /></Screen>;
  if (!v || !d) return null;
  return (
    <Screen width="default" className={s.dirty ? 'pb-action-bar' : undefined}>
      {head}
      <div className="stack gap-4">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.offline)}</p>}
        <Current v={v} t={t} lang={i18n.language} />
        {v.scheduled && <Scheduled v={v} s={s} t={t} lang={i18n.language} />}
        {v.verifyOpen && <Verify v={v} s={s} t={t} lang={i18n.language} />}
        <div className="main-aside">
          <div className="stack gap-5" data-editor>
            <Identity d={d} s={s} t={t} cur={v.current} lang={i18n.language} />
            <Legal d={d} s={s} t={t} cur={v.current} />
            <Look d={d} s={s} t={t} cur={v.current} />
          </div>
          <div className="stack gap-3 sticky-under-shell" data-aside>
            <Preview d={d} s={s} t={t} lang={i18n.language} cur={v.current} />
          </div>
        </div>
        <History v={v} s={s} t={t} lang={i18n.language} />
        <p className="t-xs t-muted" data-placeholder-note>{t(K.note.placeholders)}</p>
      </div>
      {s.dirty && (
        <ActionBar>
          <div className="row gap-2" style={{ width: '100%' }}>
            <Button variant="ghost" data-act="discard" onClick={() => { s.discard(); }}>{t(K.publish.discard)}</Button>
            <Button className="grow" data-act="review" onClick={() => setReviewing(true)}>{t(K.publish.review)}</Button>
          </div>
        </ActionBar>
      )}
      <Review open={reviewing} onClose={() => setReviewing(false)} d={d} s={s} t={t} lang={i18n.language} cur={v.current} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ what is in use */

function Swatch({ color }: { color: string }) {
  return <span aria-hidden="true" style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 8, background: color, border: '1px solid var(--color-border)', verticalAlign: 'middle' }} />;
}

function Current({ v, t, lang }: { v: CompanyProfileView; t: T; lang: string }) {
  const c = v.current;
  return (
    <Card>
      <div className="stack gap-2" data-current data-version={c.version}>
        <div className="row between" style={{ alignItems: 'center', gap: 8 }}>
          <span className="t-xs t-muted">{t(K.now.title)}</span>
          <Badge tone="success">{t(K.now.version, { version: c.version, date: formatDate(c.effectiveFrom, lang) })}</Badge>
        </div>
        <div className="row gap-3" style={{ alignItems: 'center' }}>
          {c.logo ? <img src={c.logo.dataUrl} alt={c.companyName} style={{ height: 40, width: 'auto', maxWidth: 120, objectFit: 'contain' }} /> : <ImageSquare size={28} aria-hidden="true" color="var(--color-text-secondary)" />}
          <div className="stack gap-0">
            <span className="t-md t-semibold" data-name>{displayName(c, lang)}</span>
            <span className="t-xs t-muted">{c.ownerName}</span>
          </div>
        </div>
        <span className="t-xs" data-gstin>{t(K.field.gstin)}: <span className="num">{c.gstin}</span></span>
        <span className="t-xs t-muted" data-address>{c.address.line1}, {c.address.city}, {c.address.state} {c.address.pincode}</span>
        <span className="t-xs row gap-2" style={{ alignItems: 'center' }}><Swatch color={c.tokens.accentPrimary} /><span className="num">{c.tokens.accentPrimary}</span><Swatch color={c.tokens.accentSecondary} /><span className="num">{c.tokens.accentSecondary}</span><span>· {shortFont(t, c.tokens.headingFont)}</span></span>
      </div>
    </Card>
  );
}

function Scheduled({ v, s, t, lang }: { v: CompanyProfileView; s: CompanyProfileState; t: T; lang: string }) {
  const toast = useToast();
  const sc = v.scheduled!;
  const [open, setOpen] = useState(false);
  const [why, setWhy] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const go = async () => { setProblem(null); const r = await s.cancelScheduled(sc.id, why); if (r.ok) { setOpen(false); setWhy(''); toast.push(t(K.scheduled.cancelled)); } else setProblem(r.problem); };
  return (
    <Card>
      <div className="stack gap-2" data-scheduled={sc.id}>
        <span className="t-sm t-semibold row gap-2" style={{ alignItems: 'center', color: 'var(--color-warning)' }}><CalendarCheck size={18} aria-hidden="true" />{t(K.scheduled.title, { version: sc.version })}</span>
        <p className="t-xs">{t(K.scheduled.body, { date: formatDate(sc.effectiveFrom, lang), current: v.current.version })}</p>
        <ChangeList changes={sc.changes} t={t} />
        <div><Button size="sm" variant="secondary" data-act="cancel-scheduled" onClick={() => { setProblem(null); setOpen(true); }}>{t(K.scheduled.cancel)}</Button></div>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title={t(K.scheduled.cancel)} closeLabel={t(K.close)}>
        <div className="stack gap-3" data-cancel-sheet>
          <p className="t-sm">{t(K.scheduled.cancelBody)}</p>
          <Field label={t(K.scheduled.cancelReason)} hint={`${lettersOf(why)}/${REASON_MIN_COSMETIC}`}>{(p) => <TextArea id={p.id} rows={2} value={why} data-f="cancel-reason" onChange={(e) => setWhy(e.target.value)} />}</Field>
          {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
          <Button data-act="cancel-do" disabled={lettersOf(why) < REASON_MIN_COSMETIC} loading={s.busy} onClick={() => void go()}>{t(K.scheduled.cancelDo)}</Button>
        </div>
      </Sheet>
    </Card>
  );
}

function Verify({ v, s, t, lang }: { v: CompanyProfileView; s: CompanyProfileState; t: T; lang: string }) {
  const toast = useToast();
  const o = v.verifyOpen!;
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const go = async () => { setProblem(null); const r = await s.confirmLegal(o.versionId, note); if (r.ok) { setNote(''); toast.push(t(K.verify.done)); } else setProblem(r.problem); };
  return (
    <Card>
      <div className="stack gap-2" data-verify={o.versionId}>
        <span className="t-sm t-semibold row gap-2" style={{ alignItems: 'center', color: 'var(--color-warning)' }}><WarningOctagon size={18} aria-hidden="true" />{t(K.verify.title)}</span>
        <p className="t-xs">{t(K.verify.body, { version: o.version })}</p>
        <span className="t-xs t-muted">{t(K.verify.due, { date: formatDate(o.dueAt, lang) })}</span>
        <Field label={t(K.verify.note)} hint={`${lettersOf(note)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={note} data-f="verify-note" onChange={(e) => setNote(e.target.value)} />}</Field>
        {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
        <div><Button size="sm" data-act="verify-do" disabled={lettersOf(note) < NOTE_MIN} loading={s.busy} onClick={() => void go()}>{t(K.verify.do)}</Button></div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ the settings */

interface GroupProps { d: BrandDraft; s: CompanyProfileState; t: T; cur: CompanyProfileVersionView }
const problemsOf = (d: BrandDraft): Map<string, ProfileProblem> => { const m = new Map<string, ProfileProblem>(); for (const p of profileProblems(d).blocking) { const f = FIELD_OF[p]; if (f && !m.has(f)) m.set(f, p); } return m; };

function Identity({ d, s, t, cur, lang }: GroupProps & { lang: string }) {
  const toast = useToast();
  const issues = problemsOf(d);
  const file = useRef<HTMLInputElement>(null);
  const [logoProblem, setLogoProblem] = useState<string | null>(null);
  const set = (patch: Partial<BrandDraft>) => s.setDraft((x) => ({ ...x, ...patch }));
  const pick = async (f: File | undefined) => { if (!f) return; setLogoProblem(null); const r = await s.chooseLogo(f); if (!r.ok) setLogoProblem(r.problem); else toast.push(t(K.field.logo)); };
  const nowOf = (value: string) => t(K.now.value, { value: value || t(K.now.none) });
  return (
    <Section title={t(K.group.identity.title)} hint={t(K.group.identity.hint)}>
      <Field label={t(K.field.companyName)} hint={nowOf(cur.companyName)} error={issues.has('companyName') ? errText(t, issues.get('companyName')!) : undefined}>{(p) => <Input id={p.id} value={d.companyName} data-f="companyName" invalid={issues.has('companyName')} onChange={(e) => set({ companyName: e.target.value })} />}</Field>
      <div className="grid-2">
        <Field label={t(K.field.nameHi)} hint={nowOf(cur.nameHi)}>{(p) => <Input id={p.id} value={d.nameHi} lang="hi" data-f="nameHi" onChange={(e) => set({ nameHi: e.target.value })} />}</Field>
        <Field label={t(K.field.nameMr)} hint={nowOf(cur.nameMr)}>{(p) => <Input id={p.id} value={d.nameMr} lang="mr" data-f="nameMr" onChange={(e) => set({ nameMr: e.target.value })} />}</Field>
      </div>
      <Field label={t(K.field.ownerName)} hint={nowOf(cur.ownerName)} error={issues.has('ownerName') ? errText(t, issues.get('ownerName')!) : undefined}>{(p) => <Input id={p.id} value={d.ownerName} data-f="ownerName" invalid={issues.has('ownerName')} onChange={(e) => set({ ownerName: e.target.value })} />}</Field>
      <div className="stack gap-2" data-logo>
        <span className="t-sm t-semibold">{t(K.field.logo)}</span>
        <span className="t-xs t-muted">{t(K.now.value, { value: cur.logo ? cur.logo.fileName : t(K.now.none) })}</span>
        <div className="row gap-3" style={{ alignItems: 'center' }}>
          {d.logo ? <img src={d.logo.dataUrl} alt={displayName(d, lang)} data-logo-preview style={{ height: 48, width: 'auto', maxWidth: 160, objectFit: 'contain', border: '1px solid var(--color-border)', borderRadius: 12, padding: 4, background: 'var(--color-surface)' }} /> : <span className="t-xs t-muted">{t(K.logo.none)}</span>}
          <input ref={file} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden data-f="logo-file" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
          <Button size="sm" variant="secondary" data-act="logo" onClick={() => file.current?.click()}>{d.logo ? t(K.logo.replace) : t(K.logo.choose)}</Button>
          {d.logo && <Button size="sm" variant="ghost" data-act="logo-remove" onClick={() => set({ logo: null })}>{t(K.logo.remove)}</Button>}
        </div>
        <span className="t-xs t-muted">{t(K.logo.hint)}</span>
        {(logoProblem || issues.has('logo')) && <p className="t-sm t-error" role="alert" data-problem={logoProblem ?? issues.get('logo')}>{errText(t, logoProblem ?? issues.get('logo')!)}</p>}
      </div>
    </Section>
  );
}

function Legal({ d, s, t, cur }: GroupProps) {
  const issues = problemsOf(d);
  const warn = profileProblems(d).warn;
  const set = (patch: Partial<BrandDraft>) => s.setDraft((x) => ({ ...x, ...patch }));
  const setAddr = (patch: Partial<BrandDraft['address']>) => s.setDraft((x) => ({ ...x, address: { ...x.address, ...patch } }));
  const err = (f: string) => (issues.has(f) ? errText(t, issues.get(f)!) : undefined);
  return (
    <Section title={t(K.group.legal.title)} hint={t(K.group.legal.hint)} danger>
      <p className="t-sm" data-legal-warning style={{ color: 'var(--color-error)' }}>{t(K.group.legal.warn)}</p>
      <Field label={t(K.field.gstin)} hint={t(K.now.value, { value: cur.gstin })} error={err('gstin')}>{(p) => <Input id={p.id} value={d.gstin} data-f="gstin" autoCapitalize="characters" spellCheck={false} maxLength={15} invalid={issues.has('gstin')} onChange={(e) => set({ gstin: e.target.value.toUpperCase() })} />}</Field>
      <Field label={t(K.field.line1)} hint={t(K.now.value, { value: `${cur.address.line1}, ${cur.address.city}, ${cur.address.state} ${cur.address.pincode}` })} error={err('line1')}>{(p) => <Input id={p.id} value={d.address.line1} data-f="line1" invalid={issues.has('line1')} onChange={(e) => setAddr({ line1: e.target.value })} />}</Field>
      <div className="grid-2">
        <Field label={t(K.field.city)} error={err('city')}>{(p) => <Input id={p.id} value={d.address.city} data-f="city" invalid={issues.has('city')} onChange={(e) => setAddr({ city: e.target.value })} />}</Field>
        <Field label={t(K.field.pincode)} error={err('pincode')}>{(p) => <Input id={p.id} value={d.address.pincode} inputMode="numeric" maxLength={6} data-f="pincode" invalid={issues.has('pincode')} onChange={(e) => setAddr({ pincode: e.target.value.replace(/\D/g, '') })} />}</Field>
      </div>
      <Field label={t(K.field.state)} error={err('state')}>{(p) => <Select id={p.id} value={d.address.state} data-f="state" onChange={(e) => setAddr({ state: e.target.value })}><option value="">—</option>{STATE_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}</Select>}</Field>
      {warn.filter((w) => w === 'gstin_address_state').map((w) => <p key={w} className="t-xs" role="status" data-warn={w} style={{ color: 'var(--color-warning)' }}>{t(`companyProfile.warn.${w}`)}</p>)}
    </Section>
  );
}

function ColorField({ label, hint, value, error, name, onChange }: { label: string; hint: string; value: string; error?: string; name: string; onChange: (v: string) => void }) {
  const valid = !hexProblem(value);
  return (
    <Field label={label} hint={hint} error={error}>
      {(p) => (
        <div className="row gap-2" style={{ alignItems: 'center' }}>
          <input type="color" aria-label={label} value={valid ? value.toLowerCase() : '#000000'} data-f={`${name}-picker`} onChange={(e) => onChange(e.target.value.toUpperCase())} style={{ width: 48, height: 48, padding: 2, border: '1px solid var(--color-border)', borderRadius: 12, background: 'var(--color-surface)', flex: '0 0 auto' }} />
          <Input id={p.id} value={value} data-f={name} invalid={!valid} spellCheck={false} maxLength={7} onChange={(e) => onChange(`#${e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)}`.toUpperCase())} />
        </div>
      )}
    </Field>
  );
}

function Look({ d, s, t, cur }: GroupProps) {
  const issues = problemsOf(d);
  const checks = contrastChecks(d.tokens);
  const setTok = (patch: Partial<BrandDraft['tokens']>) => s.setDraft((x) => ({ ...x, tokens: { ...x.tokens, ...patch } }));
  const warn = profileProblems(d).warn.includes('accents_similar');
  const err = (f: string) => (issues.has(f) ? errText(t, issues.get(f)!) : undefined);
  return (
    <Section title={t(K.group.look.title)} hint={t(K.group.look.hint)}>
      <ColorField label={t(K.field.accentPrimary)} hint={t(K.now.value, { value: cur.tokens.accentPrimary })} value={d.tokens.accentPrimary} name="accentPrimary" error={err('accentPrimary')} onChange={(v) => setTok({ accentPrimary: v })} />
      <ColorField label={t(K.field.accentSecondary)} hint={t(K.now.value, { value: cur.tokens.accentSecondary })} value={d.tokens.accentSecondary} name="accentSecondary" error={err('accentSecondary')} onChange={(v) => setTok({ accentSecondary: v })} />
      <div className="stack gap-1" data-contrast>
        <span className="t-sm t-semibold">{t(K.contrast.title)}</span>
        {checks.map((c) => (
          <span key={c.id} className="t-xs row gap-1" data-check={c.id} data-ok={c.ok} style={{ alignItems: 'center', color: c.ok ? 'var(--color-success)' : c.id === 'distinct' ? 'var(--color-warning)' : 'var(--color-error)' }}>
            {c.ok ? <Check size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />}{t(`companyProfile.contrast.${c.id}`, { ratio: c.ratio, need: c.need })}
          </span>
        ))}
        {warn && <p className="t-xs" role="status" data-warn="accents_similar" style={{ color: 'var(--color-warning)' }}>{t('companyProfile.warn.accents_similar')}</p>}
      </div>
      <Field label={t(K.field.headingFont)} hint={`${t(K.now.value, { value: shortFont(t, cur.tokens.headingFont) })} · ${t(K.font.devaNote)}`} error={err('headingFont')}>
        {(p) => <Select id={p.id} value={d.tokens.headingFont} data-f="headingFont" onChange={(e) => setTok({ headingFont: e.target.value as BrandDraft['tokens']['headingFont'] })}>{HEADING_FONT_IDS.map((id) => <option key={id} value={id}>{t(`companyProfile.font.${id}`)}</option>)}</Select>}
      </Field>
      <p className="t-lg" data-font-sample style={{ fontFamily: HEADING_FONTS[d.tokens.headingFont], margin: 0 }}>{t(K.font.sample)}</p>
      <div><Button size="sm" variant="ghost" data-act="reset-look" disabled={d.tokens.accentPrimary.toUpperCase() === DEFAULT_TOKENS.accentPrimary && d.tokens.accentSecondary.toUpperCase() === DEFAULT_TOKENS.accentSecondary && d.tokens.headingFont === DEFAULT_TOKENS.headingFont} onClick={() => s.resetLook()}>{t(K.look.reset)}</Button></div>
    </Section>
  );
}

/* ------------------------------------------------------------------ the preview */

function Letterhead({ d, lang }: { d: BrandDraft; lang: string }) {
  return (
    <div className="stack gap-0">
      {d.logo && <img src={d.logo.dataUrl} alt="" aria-hidden="true" style={{ height: 28, width: 'auto', maxWidth: 120, objectFit: 'contain', marginBottom: 4 }} />}
      <span className="t-sm t-semibold" style={{ fontFamily: 'var(--font-display)' }}>{displayName(d, lang)}</span>
      <span className="t-xs t-muted">{d.address.line1}, {d.address.city}, {d.address.state} {d.address.pincode}</span>
      <span className="t-xs t-muted">GSTIN <span className="num">{d.gstin}</span></span>
    </div>
  );
}
const mock: React.CSSProperties = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderTop: '3px solid var(--color-accent-primary)', borderRadius: 16, padding: 16 };
const FakeButton = ({ children }: { children: ReactNode }) => <span className="ds-btn ds-btn--primary ds-btn--sm" aria-hidden="true">{children}</span>;

function Preview({ d, s, t, lang, cur }: { d: BrandDraft; s: CompanyProfileState; t: T; lang: string; cur: CompanyProfileVersionView }) {
  const [showNow, setShowNow] = useState(false);
  const base: BrandDraft = { companyName: cur.companyName, nameHi: cur.nameHi, nameMr: cur.nameMr, ownerName: cur.ownerName, logo: cur.logo, gstin: cur.gstin, address: cur.address, tokens: cur.tokens };
  const shown = showNow ? base : d;
  return (
    <section className="stack gap-2" data-preview data-showing={showNow ? 'now' : 'changes'}>
      <h2 className="t-md t-semibold" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 12 }}>{t(K.preview.title)}</h2>
      <p className="t-xs t-muted">{t(K.preview.hint)}</p>
      {!s.dirty ? <p className="t-sm t-muted" data-preview-empty>{t(K.preview.empty)}</p> : (
        <div className="row gap-2" role="group" aria-label={t(K.preview.title)}>
          <Chip pressed={!showNow} onClick={() => setShowNow(false)}>{t(K.preview.changes)}</Chip>
          <Chip pressed={showNow} onClick={() => setShowNow(true)}>{t(K.preview.now)}</Chip>
        </div>
      )}
      <div className="stack gap-3" style={previewStyle(shown.tokens, lang)} data-preview-body>
        <div style={mock} data-mock="quotation" className="stack gap-2">
          <Letterhead d={shown} lang={lang} />
          <h3 className="t-md" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>{t(K.preview.quote.heading)}</h3>
          <span className="t-xs">{t(K.preview.quote.line)}</span>
          <div className="row between"><span className="t-xs t-muted">{t(K.preview.quote.total)}</span><span className="num t-md" style={{ color: 'var(--color-accent-secondary)' }}>₹ 18,50,000</span></div>
          <span className="t-xs t-muted">{t(K.preview.quote.valid)}</span>
        </div>
        <div style={mock} data-mock="invoice" className="stack gap-2">
          <Letterhead d={shown} lang={lang} />
          <h3 className="t-md" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>{t(K.preview.invoice.heading)}</h3>
          <span className="t-xs t-muted">{t(K.preview.invoice.billed)}: {t(K.preview.invoice.customer)}</span>
          <div className="row between t-xs"><span>{t(K.preview.invoice.taxable)}</span><span className="num">₹ 15,67,797</span></div>
          <div className="row between t-xs"><span>{t(K.preview.invoice.gst)}</span><span className="num">₹ 2,82,203</span></div>
          <div className="row between t-sm t-semibold"><span>{t(K.preview.invoice.total)}</span><span className="num">₹ 18,50,000</span></div>
        </div>
        <div style={{ ...mock, background: 'var(--color-bg)' }} data-mock="portal" className="stack gap-2">
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            {shown.logo ? <img src={shown.logo.dataUrl} alt="" aria-hidden="true" style={{ height: 24, width: 'auto', maxWidth: 56, objectFit: 'contain' }} /> : null}
            <span className="t-sm t-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-secondary)' }}>{displayName(shown, lang)}</span>
          </div>
          <h3 className="t-md" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>{t(K.preview.portal.heading)}</h3>
          <div aria-hidden="true" style={{ height: 8, borderRadius: 4, background: 'var(--color-surface-alt)' }}><div style={{ width: '62%', height: '100%', borderRadius: 4, background: 'var(--color-accent-primary)' }} /></div>
          <span className="t-xs">{t(K.preview.portal.stage)} · {t(K.preview.portal.next)}</span>
          <div><FakeButton>{t(K.preview.portal.pay)}</FakeButton></div>
        </div>
      </div>
      <p className="t-xs t-muted">{t(K.preview.sample)}</p>
    </section>
  );
}

/* ------------------------------------------------------------------ review and publish */

function ChangeList({ changes, t }: { changes: FieldChange[]; t: T }) {
  return (
    <div className="stack gap-1" data-changes>
      {changes.map((c) => (
        <div key={c.field} className="stack gap-0" data-change={c.field} data-group-of={c.group}>
          <span className="t-xs t-semibold">{fieldName(t, c.field)}</span>
          <span className="t-xs t-muted" style={{ overflowWrap: 'anywhere' }}>{t(K.change.line, { from: valueText(t, c.field, c.from), to: valueText(t, c.field, c.to) })}</span>
        </div>
      ))}
    </div>
  );
}

function Review({ open, onClose, d, s, t, lang, cur }: { open: boolean; onClose: () => void; d: BrandDraft; s: CompanyProfileState; t: T; lang: string; cur: CompanyProfileVersionView }) {
  const toast = useToast();
  const [seen, setSeen] = useState(false);
  const [reg, setReg] = useState(false);
  const [acct, setAcct] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const pv = s.preview;
  const kind = pv?.kind ?? 'none';
  const legal = kind === 'legal';
  useEffect(() => { if (open) { setSeen(false); setReg(false); setAcct(false); setProblem(null); } }, [open]);
  // A legal change always starts on a stated day.
  useEffect(() => { if (open && legal && s.effective.mode === 'now') s.setEffective({ mode: 'day', day: todayStr() }); }, [open, legal]); // eslint-disable-line react-hooks/exhaustive-deps
  const local = profileProblems(d);
  const fresh = !!pv && pv.token === draftHash(d, s.effectiveFrom);
  const needReason = legal ? REASON_MIN_LEGAL : REASON_MIN_COSMETIC;
  const ready = fresh && kind !== 'none' && local.blocking.length === 0 && !pv?.effectiveProblem && seen && lettersOf(s.reason) >= needReason && (!legal || (reg && acct));
  const go = async () => {
    setProblem(null);
    const r = await s.publish({ confirmPreview: seen, registrationChecked: reg, accountantTold: acct });
    if (r.ok) { onClose(); toast.push(s.effective.mode === 'now' && !legal ? t(K.publish.doneNow) : t(K.publish.done, { date: formatDate(r.value.versions.find((x) => x.version === Math.max(...r.value.versions.map((y) => y.version)))?.effectiveFrom ?? new Date().toISOString(), lang) })); } else setProblem(r.problem);
  };
  const impact = pv?.legalImpact;
  return (
    <Sheet open={open} onClose={onClose} title={t(K.publish.title)} closeLabel={t(K.close)}>
      <div className="stack gap-4" data-review data-kind={kind}>
        {pv && (
          <div className="stack gap-1">
            <Badge tone={legal ? 'error' : 'accent'}>{t(`companyProfile.publish.kind.${kind}`)}</Badge>
            {kind !== 'none' && <p className="t-xs" style={legal ? { color: 'var(--color-error)' } : undefined}>{t(`companyProfile.publish.kindHint.${kind}`)}</p>}
          </div>
        )}
        <div className="stack gap-1"><span className="t-sm t-semibold">{t(K.publish.changes)}</span><ChangeList changes={s.changes} t={t} /></div>
        {local.blocking.length > 0 && (
          <div className="stack gap-1" data-blocking><span className="t-sm t-semibold" style={{ color: 'var(--color-error)' }}>{t(K.publish.blocked)}</span>{local.blocking.map((b) => <span key={b} className="t-xs" style={{ color: 'var(--color-error)' }}>{errText(t, b)}</span>)}</div>
        )}
        {local.warn.length > 0 && (
          <div className="stack gap-1" data-warnings><span className="t-sm t-semibold">{t(K.publish.warnings)}</span>{local.warn.map((w) => <span key={w} className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(`companyProfile.warn.${w}`)}</span>)}</div>
        )}
        {pv && <p className="t-xs" data-keeps>{t(K.publish.keeps, { ...pv.keeps })}</p>}
        {impact && (
          <div className="stack gap-1" data-impact>
            <span className="t-sm t-semibold">{t(K.publish.impact.title)}</span>
            <p className="t-xs">{impact.stateFrom && impact.stateTo && impact.stateFrom !== impact.stateTo ? t(K.publish.impact.moves, { from: impact.stateFrom, to: impact.stateTo, deals: impact.dealsFlip, stages: impact.stagesFlip }) : t(K.publish.impact.same, { state: impact.stateTo ?? cur.address.state })}</p>
          </div>
        )}
        <div className="stack gap-2" data-effective>
          <span className="t-sm t-semibold">{t(K.publish.effective.title)}</span>
          {legal ? <p className="t-xs">{t(K.publish.effective.legalNote)}</p> : (
            <div className="row gap-2" role="group" aria-label={t(K.publish.effective.title)}>
              <Chip pressed={s.effective.mode === 'now'} onClick={() => s.setEffective({ ...s.effective, mode: 'now' })}>{t(K.publish.effective.now)}</Chip>
              <Chip pressed={s.effective.mode === 'day'} onClick={() => s.setEffective({ ...s.effective, mode: 'day' })}>{t(K.publish.effective.day)}</Chip>
            </div>
          )}
          {s.effective.mode === 'day' && <Field label={t(K.publish.effective.dayLabel)} error={pv?.effectiveProblem ? errText(t, pv.effectiveProblem) : undefined}>{(p) => <Input id={p.id} type="date" min={todayStr()} value={s.effective.day} data-f="effective-day" onChange={(e) => s.setEffective({ mode: 'day', day: e.target.value })} />}</Field>}
        </div>
        <Field label={t(K.publish.reason)} hint={`${lettersOf(s.reason)}/${needReason}`}>{(p) => <TextArea id={p.id} rows={2} value={s.reason} data-f="reason" onChange={(e) => s.setReason(e.target.value)} />}</Field>
        <div className="stack gap-2">
          <Checkbox checked={seen} onChange={setSeen} label={t(K.publish.seen)} />
          {legal && <Checkbox checked={reg} onChange={setReg} label={t(K.publish.registration)} />}
          {legal && <Checkbox checked={acct} onChange={setAcct} label={t(K.publish.accountant)} />}
        </div>
        {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
        <Button data-act="publish" disabled={!ready} loading={s.busy} onClick={() => void go()} style={legal ? { color: 'var(--color-error)' } : undefined}>{legal ? t(K.publish.goLegal) : t(K.publish.go)}</Button>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ history */

function History({ v, s, t, lang }: { v: CompanyProfileView; s: CompanyProfileState; t: T; lang: string }) {
  const toast = useToast();
  useEffect(() => { if (s.openVersion) document.getElementById(`version-${s.openVersion}`)?.scrollIntoView({ block: 'center' }); }, [s.openVersion, v.versions.length]);
  return (
    <section className="stack gap-2" data-history>
      <h2 className="t-md t-semibold" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 12 }}>{t(K.history.title)}</h2>
      <p className="t-xs t-muted">{t(K.history.hint)}</p>
      <div className="grid-auto">
        {v.versions.map((x) => (
          <Card key={x.id}>
            <div className="stack gap-2" id={`version-${x.id}`} data-version={x.version} data-status={x.status} data-open={s.openVersion === x.id}>
              <div className="row between" style={{ alignItems: 'center', gap: 8 }}>
                <span className="t-sm t-semibold">{t(K.history.line, { version: x.version, date: formatDate(x.effectiveFrom, lang), by: x.createdByName })}</span>
                <span className="row gap-1 wrap" style={{ justifyContent: 'flex-end' }}><Badge tone="neutral">{t(`companyProfile.kind.${x.kind}`)}</Badge><Badge tone={STATUS_TONE[x.status]}>{t(`companyProfile.status.${x.status}`)}</Badge></span>
              </div>
              <span className="t-xs">{x.kind === 'initial' ? t(K.history.initial) : x.reason}</span>
              {x.changes.length > 0 && <ChangeList changes={x.changes} t={t} />}
              <span className="t-xs t-muted">{t(K.history.usage, { ...x.usage })}</span>
              {x.cancelled && <span className="t-xs t-muted">{t(K.history.cancelledBy, { date: formatDate(x.cancelled.at, lang), by: x.cancelled.byName, reason: x.cancelled.reason })}</span>}
              {x.kind === 'legal' && !x.cancelled && (x.legal?.confirmedAt ? <span className="t-xs t-muted" data-confirmed>{t(K.history.confirmed, { date: formatDate(x.legal.confirmedAt, lang), by: x.legal.confirmedByName ?? '', note: x.legal.note ?? '' })}</span> : <span className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.history.unconfirmed)}</span>)}
              {!x.cancelled && <div><Button size="sm" variant="ghost" data-act={`start-${x.version}`} onClick={() => { s.startFrom(x); toast.push(t(K.history.startDone)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{t(K.history.start)}</Button></div>}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
