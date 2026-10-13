import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IssuerBlock } from '@/features/brand/IssuerBlock';
import { ClockCounterClockwise, FileText, Note, PenNib, WarningCircle } from '@phosphor-icons/react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  Sheet,
  TextArea,
  formatDate,
  useToast,
} from '@/design-system';
import { useContractGenerator } from './useContractGenerator';
import { CLAUSE_ORDER, CONTRACT_GENERATOR_KEYS as K } from './contract-generator.types';

export function ContractGeneratorView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useContractGenerator();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={4} />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.view) {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const { deal, lead, contract, priorVersions, canGenerate } = s.view;

  return (
    <Screen className={contract || canGenerate ? 'pb-action-bar' : ''}>
      <ScreenHeader
        title={lead.siteName}
        subtitle={deal.code}
        back={() => navigate(-1)}
        action={contract ? <Badge tone="success">{t(K.versionLabel, { n: contract.version })}</Badge> : undefined}
      />

      {!contract && !canGenerate && (
        <EmptyState
          title={t(K.notConfirmed.title)}
          body={t(K.notConfirmed.body)}
          actionLabel={t(K.notConfirmed.goToTerms)}
          onAction={() => navigate(`/admin/deals/${deal.id}/terms`)}
        />
      )}

      {!contract && canGenerate && (
        <Card>
          <div className="stack gap-2 items-start">
            <FileText size={24} className="t-emerald" />
            <span className="t-sm t-semibold">{t(K.readyToGenerate.title)}</span>
            <span className="t-sm t-muted">{t(K.readyToGenerate.body)}</span>
          </div>
        </Card>
      )}

      {contract && (
        <div className="stack gap-4 mb-4">
          <p className="t-xs t-muted">{t(K.generatedOn, { date: formatDate(contract.generatedAt, i18n.language) })}</p>
          <Card>
            <div className="stack gap-1">
              <span className="label">{t('brand.issuer.label')}</span>
              <IssuerBlock at={contract.generatedAt} />
            </div>
          </Card>

          {contract.usedStateClauseFallback && (
            <Card>
              <div className="row gap-2 items-start">
                <WarningCircle size={18} className="t-warning shrink-0" style={{ marginTop: 2 }} />
                <span className="t-sm">{t(K.fallbackBanner)}</span>
              </div>
            </Card>
          )}

          {CLAUSE_ORDER.map((key) => {
            const clause = contract.clauses.find((c) => c.key === key);
            if (!clause) return null;
            return (
              <div key={key}>
                <h2 className="t-lg mb-2">{t(K.clause[key])}</h2>
                <Card>
                  <p className="t-sm mb-3">{clause.plainLanguageSummary}</p>
                  <div className="hairline-top pt-2">
                    <span className="label">{t(K.legalTextLabel)}</span>
                    <p className="t-xs t-muted mt-1" style={{ lineHeight: 1.6 }}>
                      {clause.legalText}
                    </p>
                  </div>
                </Card>
              </div>
            );
          })}

          <div>
            <h2 className="t-lg mb-2 row gap-2 items-center">
              <Note size={18} className="t-emerald" />
              {t(K.addenda.heading)}
            </h2>
            <div className="stack gap-2">
              {contract.addenda.length === 0 && <p className="t-sm t-muted">{t(K.addenda.empty)}</p>}
              {contract.addenda.map((a) => (
                <Card key={a.id}>
                  <p className="t-sm mb-1">{a.note}</p>
                  <p className="t-xs t-muted">{t(K.addenda.addedBy, { date: formatDate(a.addedAt, i18n.language) })}</p>
                </Card>
              ))}
              <Button size="sm" variant="secondary" onClick={s.openAddendumSheet}>
                {t(K.addenda.addButton)}
              </Button>
            </div>
          </div>

          {priorVersions.length > 0 && (
            <div>
              <h2 className="t-lg mb-2 row gap-2 items-center">
                <ClockCounterClockwise size={18} className="t-emerald" />
                {t(K.priorVersions.heading)}
              </h2>
              <div className="stack gap-2">
                {[...priorVersions].reverse().map((v) => (
                  <Card key={v.id}>
                    <div className="row between items-center">
                      <span className="t-sm t-semibold">{t(K.versionLabel, { n: v.version })}</span>
                      <Badge tone="neutral">{t(K.priorVersions.supersededLabel)}</Badge>
                    </div>
                    <p className="t-xs t-muted mt-1">{t(K.generatedOn, { date: formatDate(v.generatedAt, i18n.language) })}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(contract || canGenerate) && (
        <ActionBar>
          <div className="row gap-2">
            {contract && (
              <Button
                variant="secondary"
                loading={s.generating}
                onClick={() => void s.generate().then((ok) => toast.push(t(ok ? K.toast.regenerated : K.toast.error), ok ? 'success' : 'error'))}
              >
                {t(K.actions.regenerate)}
              </Button>
            )}
            {!contract && canGenerate && (
              <Button
                block
                loading={s.generating}
                onClick={() => void s.generate().then((ok) => toast.push(t(ok ? K.toast.generated : K.toast.error), ok ? 'success' : 'error'))}
              >
                {t(K.actions.generate)}
              </Button>
            )}
            {contract && (
              <Button block icon={<PenNib size={16} />} onClick={() => navigate(`/admin/deals/${deal.id}/signature`)}>
                {t(K.actions.proceedToSignature)}
              </Button>
            )}
          </div>
        </ActionBar>
      )}

      <Sheet
        open={s.addendumSheetOpen}
        onClose={s.closeAddendumSheet}
        title={t(K.addenda.sheetTitle)}
        closeLabel={t('action.close')}
        footer={
          <Button block disabled={!s.addendumNote.trim()} loading={s.addingAddendum} onClick={() => void s.submitAddendum().then((ok) => toast.push(t(ok ? K.toast.addendumAdded : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.addenda.submit)}
          </Button>
        }
      >
        <div className="stack gap-1">
          <p className="t-xs t-muted mb-1">{t(K.addenda.sheetHint)}</p>
          <span className="label">{t(K.addenda.noteLabel)}</span>
          <TextArea rows={3} value={s.addendumNote} onChange={(e) => s.setAddendumNote(e.target.value)} />
        </div>
      </Sheet>
    </Screen>
  );
}
