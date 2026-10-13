import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DownloadSimple, Plus, ShieldWarning } from '@phosphor-icons/react';
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
  formatDate,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { OptOutChannel, OptOutEvent } from '@/data/types';
import { useOptOutManager } from './useOptOutManager';
import type { ContactRow } from './useOptOutManager';
import { CHANNELS, OPT_OUT_CHANNEL_OPTIONS, OPT_OUT_MANAGER_KEYS as K, OPT_OUT_SOURCES } from './opt-out-manager.types';
import type { ChannelComplianceStatus, ContactFilter } from './opt-out-manager.types';

const STATUS_TONE: Record<ChannelComplianceStatus, BadgeTone> = {
  dnd: 'error',
  opted_out: 'warning',
  clear: 'success',
};

const FILTERS: ContactFilter[] = ['all', 'dnd', 'opted_out', 'clear'];

export function OptOutManagerView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useOptOutManager();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<OptOutChannel>('all');
  const [type, setType] = useState<OptOutEvent['type']>('opted_out');
  const [source, setSource] = useState<OptOutEvent['source']>('customer_request');
  const [reason, setReason] = useState('');

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

  const resetForm = () => {
    setName('');
    setPhone('');
    setChannel('all');
    setType('opted_out');
    setSource('customer_request');
    setReason('');
  };

  return (
    <Screen>
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          <Button variant="ghost" size="sm" icon={<DownloadSimple size={16} />} onClick={s.exportAudit}>
            {t(K.exportAudit)}
          </Button>
        }
      />

      <Input
        placeholder={t(K.searchPlaceholder)}
        value={s.query}
        onChange={(e) => s.setQuery(e.target.value)}
        className="mb-3"
      />

      <div className="row wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <Chip key={f} pressed={s.filter === f} onClick={() => s.setFilter(f)}>
            {t(K.filter[f])}
          </Chip>
        ))}
      </div>

      <Card className="mb-4" onClick={() => { resetForm(); s.openSheet(); }}>
        <div className="row gap-3">
          <Plus size={22} className="t-emerald" />
          <span className="t-sm t-medium">{t(K.addEntry)}</span>
        </div>
      </Card>

      {s.rows.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} icon={<ShieldWarning size={26} />} />
      ) : (
        <div className="stack gap-2">
          {s.rows.map((row: ContactRow) => (
            <Card key={row.contactPhone}>
              <div className="row between items-start gap-3 mb-2">
                <div className="stack gap-1" style={{ minWidth: 0 }}>
                  <span className="t-sm t-semibold truncate">{row.contactName}</span>
                  <span className="t-xs t-muted truncate">{row.contactPhone}</span>
                </div>
                <Badge tone={STATUS_TONE[row.worstStatus]}>{t(K.status[row.worstStatus])}</Badge>
              </div>

              <div className="stack gap-1">
                {CHANNELS.filter((c) => row.perChannel[c]).map((c) => {
                  const info = row.perChannel[c];
                  if (!info) return null;
                  return (
                    <div key={c} className="row between gap-2">
                      <span className="t-xs t-muted">
                        {t(K.channelStatusLine, { channel: t(`commChannel.${c}`), status: t(K.status[info.status]) })}
                      </span>
                      <span className="t-xs t-muted">{formatDate(info.at, i18n.language)}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={s.sheetOpen} onClose={s.closeSheet} title={t(K.sheet.title)} closeLabel={t('action.close')}>
        <div className="stack gap-3">
          <div className="stack gap-1">
            <span className="label">{t(K.sheet.nameLabel)}</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.sheet.phoneLabel)}</span>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.sheet.channelLabel)}</span>
            <Select value={channel} onChange={(e) => setChannel(e.target.value as OptOutChannel)}>
              {OPT_OUT_CHANNEL_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? t(K.filter.all) : t(`commChannel.${c}`)}
                </option>
              ))}
            </Select>
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.sheet.typeLabel)}</span>
            <div className="row gap-2">
              <Chip pressed={type === 'opted_out'} onClick={() => setType('opted_out')}>
                {t(K.sheet.typeOptOut)}
              </Chip>
              <Chip pressed={type === 'opted_in'} onClick={() => setType('opted_in')}>
                {t(K.sheet.typeOptIn)}
              </Chip>
            </div>
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.sheet.sourceLabel)}</span>
            <Select value={source} onChange={(e) => setSource(e.target.value as OptOutEvent['source'])}>
              {OPT_OUT_SOURCES.map((src) => (
                <option key={src} value={src}>
                  {t(K.source[src])}
                </option>
              ))}
            </Select>
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.sheet.reasonLabel)}</span>
            <TextArea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <p className="t-xs t-muted">{t(K.sheet.transactionalHint)}</p>
          <Button
            block
            disabled={!name.trim() || !phone.trim()}
            onClick={() =>
              void s
                .addEntry({ contactName: name.trim(), contactPhone: phone.trim(), channel, type, source, reason: reason.trim() || undefined })
                .then((ok) => toast.push(t(ok ? K.toast.saved : K.toast.error), ok ? 'success' : 'error'))
            }
          >
            {t(K.sheet.save)}
          </Button>
        </div>
      </Sheet>
    </Screen>
  );
}
