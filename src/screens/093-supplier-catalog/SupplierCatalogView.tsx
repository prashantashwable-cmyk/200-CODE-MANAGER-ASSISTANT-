import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, Package, Plus, UploadSimple, Warning } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  Tabs,
  TextArea,
  formatDate,
  formatINR,
  useToast,
} from '@/design-system';
import type { CatalogItemView } from '@/data/repository';
import { CATALOG_CSV_HEADER, KNOWN_DRIVE_TYPES, KNOWN_PART_CATEGORIES } from '@/features/suppliers/catalogRules';
import { useSupplierCatalog } from './useSupplierCatalog';
import type { SupplierCatalogState } from './useSupplierCatalog';
import { CATALOG_VIEWS, SUPPLIER_CATALOG_KEYS as K } from './supplier-catalog.types';

type T = (key: string, params?: Record<string, unknown>) => string;

/**
 * Screen 093 — Supplier Catalog & Parts Pricing. Each supplier's own parts,
 * prices and lead times — the one source 092 drafts purchase orders from.
 * A supplier's material price change (or an implausible listing) waits for
 * Admin; the live price never moves until then.
 */
export function SupplierCatalogView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const s = useSupplierCatalog();

  const categoryLabel = (category: string) =>
    i18n.exists(`partCategory.${category}`) ? t(`partCategory.${category}`) : category.replace(/_/g, ' ');
  const title = t(K.title);
  const subtitle = s.isAdmin ? t(K.subtitle) : t(K.subtitleSupplier, { name: s.ownSupplier?.name ?? '' });

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={title} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={6} />
      </Screen>
    );
  }

  if (s.status === 'error' || s.status === 'no_supplier') {
    const keys = s.status === 'error' ? K.error : K.noSupplier;
    return (
      <Screen>
        <ScreenHeader title={title} />
        <ErrorState
          title={t(keys.title)}
          body={t(keys.body)}
          retryLabel={s.status === 'error' ? t('action.retry') : undefined}
          onRetry={s.status === 'error' ? () => void s.reload() : undefined}
        />
      </Screen>
    );
  }

  const notify = (ok: boolean, key: string, params?: Record<string, unknown>) =>
    toast.push(t(ok ? key : K.toast.error, params), ok ? 'success' : 'error');

  return (
    <Screen>
      <ScreenHeader
        title={title}
        subtitle={subtitle}
        action={
          <div className="row gap-2">
            <Button size="sm" variant="ghost" icon={<UploadSimple size={16} />} onClick={s.openBulk}>
              {t(K.bulkUpload)}
            </Button>
            <Button size="sm" icon={<Plus size={16} />} onClick={s.openNew}>
              {t(K.addItem)}
            </Button>
          </div>
        }
      />

      <Tabs
        className="mb-2"
        label={title}
        value={s.view}
        onChange={(id) => s.setView(id as typeof s.view)}
        items={CATALOG_VIEWS.map((v) => ({ id: v, label: `${t(K.view[v])} · ${s.viewCounts[v]}` }))}
      />

      {/* Sticky search/filter bar — pinned under the shell while the list
          scrolls; the filters stay on one line and scroll sideways on a phone
          so the bar never eats the screen. */}
      <div className="sticky-under-shell stack gap-2 mb-3">
        <label className="row gap-2">
          <MagnifyingGlass size={16} className="shrink-0 t-muted" aria-hidden="true" />
          <Input
            aria-label={t(K.searchPlaceholder)}
            placeholder={t(K.searchPlaceholder)}
            value={s.search}
            onChange={(e) => s.setSearch(e.target.value)}
          />
        </label>
        <div className="row gap-2" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          {s.isAdmin && (
            <Select
              style={{ width: 'auto', flex: '0 0 auto' }}
              aria-label={t(K.filters.supplierAll)}
              value={s.supplierFilter}
              onChange={(e) => s.setSupplierFilter(e.target.value)}
            >
              <option value="">{t(K.filters.supplierAll)}</option>
              {s.suppliers.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </Select>
          )}
          <Select
            style={{ width: 'auto', flex: '0 0 auto' }}
            aria-label={t(K.filters.categoryAll)}
            value={s.categoryFilter}
            onChange={(e) => s.setCategoryFilter(e.target.value)}
          >
            <option value="">{t(K.filters.categoryAll)}</option>
            {s.categoriesInUse.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </Select>
          <Select
            style={{ width: 'auto', flex: '0 0 auto' }}
            aria-label={t(K.filters.driveTypeAll)}
            value={s.driveTypeFilter}
            onChange={(e) => s.setDriveTypeFilter(e.target.value)}
          >
            <option value="">{t(K.filters.driveTypeAll)}</option>
            {KNOWN_DRIVE_TYPES.map((d) => (
              <option key={d} value={d}>
                {t(`driveType.${d}`)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {s.view === 'review' && <ReviewQueue s={s} t={t} categoryLabel={categoryLabel} notify={notify} />}

      {s.totalItems === 0 ? (
        <EmptyState
          icon={<Package size={26} />}
          title={t(K.empty.title)}
          body={t(K.empty.body)}
          actionLabel={t(K.empty.action)}
          onAction={s.openNew}
        />
      ) : s.filtered.length === 0 ? (
        s.view === 'review' && s.isAdmin ? null : (
          <EmptyState
            icon={<MagnifyingGlass size={26} />}
            title={t(K.noResults.title)}
            body={t(K.noResults.body)}
            actionLabel={t(K.noResults.action)}
            onAction={s.clearFilters}
          />
        )
      ) : (
        !(s.view === 'review' && s.isAdmin) && (
          <Card className="ds-card--flush">
            {s.visible.map((row) => (
              <CatalogRow key={row.item.id} row={row} s={s} t={t} categoryLabel={categoryLabel} />
            ))}
          </Card>
        )
      )}

      {s.hasMore && !(s.view === 'review' && s.isAdmin) && (
        <div className="row between gap-2 mt-3">
          <span className="t-xs t-muted">{t(K.countShown, { shown: s.visible.length, total: s.filtered.length })}</span>
          <Button size="sm" variant="ghost" onClick={s.showMore}>
            {t(K.showMore)}
          </Button>
        </div>
      )}

      {s.isAdmin && (
        <div className="grid-2 gap-3 mt-5">
          <Card>
            <h2 className="t-md t-semibold">{t(K.settings.heading)}</h2>
            <p className="t-xs t-muted mt-1">{t(K.settings.body)}</p>
            <div className="row gap-2 mt-3" style={{ alignItems: 'flex-end' }}>
              <Field label={t(K.settings.label)} error={s.thresholdValid ? undefined : t(K.settings.invalid)}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    mono
                    inputMode="numeric"
                    value={s.thresholdDraft}
                    onChange={(e) => s.setThresholdDraft(e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                  />
                )}
              </Field>
              <Button
                size="sm"
                variant="secondary"
                disabled={!s.thresholdValid || Number(s.thresholdDraft) === s.settings?.priceReviewThresholdPct}
                onClick={() => void s.saveThreshold().then((ok) => notify(ok, K.toast.settingsSaved))}
              >
                {t(K.settings.save)}
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="t-md t-semibold">{t(K.spread.heading)}</h2>
            <p className="t-xs t-muted mt-1">{t(K.spread.body)}</p>
            <div className="stack gap-2 mt-3">
              {s.spread.map((c) => (
                <div key={c.category} className="row between gap-2">
                  <span className="t-sm grow" style={{ minWidth: 0 }}>
                    {categoryLabel(c.category)}
                    <span className="t-xs t-muted"> · {t(K.spread.listings, { count: c.listings })}</span>
                  </span>
                  <span className="t-sm num shrink-0">
                    {c.listings > 1
                      ? t(K.spread.range, { low: formatINR(c.lowest), high: formatINR(c.highest) })
                      : t(K.spread.single, { price: formatINR(c.lowest) })}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Button size="sm" variant="ghost" onClick={() => navigate('/admin/quotes/pricing')}>
                {t(K.spread.openPricing)}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <ItemSheet s={s} t={t} categoryLabel={categoryLabel} notify={notify} lang={i18n.language} />
      <BulkSheet s={s} t={t} categoryLabel={categoryLabel} notify={notify} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ rows */

function CatalogRow({
  row,
  s,
  t,
  categoryLabel,
}: {
  row: CatalogItemView;
  s: SupplierCatalogState;
  t: T;
  categoryLabel: (c: string) => string;
}) {
  const { item } = row;
  const secondary = [
    categoryLabel(item.category),
    item.specification,
    t(K.row.leadTime, { count: item.leadTimeDays }),
    item.driveTypes.length === 0 ? t(K.row.anyDrive) : item.driveTypes.map((d) => t(`driveType.${d}`)).join(', '),
    s.isAdmin ? row.supplierName : '',
  ]
    .filter(Boolean)
    .join(' · ');

  let badge: JSX.Element | null = null;
  if (item.status === 'pending_review') badge = <Badge tone="warning">{t(K.row.itemPending)}</Badge>;
  else if (item.status === 'discontinued') badge = <Badge tone="neutral">{t(K.row.discontinued)}</Badge>;
  else if (item.status === 'rejected') badge = <Badge tone="neutral">{t(K.row.rejected)}</Badge>;
  else if (row.pendingChange) badge = <Badge tone="warning">{t(K.row.pendingPrice, { price: formatINR(row.pendingChange.toPrice) })}</Badge>;
  else if (row.pctAboveLowest === 0 && s.spread.find((c) => c.category === item.category && c.listings > 1)) {
    badge = <Badge tone="success">{t(K.row.lowest)}</Badge>;
  } else if (row.pctAboveLowest !== null && row.pctAboveLowest > 0) {
    badge = <Badge tone="neutral">{t(K.row.aboveLowest, { pct: row.pctAboveLowest })}</Badge>;
  }

  // One anatomy for every row: icon · name / detail line / status · price.
  // The status sits under the detail, not beside the price, so a phone
  // never has to truncate the part name to fit a badge.
  return (
    <button type="button" className="ds-listrow" onClick={() => s.openItem(row)} style={{ alignItems: 'flex-start' }}>
      <span className="ds-avatar shrink-0" aria-hidden="true">
        <Package size={20} />
      </span>
      <span className="grow stack gap-1" style={{ minWidth: 0 }}>
        <span className="t-medium">{item.description}</span>
        <span className="t-xs t-muted clamp-2">{secondary}</span>
        {badge && <span>{badge}</span>}
      </span>
      <span className="num t-semibold shrink-0">{formatINR(item.unitPrice)}</span>
    </button>
  );
}

/* ---------------------------------------------------------- review queue */

function ReviewQueue({
  s,
  t,
  categoryLabel,
  notify,
}: {
  s: SupplierCatalogState;
  t: T;
  categoryLabel: (c: string) => string;
  notify: (ok: boolean, key: string) => void;
}) {
  if (!s.isAdmin) {
    return s.ownPendingCount > 0 ? (
      <Card className="mb-3">
        <p className="t-sm">{t(K.review.headingSupplier)}</p>
        <p className="t-xs t-muted mt-1">{t(K.review.waitingNote)}</p>
      </Card>
    ) : null;
  }
  return (
    <section className="stack gap-3 mb-4">
      <h2 className="t-lg">{t(K.review.heading)}</h2>
      {s.reviews.length === 0 && <EmptyState title={t(K.review.none)} body={t(K.review.waitingNote)} />}
      {s.reviews.map((r) => (
        <Card key={r.change.id}>
          <div className="row between gap-2" style={{ alignItems: 'flex-start' }}>
            <span className="stack gap-1 grow" style={{ minWidth: 0 }}>
              <span className="t-sm t-semibold">{r.item.description}</span>
              <span className="t-xs t-muted">
                {r.supplierName} · {categoryLabel(r.item.category)}
              </span>
            </span>
            <span className="num t-semibold shrink-0">{formatINR(r.change.toPrice)}</span>
          </div>
          <p className="t-sm mt-2">
            {r.change.fromPrice === null
              ? t(K.review.newListing)
              : t(K.review.change, {
                  from: formatINR(r.change.fromPrice),
                  to: formatINR(r.change.toPrice),
                  pct: `${(r.pctChange ?? 0) > 0 ? '+' : ''}${r.pctChange}`,
                })}
          </p>
          <div className="row wrap gap-1 mt-2">
            {(r.change.reviewReasonKeys ?? []).map((key) => (
              <Badge key={key} tone="warning">
                <Warning size={12} /> {t(`catalog.issue.${key}`)}
              </Badge>
            ))}
          </div>
          <p className="t-xs t-muted mt-2">
            {t(K.review.requested, { name: r.change.requestedBy, date: formatDate(r.change.requestedAt) })}
            {r.categoryLowestPrice !== null ? ` · ${t(K.review.lowestInCategory, { price: formatINR(r.categoryLowestPrice) })}` : ''}
          </p>
          {s.rejectingId === r.change.id ? (
            <div className="stack gap-2 mt-3">
              <TextArea
                aria-label={t(K.review.rejectReason)}
                placeholder={t(K.review.rejectReason)}
                value={s.rejectReason}
                onChange={(e) => s.setRejectReason(e.target.value)}
              />
              <div className="row gap-2">
                <Button
                  size="sm"
                  variant="danger"
                  disabled={s.rejectReason.trim().length < 4}
                  loading={s.reviewBusyId === r.change.id}
                  onClick={() => void s.decide(r.change.id, 'reject').then((ok) => notify(ok, K.toast.rejected))}
                >
                  {t(K.review.confirmReject)}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => s.setRejectingId(null)}>
                  {t(K.review.cancel)}
                </Button>
              </div>
            </div>
          ) : (
            <div className="row gap-2 mt-3">
              <Button
                size="sm"
                loading={s.reviewBusyId === r.change.id}
                onClick={() => void s.decide(r.change.id, 'approve').then((ok) => notify(ok, K.toast.approved))}
              >
                {t(K.review.approve)}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  s.setRejectReason('');
                  s.setRejectingId(r.change.id);
                }}
              >
                {t(K.review.reject)}
              </Button>
            </div>
          )}
        </Card>
      ))}
    </section>
  );
}

/* ------------------------------------------------------ add / edit sheet */

function ItemSheet({
  s,
  t,
  categoryLabel,
  notify,
  lang,
}: {
  s: SupplierCatalogState;
  t: T;
  categoryLabel: (c: string) => string;
  notify: (ok: boolean, key: string) => void;
  lang: string;
}) {
  const row = s.editingRow;
  const isNew = s.editing === 'new';
  const issues = [...s.formCheck.errors, ...s.formCheck.warnings];

  const onSave = () =>
    void s.save().then((outcome) => {
      if (outcome === 'price_pending_review') notify(true, K.toast.pricePending);
      else if (outcome === 'item_pending_review') notify(true, K.toast.itemPending);
      else notify(outcome !== null, K.toast.saved);
    });

  return (
    <Sheet
      open={s.editing !== null}
      onClose={s.closeEditor}
      title={t(isNew ? K.detail.newTitle : K.detail.editTitle)}
      closeLabel={t('action.close')}
      footer={
        s.editable ? (
          <Button block disabled={!s.canSave} loading={s.saving} onClick={onSave}>
            {t(K.detail.save)}
          </Button>
        ) : undefined
      }
    >
      <div className="stack gap-3">
        {!s.editable && <p className="t-sm t-muted">{t(K.detail.readOnly)}</p>}

        {s.isAdmin && isNew && (
          <Field label={t(K.detail.supplier)} required>
            {({ id }) => (
              <Select id={id} value={s.form.supplierId} onChange={(e) => s.updateForm({ supplierId: e.target.value })}>
                <option value="">{t(K.detail.supplierPick)}</option>
                {s.suppliers.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}

        {isNew ? (
          <>
            <Field label={t(K.detail.category)} required>
              {({ id }) => (
                <Select id={id} value={s.form.category} onChange={(e) => s.updateForm({ category: e.target.value })}>
                  {KNOWN_PART_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {categoryLabel(c)}
                    </option>
                  ))}
                  <option value="other">{t(K.detail.categoryOther)}</option>
                </Select>
              )}
            </Field>
            {s.form.category === 'other' && (
              <Field label={t(K.detail.categoryOther)} hint={t(K.detail.categoryOtherHint)} required>
                {({ id, describedBy }) => (
                  <Input id={id} aria-describedby={describedBy} value={s.form.customCategory} onChange={(e) => s.updateForm({ customCategory: e.target.value })} />
                )}
              </Field>
            )}
          </>
        ) : (
          row && (
            <p className="t-sm">
              <span className="t-muted">{t(K.detail.category)}: </span>
              {categoryLabel(row.item.category)} <span className="t-xs t-muted">· {t(K.detail.categoryFixed)}</span>
            </p>
          )
        )}

        <Field label={t(K.detail.description)} required>
          {({ id }) => (
            <Input id={id} disabled={!s.editable} value={s.form.description} onChange={(e) => s.updateForm({ description: e.target.value })} />
          )}
        </Field>
        <Field label={t(K.detail.specification)} hint={t(K.detail.specificationHint)}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              disabled={!s.editable}
              value={s.form.specification}
              onChange={(e) => s.updateForm({ specification: e.target.value })}
            />
          )}
        </Field>

        <div className="stack gap-2">
          <span className="t-sm t-semibold">{t(K.detail.driveTypes)}</span>
          <span className="t-xs t-muted">{t(K.detail.driveTypesHint)}</span>
          <div className="grid-2 gap-1">
            {KNOWN_DRIVE_TYPES.map((d) => (
              <Checkbox
                key={d}
                disabled={!s.editable}
                checked={s.form.driveTypes.includes(d)}
                onChange={() => s.toggleDriveType(d)}
                label={t(`driveType.${d}`)}
              />
            ))}
          </div>
        </div>

        <div className="grid-2 gap-3">
          <Field label={t(K.detail.price)} required>
            {({ id }) => (
              <Input
                id={id}
                mono
                inputMode="numeric"
                disabled={!s.editable}
                value={s.form.price}
                onChange={(e) => s.updateForm({ price: e.target.value.replace(/[^\d]/g, '') })}
              />
            )}
          </Field>
          <Field label={t(K.detail.leadTime)} required>
            {({ id }) => (
              <Input
                id={id}
                mono
                inputMode="numeric"
                disabled={!s.editable}
                value={s.form.leadTimeDays}
                onChange={(e) => s.updateForm({ leadTimeDays: e.target.value.replace(/[^\d]/g, '').slice(0, 3) })}
              />
            )}
          </Field>
        </div>

        {s.editable && issues.length > 0 && (
          <div className="stack gap-1">
            {s.formCheck.errors.map((key) => (
              <p key={key} className="t-xs t-error row gap-1">
                <Warning size={12} className="shrink-0" /> {t(`catalog.issue.${key}`)}
              </p>
            ))}
            {s.formCheck.warnings.map((key) => (
              <p key={key} className="t-xs t-warning row gap-1">
                <Warning size={12} className="shrink-0" /> {t(`catalog.issue.${key}`)}
              </p>
            ))}
          </div>
        )}

        {s.pricePreview && (
          <Card>
            <p className={`t-sm ${s.pricePreview.needsReview ? 't-warning' : ''}`}>
              {t(s.pricePreview.needsReview ? K.detail.willNeedReview : K.detail.adminLive, {
                pct: `${s.pricePreview.pct > 0 ? '+' : ''}${s.pricePreview.pct}`,
                threshold: s.settings?.priceReviewThresholdPct ?? 10,
              })}
            </p>
          </Card>
        )}
        {row?.pendingChange && (
          <p className="t-xs t-warning">
            {t(K.detail.pendingNow, { price: formatINR(row.pendingChange.toPrice), live: formatINR(row.item.unitPrice) })}
          </p>
        )}
        {row && row.inFlightPoCount > 0 && <p className="t-xs t-muted">{t(K.detail.inFlight, { count: row.inFlightPoCount })}</p>}

        {row && (row.item.status === 'active' || row.item.status === 'pending_review') && (
          <div className="stack gap-1">
            <div>
              <Button
                size="sm"
                variant="ghost"
                disabled={s.saving}
                onClick={() => void s.setItemStatus('discontinued').then((ok) => notify(ok, K.toast.discontinued))}
              >
                {t(K.detail.discontinue)}
              </Button>
            </div>
            <p className="t-xs t-muted">{t(K.detail.discontinueNote)}</p>
          </div>
        )}
        {row?.item.status === 'discontinued' && (
          <div>
            <Button size="sm" variant="secondary" disabled={s.saving} onClick={() => void s.setItemStatus('active').then((ok) => notify(ok, K.toast.reactivated))}>
              {t(K.detail.reactivate)}
            </Button>
          </div>
        )}

        {row && (
          <section className="stack gap-2 mt-2">
            <h3 className="label">{t(K.detail.history)}</h3>
            {s.history === null && <p className="t-xs t-muted">{t(K.detail.historyLoading)}</p>}
            {s.history?.length === 0 && <p className="t-xs t-muted">{t(K.detail.historyEmpty)}</p>}
            {s.history?.map((change) => (
              <div key={change.id} className="stack gap-1" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
                <div className="row between gap-2">
                  <span className="t-sm num">
                    {change.fromPrice === null ? t(K.detail.firstListing, { price: formatINR(change.toPrice) }) : `${formatINR(change.fromPrice)} → ${formatINR(change.toPrice)}`}
                  </span>
                  <Badge tone={change.status === 'applied' ? 'success' : change.status === 'pending' ? 'warning' : 'neutral'}>
                    {t(K.detail.changeStatus[change.status])}
                  </Badge>
                </div>
                <span className="t-xs t-muted">
                  {formatDate(change.requestedAt, lang)} · {t(K.detail.source[change.source])} · {t(K.detail.by, { name: change.requestedBy })}
                  {change.reviewedBy ? ` · ${t(K.detail.reviewedBy, { name: change.reviewedBy })}` : ''}
                </span>
                {change.rejectionReason && <span className="t-xs">{change.rejectionReason}</span>}
              </div>
            ))}
          </section>
        )}
      </div>
    </Sheet>
  );
}

/* --------------------------------------------------------- bulk upload */

function BulkSheet({
  s,
  t,
  categoryLabel,
  notify,
}: {
  s: SupplierCatalogState;
  t: T;
  categoryLabel: (c: string) => string;
  notify: (ok: boolean, key: string, params?: Record<string, unknown>) => void;
}) {
  const preview = s.bulkPreview;
  const counts = {
    ok: preview?.filter((r) => r.verdict === 'ok' && r.action !== 'unchanged').length ?? 0,
    review: preview?.filter((r) => r.verdict === 'review').length ?? 0,
    invalid: preview?.filter((r) => r.verdict === 'invalid').length ?? 0,
    unchanged: preview?.filter((r) => r.action === 'unchanged' && r.verdict !== 'invalid').length ?? 0,
  };

  return (
    <Sheet
      open={s.bulkOpen}
      onClose={() => s.setBulkOpen(false)}
      title={t(K.bulk.title)}
      closeLabel={t('action.close')}
      footer={
        preview === null ? (
          <Button block disabled={!s.bulkSupplierId || !s.bulkText.trim()} loading={s.bulkBusy} onClick={() => void s.checkBulk()}>
            {t(K.bulk.check)}
          </Button>
        ) : (
          <Button
            block
            disabled={s.bulkApplicable === 0}
            loading={s.bulkBusy}
            onClick={() =>
              void s.applyBulk().then((result) =>
                notify(result !== null, K.toast.bulkApplied, result ? { ...result } : undefined),
              )
            }
          >
            {s.bulkApplicable === 0 ? t(K.bulk.nothingToApply) : t(K.bulk.apply, { count: s.bulkApplicable })}
          </Button>
        )
      }
    >
      <div className="stack gap-3">
        <p className="t-sm t-muted">{t(K.bulk.intro)}</p>
        {s.isAdmin && (
          <Field label={t(K.bulk.supplier)} required>
            {({ id }) => (
              <Select id={id} value={s.bulkSupplierId} onChange={(e) => s.setBulkSupplierId(e.target.value)}>
                <option value="">{t(K.detail.supplierPick)}</option>
                {s.suppliers.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <div className="stack gap-1">
          <span className="t-sm t-semibold">{t(K.bulk.formatLabel)}</span>
          <code className="t-xs num" style={{ overflowWrap: 'anywhere' }}>
            {CATALOG_CSV_HEADER}
          </code>
          <span className="t-xs t-muted">{t(K.bulk.formatHint)}</span>
        </div>
        <label className="stack gap-1">
          <span className="t-sm t-semibold">{t(K.bulk.pasteLabel)}</span>
          <TextArea rows={6} value={s.bulkText} onChange={(e) => s.setBulkInput(e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} />
        </label>
        <label className="t-sm">
          {t(K.bulk.chooseFile)}{' '}
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void s.readBulkFile(file);
            }}
          />
        </label>

        {preview !== null && (
          <section className="stack gap-2">
            {preview.length === 0 ? (
              <p className="t-sm t-warning">{t(K.bulk.noRows)}</p>
            ) : (
              <p className="t-sm">{t(K.bulk.summary, counts)}</p>
            )}
            {preview.map((r) => (
              <Card key={r.rowNumber}>
                <div className="row between gap-2" style={{ alignItems: 'flex-start' }}>
                  <span className="stack gap-1 grow" style={{ minWidth: 0 }}>
                    <span className="t-xs t-muted">
                      {t(K.bulk.rowLabel, { row: r.rowNumber })} · {t(K.bulk.action[r.action])}
                    </span>
                    <span className="t-sm t-semibold">{r.description || '—'}</span>
                    <span className="t-xs t-muted">
                      {r.category ? categoryLabel(r.category) : '—'} ·{' '}
                      <span className="num">{Number.isFinite(r.unitPrice) ? formatINR(r.unitPrice) : '—'}</span>
                      {r.currentPrice !== undefined && r.currentPrice !== r.unitPrice ? ` (${formatINR(r.currentPrice)})` : ''}
                    </span>
                  </span>
                  <Badge tone={r.verdict === 'ok' ? 'success' : r.verdict === 'review' ? 'warning' : 'error'}>
                    {t(K.bulk.verdict[r.verdict])}
                  </Badge>
                </div>
                {r.issues.length > 0 && (
                  <ul className="stack gap-1 mt-2">
                    {r.issues.map((key) => (
                      <li key={key} className={`t-xs row gap-1 ${r.verdict === 'invalid' ? 't-error' : 't-warning'}`}>
                        <Warning size={12} className="shrink-0" /> {t(`catalog.issue.${key}`)}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </section>
        )}
      </div>
    </Sheet>
  );
}
