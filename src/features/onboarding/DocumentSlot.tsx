import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, CheckCircle, Trash, Warning } from '@phosphor-icons/react';
import { Badge, Button, Card } from '@/design-system';
import { analyseImage } from './imageQuality';
import type { ImageQualityVerdict } from './imageQuality';

/**
 * One camera-first document capture slot, shared by all three partner wizards.
 *
 * The picked file is analysed for blur and glare before it is accepted, and a
 * failing photo gets a specific retake instruction rather than a generic error.
 *
 * STORAGE: the file never leaves the tab. There is no storage bucket wired up
 * in this build, so an accepted document is held as an object URL for preview
 * and its metadata goes into the draft. See BUILD_README.md.
 */

export interface DocumentSlotValue {
  fileName: string;
  capturedAt: string;
  previewUrl: string;
}

interface DocumentSlotProps {
  /** Already-translated label, e.g. "Aadhaar (front)". */
  label: string;
  hint?: string;
  required?: boolean;
  value: DocumentSlotValue | null;
  onChange: (value: DocumentSlotValue | null) => void;
  /** Set when an admin has looked at it; drives the verified badge. */
  verified?: boolean;
  /** Accept non-image files too, e.g. a supplier's catalogue spreadsheet. */
  accept?: string;
  /** Skip the photo-quality gate for non-image uploads. */
  skipQualityCheck?: boolean;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function DocumentSlot({
  label,
  hint,
  required,
  value,
  onChange,
  verified,
  accept = 'image/*',
  skipQualityCheck,
}: DocumentSlotProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [checking, setChecking] = useState(false);
  const [rejection, setRejection] = useState<ImageQualityVerdict | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  // The preview is a data URL, not an object URL: evidence (a delivery photo) is kept and shown by
  // other screens long after this slot has unmounted, and an object URL would be revoked with it.

  const pick = useCallback(
    async (file: File) => {
      setRejection(null);
      setUnsupported(false);

      const isImage = file.type.startsWith('image/');
      if (!skipQualityCheck && !isImage) {
        setUnsupported(true);
        return;
      }

      setChecking(true);
      try {
        if (isImage && !skipQualityCheck) {
          const quality = await analyseImage(file);
          if (quality.verdict !== 'ok') {
            setRejection(quality.verdict);
            return;
          }
        }
        const previewUrl = isImage ? await readAsDataUrl(file) : '';
        onChange({ fileName: file.name, capturedAt: new Date().toISOString(), previewUrl });
      } catch {
        setRejection('unreadable');
      } finally {
        setChecking(false);
      }
    },
    [onChange, skipQualityCheck],
  );

  const remove = useCallback(() => {
    setRejection(null);
    onChange(null);
  }, [onChange]);

  return (
    <Card>
      <div className="row between gap-3">
        <span className="stack gap-1 grow">
          <span className="t-sm t-semibold">
            {label}
            {required && <span className="t-error"> *</span>}
          </span>
          {hint && <span className="t-xs t-muted">{hint}</span>}
        </span>
        {value ? (
          <Badge tone={verified ? 'success' : 'warning'} dot>
            {verified ? t('status.verified') : t('status.pending')}
          </Badge>
        ) : (
          <Badge tone="neutral">{t('docSlot.missing')}</Badge>
        )}
      </div>

      {value?.previewUrl && (
        <img
          src={value.previewUrl}
          alt={label}
          className="mt-3 full-w"
          style={{
            maxHeight: 180,
            objectFit: 'cover',
            borderRadius: 'var(--radius-control)',
            border: '1px solid var(--color-border)',
          }}
        />
      )}

      {value && !value.previewUrl && (
        <p className="t-xs t-muted mt-2 truncate">{value.fileName}</p>
      )}

      {rejection && (
        <p className="t-xs t-error mt-2 row gap-2" role="alert">
          <Warning size={15} className="shrink-0" />
          {t(`docSlot.reject.${rejection}`)}
        </p>
      )}
      {unsupported && (
        <p className="t-xs t-error mt-2" role="alert">
          {t('docSlot.reject.unsupportedFormat')}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture={accept.startsWith('image') ? 'environment' : undefined}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void pick(file);
          // Reset so picking the same file twice still fires a change.
          e.target.value = '';
        }}
      />

      <div className="row gap-2 mt-3">
        <Button
          size="sm"
          variant={value ? 'ghost' : 'primary'}
          loading={checking}
          icon={<Camera size={16} />}
          onClick={() => inputRef.current?.click()}
        >
          {value ? t('action.retake') : t('action.upload')}
        </Button>
        {value && (
          <Button size="sm" variant="quiet" icon={<Trash size={16} />} onClick={remove}>
            {t('action.delete')}
          </Button>
        )}
        {value && !rejection && (
          <span className="row gap-1 t-xs t-success">
            <CheckCircle size={14} weight="fill" />
            {t('docSlot.qualityOk')}
          </span>
        )}
      </div>
    </Card>
  );
}
