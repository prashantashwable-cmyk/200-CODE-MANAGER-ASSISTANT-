import { useRef } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  invalid?: boolean;
  disabled?: boolean;
  /** Already-translated accessible name for the group. */
  label: string;
  autoFocus?: boolean;
}

/**
 * Six separate auto-advancing boxes, never one text field — the auth screens
 * specify this explicitly. Handles paste of a full code, backspace stepping
 * back, and arrow-key movement.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  invalid,
  disabled,
  label,
  autoFocus,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const focusBox = (index: number) => {
    const clamped = Math.max(0, Math.min(length - 1, index));
    refs.current[clamped]?.focus();
    refs.current[clamped]?.select();
  };

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join('').slice(0, length));
  };

  return (
    <div className="ds-otp" role="group" aria-label={label}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          className={`ds-otp__box ${invalid ? 'ds-otp__box--invalid' : ''}`.trim()}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-label={`${label} ${index + 1}`}
          autoFocus={autoFocus && index === 0}
          value={digit}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '');
            if (!raw) {
              setDigit(index, '');
              return;
            }
            // A pasted full code lands in one box — spread it across the row.
            if (raw.length > 1) {
              const merged = (value.slice(0, index) + raw).slice(0, length);
              onChange(merged);
              focusBox(merged.length);
              return;
            }
            setDigit(index, raw);
            if (index < length - 1) focusBox(index + 1);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !digits[index] && index > 0) {
              e.preventDefault();
              setDigit(index - 1, '');
              focusBox(index - 1);
            }
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              focusBox(index - 1);
            }
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              focusBox(index + 1);
            }
          }}
        />
      ))}
    </div>
  );
}
