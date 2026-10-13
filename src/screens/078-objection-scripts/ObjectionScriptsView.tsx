import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowSquareOut, Copy, MagnifyingGlass, Plus, Robot, ShieldCheck } from '@phosphor-icons/react';
import {
  ActionBar,
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
  SegBar,
  Select,
  Sheet,
  TextArea,
  formatDate,
  useToast,
} from '@/design-system';
import type { ObjectionScriptListItem } from '@/data/repository';
import { useObjectionScripts } from './useObjectionScripts';
import { OBJECTION_CATEGORIES, OBJECTION_SCRIPTS_KEYS as K, STATUS_TABS, SWIPE_REVEAL_PX } from './objection-scripts.types';

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

interface RowProps {
  item: ObjectionScriptListItem;
  onOpen: () => void;
  onCopy: () => void;
  copyLabel: string;
  categoryLabel: string;
  usedByBotLabel: string;
  scoreNode: React.ReactNode;
}

/** A row that reveals a "Copy" quick action on a left swipe — the natural
 *  action for a sales rep mid-call who just needs the wording, not the
 *  full detail sheet. Contained to this screen; no shared swipe primitive
 *  exists in the design system yet. */
function ObjectionScriptRow({ item, onOpen, onCopy, copyLabel, categoryLabel, usedByBotLabel, scoreNode }: RowProps) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const moved = useRef(false);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    startX.current = e.clientX;
    moved.current = false;
    setDragging(true);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 6) moved.current = true;
    setDragX(Math.max(-SWIPE_REVEAL_PX, Math.min(0, delta)));
  };
  const endDrag = () => {
    setDragX((x) => (x < -SWIPE_REVEAL_PX / 2 ? -SWIPE_REVEAL_PX : 0));
    startX.current = null;
    setDragging(false);
  };
  const handleClick = () => {
    if (moved.current) {
      moved.current = false;
      return;
    }
    onOpen();
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: SWIPE_REVEAL_PX,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-accent-secondary)',
        }}
      >
        <button
          type="button"
          aria-label={copyLabel}
          className="tappable"
          style={{ color: 'var(--color-surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none' }}
          onClick={() => {
            onCopy();
            setDragX(0);
          }}
        >
          <Copy size={18} />
        </button>
      </div>
      <div
        className="ds-listrow"
        role="button"
        tabIndex={0}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? 'none' : 'transform 0.15s ease',
          touchAction: 'pan-y',
          cursor: 'pointer',
          background: 'var(--color-surface)',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={handleClick}
        onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      >
        <span className="grow stack gap-1" style={{ minWidth: 0 }}>
          <span className="t-medium truncate row gap-1 items-center">
            {categoryLabel}
            {item.usedByBot && <Robot size={13} className="t-emerald shrink-0" aria-label={usedByBotLabel} />}
          </span>
          <span className="t-xs t-muted truncate">{item.script.responseText}</span>
        </span>
        {scoreNode}
      </div>
    </div>
  );
}

