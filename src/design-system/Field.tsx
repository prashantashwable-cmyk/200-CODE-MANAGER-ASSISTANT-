import { useId } from 'react';
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { Check } from '@phosphor-icons/react';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

/** Label + hint + error wrapper. Text arrives already translated. */
export function Field({ label, hint, error, required, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="ds-field">
      <label className="ds-field__label" htmlFor={id}>
        {label}
        {required && (
          <span className="t-error" aria-hidden="true">
            {' *'}
          </span>
        )}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error && (
        <span className="ds-field__error" id={errorId} role="alert">
          {error}
        </span>
      )}
      {hint && !error && (
        <span className="ds-field__hint" id={hintId}>
          {hint}
        </span>
      )}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; mono?: boolean };

export function Input({ invalid, mono, className = '', ...rest }: InputProps) {
  return (
    <input
      className={`ds-input ${invalid ? 'ds-input--invalid' : ''} ${
        mono ? 'ds-input--mono' : ''
      } ${className}`.trim()}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export function TextArea({ invalid, className = '', ...rest }: TextAreaProps) {
  return (
    <textarea
      className={`ds-input ${invalid ? 'ds-input--invalid' : ''} ${className}`.trim()}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export function Select({ invalid, className = '', children, ...rest }: SelectProps) {
  return (
    <select
      className={`ds-input ${invalid ? 'ds-input--invalid' : ''} ${className}`.trim()}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <div className="row between gap-3">
      <div className="stack gap-1 grow">
        <span className="t-medium">{label}</span>
        {description && <span className="t-xs t-muted">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className="ds-toggle"
        onClick={() => onChange(!checked)}
      >
        <span className="ds-toggle__knob" />
      </button>
    </div>
  );
}

interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <label className="row-top gap-3" style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        className="ds-check"
        // Cancelling the click stops the wrapping <label> from re-dispatching
        // it to this button — otherwise tapping the tick itself toggled twice
        // and a checked box could never be unticked by tapping it.
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
      >
        {checked && <Check size={15} weight="bold" style={{ pointerEvents: 'none' }} />}
      </button>
      <span className="t-sm grow">{label}</span>
    </label>
  );
}
