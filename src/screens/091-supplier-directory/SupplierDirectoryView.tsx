import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowsLeftRight, ChartLineUp, ChatCircleDots, CheckCircle, FileText, MagnifyingGlass, Package, Prohibit, ShieldCheck, ShieldWarning, Tag, UserPlus, XCircle } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  TextArea,
  Toggle,
  formatDate,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import { useSupplierDirectory } from './useSupplierDirectory';
import { KNOWN_DRIVE_TYPES, SUPPLIER_DIRECTORY_KEYS as K, SUPPLIER_HUB } from './supplier-directory.types';

const STATUS_TONE: Record<string, BadgeTone> = { active: 'success', pending_approval: 'warning', suspended: 'error' };
const KYC_TONE: Record<string, BadgeTone> = { pending: 'warning', approved: 'success', rejected: 'error' };

export function SupplierDirectoryView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const s = useSupplierDirectory();

  const specialtyLabel = (specialty: string) => ((KNOWN_DRIVE_TYPES as readonly string[]).includes(specialty) ? t(`driveType.${specialty}`) : specialty);

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={5} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  return (
    <Screen width="wide">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          <button type="button" className="tappable" aria-label={t(K.invite)} onClick={s.openInvite}>
            <UserPlus size={20} className="t-emerald" />
          </button>
        }
      />

      {/* The rest of the supplier module, one tap from its home. */}
      <nav aria-label={t(K.hub.label)} className="row gap-2 mb-3 ds-tabs--scroll" style={{ overflowX: 'auto' }}>
        {SUPPLIER_HUB.map((link) => (
          <Button key={link.key} size="sm" variant="secondary" className="shrink-0" onClick={() => navigate(link.path)}>
            {t(K.hub[link.key])}
          </Button>
        ))}
      </nav>

      <div className="mb-3" style={{ position: 'relative' }}>
        <MagnifyingGlass size={16} className="t-muted" style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <Input placeholder={t(K.searchPlaceholder)} value={s.searchQuery} onChange={(e) => s.setSearchQuery(e.target.value)} style={{ paddingLeft: 'calc(var(--space-3) * 2 + 16px)' }} />
      </div>

      {s.specialtyOptions.length > 0 && (
        <div className="row wrap gap-2 mb-2">
          <Chip pressed={s.specialtyFilter === null} onClick={() => s.setSpecialtyFilter(null)}>
            {t(K.filters.specialtyAll)}
          </Chip>
          {s.specialtyOptions.map((sp) => (
            <Chip key={sp} pressed={s.specialtyFilter === sp} onClick={() => s.setSpecialtyFilter(s.specialtyFilter === sp ? null : sp)}>
              {specialtyLabel(sp)}
            </Chip>
          ))}
        </div>
      )}

      {s.regionOptions.length > 0 && (
        <Select className="mb-4" value={s.regionFilter ?? ''} onChange={(e) => s.setRegionFilter(e.target.value || null)}>
          <option value="">{t(K.filters.regionAll)}</option>
          {s.regionOptions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </Select>
      )}

      {s.rows.length === 0 ? (
        <EmptyState icon={<UserPlus size={26} />} title={t(s.searchQuery || s.specialtyFilter || s.regionFilter ? K.noResults.title : K.empty.title)} body={t(s.searchQuery || s.specialtyFilter || s.regionFilter ? K.noResults.body : K.empty.body)} />
      ) : (
        <div className="stack gap-3">
          {s.rows.map((row) => (
            <Card key={row.supplier.id} onClick={() => s.openDetail(row)}>
              <div className="row between items-start gap-3">
                <div className="stack gap-1" style={{ minWidth: 0 }}>
                  <span className="t-medium truncate">{row.supplier.name}</span>
                  <span className="t-xs t-muted truncate">{row.supplier.city}</span>
                  <div className="row wrap gap-1 mt-1">
                    {row.supplier.driveTypeSpecialties.slice(0, 3).map((sp) => (
                      <span key={sp} className="t-xs t-muted" style={{ background: 'var(--color-bg)', borderRadius: 6, padding: '2px 6px' }}>
                        {specialtyLabel(sp)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="stack gap-1 items-end shrink-0">
                  <span className="num t-semibold t-sm">{row.performanceScore.toFixed(2)}</span>
                  <Badge tone={STATUS_TONE[row.supplier.status]}>{t(K.status[row.supplier.status])}</Badge>
                  <Badge tone={KYC_TONE[row.supplier.kycStatus]}>{t(K.kyc[row.supplier.kycStatus])}</Badge>
                </div>
              </div>
              {!row.eligibleForPO && (
                <p className="t-xs t-muted mt-2 row gap-1 items-center">
                  <ShieldWarning size={12} /> {t(K.row.notEligible)}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={s.openRow !== null}
        onClose={s.closeDetail}
        title={s.openRow?.supplier.name ?? ''}
        closeLabel={t('action.close')}
        footer={
          s.openRow && (
            <div className="stack gap-2">
              <Button block variant="ghost" icon={<Package size={16} />} onClick={() => navigate(`/catalog?supplierId=${s.openRow!.supplier.id}`)}>
                {t(K.detail.viewCatalog)}
              </Button>
              <Button block variant="ghost" icon={<ChartLineUp size={16} />} onClick={() => navigate(`/scorecard?supplierId=${s.openRow!.supplier.id}`)}>
                {t(K.detail.viewScorecard)}
              </Button>
              <Button block variant="ghost" icon={<FileText size={16} />} onClick={() => navigate(`/agreement?supplierId=${s.openRow!.supplier.id}`)}>
                {t(K.detail.viewAgreement)}
              </Button>
              <Button block variant="ghost" icon={<ChatCircleDots size={16} />} onClick={() => navigate(`/supplier-messages?supplierId=${s.openRow!.supplier.id}`)}>
                {t(K.detail.messages)}
              </Button>
              {s.openRow.supplier.kycStatus === 'pending' && (
                <div className="row gap-2">
                  <Button block icon={<CheckCircle size={16} />} loading={s.approvingKyc} onClick={() => void s.approveKyc().then((ok) => toast.push(t(ok ? K.toast.kycUpdated : K.toast.error), ok ? 'success' : 'error'))}>
                    {t(K.detail.approveKyc)}
                  </Button>
                  <Button block variant="ghost" icon={<XCircle size={16} />} loading={s.rejectingKyc} onClick={() => void s.rejectKyc().then((ok) => toast.push(t(ok ? K.toast.kycUpdated : K.toast.error), ok ? 'success' : 'error'))}>
                    {t(K.detail.rejectKyc)}
                  </Button>
                </div>
              )}
              {s.openRow.supplier.status !== 'suspended' && !s.openRow.supplier.mergedIntoSupplierId && (
                <div className="row gap-2">
                  <Button block variant="secondary" icon={<Tag size={16} />} onClick={s.openAddSpecialty}>
                    {t(K.detail.addSpecialty)}
                  </Button>
                  <Button block variant="secondary" icon={<ArrowsLeftRight size={16} />} disabled={s.mergeCandidates.length === 0} onClick={s.openMerge}>
                    {t(K.detail.mergeDuplicate)}
                  </Button>
                </div>
              )}
              {s.openRow.supplier.status === 'active' && (
                <Button block variant="danger" icon={<Prohibit size={16} />} onClick={s.openSuspend}>
                  {t(K.detail.suspend)}
                </Button>
              )}
            </div>
          )
        }
      >
        {s.openRow && (
          <div className="stack gap-3">
            <div className="row between t-sm">
              <span className="t-muted">{t(K.detail.performanceScoreLabel)}</span>
              <span className="num t-semibold">{s.openRow.performanceScore.toFixed(2)}</span>
            </div>
            <div className="row between t-sm">
              <span className="t-muted">{t(K.detail.contactLabel)}</span>
              <span>
                {s.openRow.supplier.contactName ? `${s.openRow.supplier.contactName} · ` : ''}
                {s.openRow.supplier.contactPhone ?? '—'}
              </span>
            </div>
            <Toggle
              checked={Boolean(s.openRow.supplier.isManufacturer)}
              onChange={(next) => void s.setManufacturer(next)}
              label={t(K.detail.manufacturer)}
              description={t(K.detail.manufacturerHint)}
            />
            <div className="stack gap-1">
              <span className="t-xs t-muted">{t(K.detail.categoriesLabel)}</span>
              <div className="row wrap gap-1">
                {s.openRow.supplier.categories.map((c) => (
                  <Badge key={c} tone="neutral">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="stack gap-1">
              <span className="t-xs t-muted">{t(K.detail.specialtiesLabel)}</span>
              <div className="row wrap gap-1">
                {s.openRow.supplier.driveTypeSpecialties.map((sp) => (
                  <Badge key={sp} tone="accent">
                    {specialtyLabel(sp)}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="stack gap-1">
              <span className="t-xs t-muted">{t(K.detail.regionsLabel)}</span>
              <div className="row wrap gap-1">
                {s.openRow.supplier.regionsServed.map((r) => (
                  <Badge key={r} tone="neutral">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
            {s.openRow.supplier.status === 'suspended' && s.openRow.supplier.suspendedReason && (
              <Card>
                <p className="t-sm t-error mb-1">{t(K.detail.suspendedNote)}</p>
                <p className="t-xs t-muted">
                  {s.openRow.supplier.suspendedReason} — {s.openRow.supplier.suspendedBy}, {s.openRow.supplier.suspendedAt ? formatDate(s.openRow.supplier.suspendedAt, i18n.language) : ''}
                </p>
              </Card>
            )}
            {s.openRow.supplier.mergedIntoSupplierId && (
              <Card>
                <p className="t-sm t-muted">{t(K.detail.mergedNote)}</p>
              </Card>
            )}
          </div>
        )}
      </Sheet>

      <Sheet
        open={s.inviteOpen}
        onClose={s.closeInvite}
        title={t(K.inviteSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            disabled={!s.inviteName.trim() || !s.inviteContactPhone.trim() || !s.inviteCity.trim()}
            loading={s.submittingInvite}
            onClick={() => void s.submitInvite().then((ok) => toast.push(t(ok ? K.toast.invited : K.toast.error), ok ? 'success' : 'error'))}
          >
            {t(K.inviteSheet.submit)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.inviteSheet.hint)}</p>
          <div className="stack gap-1">
            <span className="label">{t(K.inviteSheet.nameLabel)}</span>
            <Input value={s.inviteName} onChange={(e) => s.setInviteName(e.target.value)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.inviteSheet.contactNameLabel)}</span>
            <Input value={s.inviteContactName} onChange={(e) => s.setInviteContactName(e.target.value)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.inviteSheet.contactPhoneLabel)}</span>
            <Input value={s.inviteContactPhone} onChange={(e) => s.setInviteContactPhone(e.target.value)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.inviteSheet.cityLabel)}</span>
            <Input value={s.inviteCity} onChange={(e) => s.setInviteCity(e.target.value)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.inviteSheet.categoriesLabel)}</span>
            <Input value={s.inviteCategories} onChange={(e) => s.setInviteCategories(e.target.value)} placeholder={t(K.inviteSheet.categoriesHint)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.inviteSheet.specialtiesLabel)}</span>
            <Input value={s.inviteSpecialties} onChange={(e) => s.setInviteSpecialties(e.target.value)} placeholder={t(K.inviteSheet.specialtiesHint)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.inviteSheet.regionsLabel)}</span>
            <Input value={s.inviteRegions} onChange={(e) => s.setInviteRegions(e.target.value)} placeholder={t(K.inviteSheet.regionsHint)} />
          </div>
        </div>
      </Sheet>

      <Sheet
        open={s.suspendOpen}
        onClose={s.closeSuspend}
        title={t(K.suspendSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button block variant="danger" disabled={!s.suspendReason.trim()} loading={s.submittingSuspend} onClick={() => void s.submitSuspend().then((ok) => toast.push(t(ok ? K.toast.suspended : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.suspendSheet.submit)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.suspendSheet.hint)}</p>
          <div className="stack gap-1">
            <span className="label">{t(K.suspendSheet.reasonLabel)}</span>
            <TextArea value={s.suspendReason} onChange={(e) => s.setSuspendReason(e.target.value)} rows={3} />
          </div>
        </div>
      </Sheet>

      <Sheet
        open={s.addSpecialtyOpen}
        onClose={s.closeAddSpecialty}
        title={t(K.addSpecialtySheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button block disabled={!s.specialtyInput.trim()} loading={s.submittingSpecialty} onClick={() => void s.submitAddSpecialty().then((ok) => toast.push(t(ok ? K.toast.specialtyAdded : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.addSpecialtySheet.submit)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.addSpecialtySheet.hint)}</p>
          <div className="stack gap-1">
            <span className="label">{t(K.addSpecialtySheet.specialtyLabel)}</span>
            <Input value={s.specialtyInput} onChange={(e) => s.setSpecialtyInput(e.target.value)} list="known-drive-types" />
            <datalist id="known-drive-types">
              {KNOWN_DRIVE_TYPES.map((dt) => (
                <option key={dt} value={dt}>
                  {t(`driveType.${dt}`)}
                </option>
              ))}
            </datalist>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={s.mergeOpen}
        onClose={s.closeMerge}
        title={t(K.mergeSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button block variant="danger" disabled={!s.mergeCanonicalId} loading={s.submittingMerge} onClick={() => void s.submitMerge().then((ok) => toast.push(t(ok ? K.toast.merged : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.mergeSheet.submit)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.mergeSheet.hint, { name: s.openRow?.supplier.name ?? '' })}</p>
          <div className="stack gap-1">
            <span className="label">{t(K.mergeSheet.canonicalLabel)}</span>
            <Select value={s.mergeCanonicalId} onChange={(e) => s.setMergeCanonicalId(e.target.value)}>
              <option value="">—</option>
              {s.mergeCandidates.map((c) => (
                <option key={c.supplier.id} value={c.supplier.id}>
                  {c.supplier.name} ({c.supplier.city})
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
