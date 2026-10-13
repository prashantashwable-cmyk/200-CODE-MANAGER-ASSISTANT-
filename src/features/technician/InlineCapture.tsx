import { useRef, useState } from 'react';
import { Camera, CheckCircle, VideoCamera, Warning } from '@phosphor-icons/react';
import { Button } from '@/design-system';
import type { SopMediaInput } from '@/data/repository';
import { evidenceProblem, kb } from '@/features/technician/evidence';
import { currentPlace, prepareStill, prepareVideo } from '@/features/technician/mediaCapture';
import type { PreparedStill, PreparedVideo } from '@/features/technician/mediaCapture';

export interface InlineCaptureLabels {
  add: string;
  retake: string;
  keep: string;
  keepAnyway: string;
  preparing: string;
  unreadable: string;
  wrongKind: string;
  tooLong: string;
  tooLarge: string;
  quality: { blurry: string; dark: string; glare: string; unchecked: string };
}

type Draft = { prepared: PreparedStill | PreparedVideo; takenAt: string; place?: { lat: number; lng: number } };

/**
 * A capture control that sits inside a step, not on a screen of its own (126): the phone's own camera opens, the picture is made small
 * and checked (blur, dark, glare: advice only), and the person keeps it or retakes it right there. What is kept is handed back with the
 * moment it was taken, exactly as the full capture screen (124) does, so it lands in the same evidence record.
 */
export function InlineCapture({ kind, labels, disabled, replacing, onKeep }: { kind: 'photo' | 'video'; labels: InlineCaptureLabels; disabled?: boolean; replacing?: boolean; onKeep: (media: Omit<SopMediaInput, 'capturedAt'>, takenAt: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const Icon = kind === 'video' ? VideoCamera : Camera;

  const receive = async (file: File) => {
    setBusy(true);
    setProblem(null);
    const takenAt = new Date().toISOString();
    const place = currentPlace();
    try {
      if (kind === 'video' ? !file.type.startsWith('video/') : !file.type.startsWith('image/')) throw new Error('wrong_kind');
      const prepared = kind === 'video' ? await prepareVideo(file) : await prepareStill(file);
      const bad = evidenceProblem(kind, { kind: prepared.kind, mimeType: prepared.mimeType, sizeBytes: prepared.sizeBytes, durationS: prepared.kind === 'video' ? prepared.durationS : undefined });
      if (bad) {
        setProblem(bad === 'video_too_long' ? labels.tooLong : bad === 'video_too_large' ? labels.tooLarge : labels.wrongKind);
        return;
      }
      setDraft({ prepared, takenAt });
      void place.then((p) => p && setDraft((d) => (d ? { ...d, place: p } : d)));
    } catch (e) {
      setProblem(e instanceof Error && e.message === 'wrong_kind' ? labels.wrongKind : labels.unreadable);
    } finally {
      setBusy(false);
    }
  };

  const keep = () => {
    if (!draft) return;
    const p = draft.prepared;
    onKeep({ kind: p.kind, fileName: p.fileName, previewUrl: p.previewUrl, ...(p.kind === 'video' ? { mediaUrl: p.mediaUrl, durationS: p.durationS } : {}), mimeType: p.mimeType, sizeBytes: p.sizeBytes, ...(draft.place ? { location: draft.place } : {}) }, draft.takenAt);
    setDraft(null);
  };

  const quality = draft?.prepared.kind === 'photo' && draft.prepared.quality !== 'ok' ? (draft.prepared.quality === 'unreadable' ? 'unchecked' : draft.prepared.quality) : null;

  return (
    <div className="stack gap-2" data-inline-capture={kind}>
      <input
        ref={input}
        type="file"
        accept={kind === 'video' ? 'video/*' : 'image/*'}
        capture="environment"
        hidden
        data-testid="inline-capture-file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void receive(file);
        }}
      />
      {draft ? (
        <div className="stack gap-2">
          {draft.prepared.kind === 'video' ? (
            <video src={draft.prepared.mediaUrl} poster={draft.prepared.previewUrl} controls playsInline style={{ width: '100%', maxHeight: 220, borderRadius: 'var(--radius-md)', background: 'var(--color-surface-alt)' }} />
          ) : (
            <img src={draft.prepared.previewUrl} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-alt)' }} />
          )}
          <span className="t-xs t-muted">{kb(draft.prepared.sizeBytes)}{draft.prepared.kind === 'video' ? ` · ${draft.prepared.durationS}s` : ''}</span>
          {quality && (
            <p className="t-xs t-warning row-top gap-2" role="status">
              <Warning size={16} className="shrink-0" aria-hidden="true" /> {labels.quality[quality]}
            </p>
          )}
          <div className="row gap-2 wrap">
            <Button size="sm" variant="secondary" onClick={() => setDraft(null)}>
              {labels.retake}
            </Button>
            <Button size="sm" icon={<CheckCircle size={16} aria-hidden="true" />} onClick={keep}>
              {quality ? labels.keepAnyway : labels.keep}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Button size="sm" variant={replacing ? 'ghost' : 'secondary'} disabled={disabled || busy} icon={<Icon size={16} aria-hidden="true" />} onClick={() => input.current?.click()}>
            {busy ? labels.preparing : replacing ? labels.retake : labels.add}
          </Button>
        </div>
      )}
      {problem && (
        <p className="t-xs t-error" role="alert">
          {problem}
        </p>
      )}
    </div>
  );
}
