import { useCallback, useEffect, useRef } from 'react';
import { Button } from './Button';

interface SignaturePadProps {
  /** A PNG data URL, or '' when nothing has been drawn. */
  value: string;
  onChange: (dataUrl: string) => void;
  /** Already translated. */
  clearLabel: string;
  height?: number;
  disabled?: boolean;
}

/**
 * A finger/stylus signature pad — one continuous ink stroke on a plain
 * canvas. Kept as a single flat PNG rather than stroke vector data: this
 * build has no server to persist richer data to, and a flattened image is
 * exactly what a signed document needs to embed.
 */
export function SignaturePad({ value, onChange, clearLabel, height = 160, disabled }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);
    return () => window.removeEventListener('resize', sizeCanvas);
  }, [sizeCanvas]);

  useEffect(() => {
    if (value) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [value]);

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = pointFromEvent(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const last = lastPointRef.current;
    if (!canvas || !ctx || !last) return;
    const point = pointFromEvent(e);
    // Canvas can't resolve a CSS variable directly, so the ink colour is
    // read from the canvas's own computed `color` (set via the `color`
    // style below) rather than hardcoded.
    ctx.strokeStyle = getComputedStyle(canvas).color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div className="stack gap-2">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          width: '100%',
          height,
          touchAction: 'none',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          color: 'var(--color-text-primary)',
          cursor: disabled ? 'default' : 'crosshair',
          opacity: disabled ? 0.6 : 1,
        }}
      />
      <Button size="sm" variant="ghost" type="button" disabled={disabled || !value} onClick={clear}>
        {clearLabel}
      </Button>
    </div>
  );
}