export function ObjectionScriptsView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useObjectionScripts();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={6} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const scoreNode = (item: ObjectionScriptListItem) =>
    item.effectivenessScore === null ? (
      <Badge tone="neutral">{t(K.effectiveness.noData)}</Badge>
    ) : (
      <Badge tone={item.effectivenessScore >= 50 ? 'success' : item.effectivenessScore >= 25 ? 'warning' : 'neutral'}>
        {t(K.effectiveness.score, { score: item.effectivenessScore })}
      </Badge>
    );

  const current = s.current;

  return (
    <Screen className="pb-action-bar">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <div className="mb-3" style={{ position: 'relative' }}>
        <MagnifyingGlass size={16} className="t-muted" style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <Input placeholder={t(K.searchPlaceholder)} value={s.query} onChange={(e) => s.setQuery(e.target.value)} style={{ paddingLeft: 'calc(var(--space-3) * 2 + 16px)' }} />
      </div>

      <div className="mb-3">
        <SegBar
          label={t(K.title)}
          value={s.statusFilter}
          onChange={(id) => s.setStatusFilter(id as never)}
          items={STATUS_TABS.map((st) => ({ id: st, label: t(K.statusTab[st]) }))}
        />
      </div>

      <div className="row wrap gap-2 mb-4">
        {OBJECTION_CATEGORIES.map((c) => (
          <Chip key={c} pressed={s.categoryFilter === c} onClick={() => s.setCategoryFilter(s.categoryFilter === c ? null : c)}>
            {t(K.category[c])}
          </Chip>
        ))}
      </div>

      {s.items.length === 0 ? (
        <EmptyState
          title={s.query ? t(K.noResults.title) : t(K.empty.title)}
          body={s.query ? t(K.noResults.body) : t(K.empty.body)}
        />
      ) : (
        <Card flush>
          {s.items.map((item) => (
            <ObjectionScriptRow
              key={item.script.id}
              item={item}
              onOpen={() => s.openDetail(item.script.id)}
              onCopy={() => void copyToClipboard(item.script.responseText).then((ok) => toast.push(t(ok ? K.toast.copied : K.toast.error), ok ? 'success' : 'error'))}
              copyLabel={t(K.row.copy)}
              categoryLabel={t(K.category[item.script.category])}
              usedByBotLabel={t(K.row.usedByBot)}
              scoreNode={scoreNode(item)}
            />
          ))}
        </Card>
      )}

      <ActionBar>
        <Button block icon={<Plus size={16} />} onClick={s.openAdd}>
          {t(K.addScript.button)}
        </Button>
      </ActionBar>

      <Sheet
        open={s.openId !== null}
        onClose={s.closeDetail}
        title={current ? t(K.category[current.script.category]) : ''}
        closeLabel={t('action.close')}
        footer={
          current && (
            <div className="stack gap-2">
              {s.editing ? (
                <div className="row gap-2">
                  <Button block variant="secondary" onClick={s.cancelEdit}>
                    {t('action.cancel')}
                  </Button>
                  <Button
                    block
                    disabled={!s.draftResponse.trim()}
                    onClick={() => void s.saveEdit().then((ok) => toast.push(t(ok ? K.toast.saved : K.toast.error), ok ? 'success' : 'error'))}
                  >
                    {t(K.detail.saveEdit)}
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    block
                    icon={<Copy size={16} />}
                    onClick={() => void copyToClipboard(current.script.responseText).then((ok) => toast.push(t(ok ? K.toast.copied : K.toast.error), ok ? 'success' : 'error'))}
                  >
                    {t(K.detail.copyResponse)}
                  </Button>
                  <div className="row gap-2">
                    <Button block variant="secondary" onClick={s.startEdit}>
                      {t(K.detail.editResponse)}
                    </Button>
                    {current.script.status === 'suggested' && (
                      <Button block onClick={() => void s.approve(current.script.id).then((ok) => toast.push(t(ok ? K.toast.approved : K.toast.error), ok ? 'success' : 'error'))}>
                        {t(K.detail.approve)}
                      </Button>
                    )}
                    {current.script.status === 'archived' ? (
                      <Button block variant="secondary" onClick={() => void s.restore(current.script.id).then((ok) => toast.push(t(ok ? K.toast.restored : K.toast.error), ok ? 'success' : 'error'))}>
                        {t(K.detail.restore)}
                      </Button>
                    ) : (
                      <Button block variant="secondary" onClick={() => void s.archive(current.script.id).then((ok) => toast.push(t(ok ? K.toast.archived : K.toast.error), ok ? 'success' : 'error'))}>
                        {t(K.detail.archive)}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        }
      >
        {current && (
          <div className="stack gap-4">
            {current.usedByBot && (
              <Card>
                <div className="row gap-2 items-start">
                  <Robot size={18} className="t-emerald shrink-0 mt-1" />
                  <div className="stack gap-2">
                    <p className="t-sm">{t(K.detail.usedByBotBanner)}</p>
                    <button type="button" className="tappable t-xs t-accent row gap-1 items-center" onClick={() => navigate('/admin/deals/bot-config')}>
                      {t(K.detail.goToBotConfig)} <ArrowSquareOut size={13} />
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {s.editing ? (
              <div className="stack gap-1">
                <span className="label">{t(K.detail.responseLabel)}</span>
                <TextArea value={s.draftResponse} onChange={(e) => s.setDraftResponse(e.target.value)} rows={6} />
              </div>
            ) : (
              <Card>
                <p className="t-sm">{current.script.responseText}</p>
              </Card>
            )}

            {current.script.citedStandards && current.script.citedStandards.length > 0 && (
              <div className="stack gap-1">
                <span className="label">{t(K.detail.citedStandards)}</span>
                <div className="row wrap gap-2">
                  {current.script.citedStandards.map((std) => (
                    <Badge key={std} tone="success">
                      <span className="row gap-1 items-center">
                        <ShieldCheck size={12} /> {std}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {current.script.sourceNote && (
              <div className="stack gap-1">
                <span className="label">{t(K.detail.sourceNoteLabel)}</span>
                <p className="t-xs t-muted">{current.script.sourceNote}</p>
              </div>
            )}

            <div className="stack gap-1">
              <span className="label">{t(K.effectiveness.usageCount, { count: current.usageCount })}</span>
              {current.earlyData && <p className="t-xs t-warning">{t(K.effectiveness.earlyData)}</p>}
            </div>

            {current.territoryStats.length > 0 && (
              <div className="stack gap-1">
                <span className="label">{t(K.detail.territoryHeading)}</span>
                <div className="stack gap-2">
                  {current.territoryStats.map((ts) => (
                    <div key={ts.territory} className="row between items-center gap-2">
                      <span className="t-xs t-muted">{ts.territory}</span>
                      <span className="t-xs">
                        {t(K.detail.territoryRow, { count: ts.usageCount, score: ts.effectivenessScore ?? '—' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="stack gap-1">
              <span className="label">{t(K.detail.versionHistoryHeading)}</span>
              <div className="stack gap-2">
                {[...current.script.versions].reverse().map((v) => (
                  <span key={v.version} className="t-xs t-muted">
                    {t(K.detail.versionRow, { version: v.version, editor: v.editedBy, date: formatDate(v.editedAt, i18n.language) })}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Sheet>

      <Sheet
        open={s.addOpen}
        onClose={s.closeAdd}
        title={t(K.addScript.sheetTitle)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            disabled={!s.canSubmitNew}
            onClick={() => void s.submitNew().then((ok) => toast.push(t(ok ? K.toast.created : K.toast.error), ok ? 'success' : 'error'))}
          >
            {t(K.addScript.submit)}
          </Button>
        }
      >
        <div className="stack gap-4">
          <p className="t-sm t-muted">{t(K.addScript.sheetHint)}</p>
          <div className="stack gap-1">
            <span className="label">{t(K.addScript.categoryLabel)}</span>
            <Select value={s.draftCategory} onChange={(e) => s.setDraftCategory(e.target.value as never)}>
              {OBJECTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(K.category[c])}
                </option>
              ))}
            </Select>
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.addScript.responseLabel)}</span>
            <TextArea value={s.draftNewResponse} onChange={(e) => s.setDraftNewResponse(e.target.value)} rows={5} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.addScript.sourceNoteLabel)}</span>
            <TextArea value={s.draftSourceNote} onChange={(e) => s.setDraftSourceNote(e.target.value)} rows={2} />
            <span className="t-xs t-muted">{t(K.addScript.sourceNoteHint)}</span>
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
