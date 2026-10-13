import { useEffect, useRef, useState } from 'react';
import { Camera, Record, Stop } from '@phosphor-icons/react';
import { Button } from '@/design-system';
import type { FrameShape } from '@/features/technician/evidence';
import { VIDEO_MAX_SECONDS } from '@/features/technician/evidence';

/** The ghosted outline drawn over the viewfinder, so the technician knows what belongs in frame. It is part of the screen, never of the picture. */
export function FramingGuide({ shape }: { shape: FrameShape }) {
  const line = { fill: 'none', stroke: 'var(--color-accent-primary)', strokeWidth: 1.5, strokeDasharray: '5 4', vectorEffect: 'non-scaling-stroke' } as const;
  return (
    <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid meet" aria-hidden="true" data-frame={shape} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.9 }}>
      {shape === 'wide' && (
        <>
          <rect x="14" y="8" width="132" height="74" rx="4" {...line} />
          <path d="M80 38v14M73 45h14" {...line} />
        </>
      )}
      {shape === 'close' && (
        <>
          <circle cx="80" cy="45" r="30" {...line} />
          <path d="M80 30v30M65 45h30" {...line} />
        </>
      )}
      {shape === 'tall' && (
        <>
          <rect x="56" y="6" width="48" height="78" rx="3" {...line} />
          <path d="M80 6v78" {...line} />
        </>
      )}
      {shape === 'panel' && (
        <>
          <rect x="20" y="20" width="120" height="50" rx="3" {...line} />
          <rect x="40" y="32" width="80" height="26" rx="2" {...line} />
        </>
      )}
    </svg>
  );
}

export interface CaptureCameraLabels {
  shutter: string;
  record: string;
  stop: string;
  starting: string;
  unavailable: string;
  recording: string;
}

/**
 * A live viewfinder with the framing guide over it. It hands back a File exactly as the phone's own camera app would, so everything
 * after it (compression, quality check, the queue) does not care which route the picture came by. Where the browser has no camera or
 * it is refused, it says so and the screen offers the phone's camera app instead.
 */
export function CaptureCamera({ kind, shape, labels, onFile, onUnavailable }: { kind: 'photo' | 'video'; shape: FrameShape; labels: CaptureCameraLabels; onFile: (file: File) => void; onUnavailable: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const [state, setState] = useState<'starting' | 'live' | 'unavailable'>('starting');
  const [seconds, setSeconds] = useState<number | null>(null);
  const unavailable = useRef(onUnavailable);
  unavailable.current = onUnavailable;

  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState('unavailable');
        unavailable.current();
        return;
      }
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: kind === 'video' });
        if (cancelled) {
          s.getTracks().forEach((tr) => tr.stop());
          return;
        }
        stream.current = s;
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play().catch(() => undefined);
        }
        setState('live');
      } catch {
        if (!cancelled) {
          setState('unavailable');
          unavailable.current();
        }
      }
    }
    void start();
    return () => {
      cancelled = true;
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stream.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, [kind]);

  const snap = () => {
    const el = video.current;
    if (!el || !el.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = el.videoWidth;
    canvas.height = el.videoHeight;
    canvas.getContext('2d')?.drawImage(el, 0, 0);
    canvas.toBlob((blob) => blob && onFile(new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })), 'image/jpeg', 0.92);
  };

  const record = () => {
    if (!stream.current || typeof MediaRecorder === 'undefined') return;
    const chunks: BlobPart[] = [];
    const rec = new MediaRecorder(stream.current);
    recorder.current = rec;
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    rec.onstop = () => {
      window.clearInterval(tick);
      setSeconds(null);
      const type = rec.mimeType || 'video/webm';
      onFile(new File(chunks, `clip-${Date.now()}.${type.includes('mp4') ? 'mp4' : 'webm'}`, { type }));
    };
    const started = Date.now();
    const tick = window.setInterval(() => {
      const s = Math.floor((Date.now() - started) / 1000);
      setSeconds(s);
      // The clip stops itself at the limit rather than being refused afterwards.
      if (s >= VIDEO_MAX_SECONDS && rec.state === 'recording') rec.stop();
    }, 250);
    setSeconds(0);
    rec.start();
  };

  const stop = () => recorder.current?.state === 'recording' && recorder.current.stop();

  if (state === 'unavailable') return <p className="t-sm t-muted" role="status">{labels.unavailable}</p>;
  return (
    <div className="stack gap-2">
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <video ref={video} muted playsInline aria-label={labels.shutter} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {state === 'live' && <FramingGuide shape={shape} />}
        {state === 'starting' && <span className="t-sm t-muted" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>{labels.starting}</span>}
        {seconds !== null && (
          <span className="t-sm t-semibold" role="status" style={{ position: 'absolute', top: 8, left: 8, padding: '2px 8px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', color: 'var(--color-error)' }}>
            <Record size={12} weight="fill" aria-hidden="true" /> {labels.recording} {seconds}s / {VIDEO_MAX_SECONDS}s
          </span>
        )}
      </div>
      {kind === 'photo' ? (
        <Button block disabled={state !== 'live'} icon={<Camera size={18} aria-hidden="true" />} onClick={snap}>
          {labels.shutter}
        </Button>
      ) : seconds === null ? (
        <Button block disabled={state !== 'live'} icon={<Record size={18} weight="fill" aria-hidden="true" />} onClick={record}>
          {labels.record}
        </Button>
      ) : (
        <Button block variant="danger" icon={<Stop size={18} weight="fill" aria-hidden="true" />} onClick={stop}>
          {labels.stop}
        </Button>
      )}
    </div>
  );
}
