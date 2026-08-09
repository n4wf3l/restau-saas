import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  name?: string;
  required?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Styled dark-theme dropdown that replaces native <select>.
 * - Trigger matches the app's input aesthetic (bordered, transparent bg)
 * - Panel opens below with cream-tinted options over coffee background
 * - Closes on outside click, Escape key, or option selection
 * - Hidden native <select> mirrors the value for form submission + a11y
 */
export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner…',
  name,
  required,
  className = '',
  ariaLabel,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* Hidden native select for form submission + native validation */}
      <select
        name={name}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Visible trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? placeholder}
        className={`w-full bg-transparent border border-subtle rounded-none px-4 py-3.5 text-sm font-body focus:outline-none focus:border-subtle transition-colors min-h-[48px] flex items-center justify-between gap-3 text-left ${
          selected ? 'text-primary' : 'text-tertiary'
        } ${open ? 'border-subtle' : ''}`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDownIcon
          className={`w-4 h-4 shrink-0 text-secondary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Options panel */}
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-30 max-h-64 overflow-y-auto bg-elevated border border-subtle shadow-2xl animate-dropdown-reveal"
        >
          {options.map((o) => {
            const isActive = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={isActive}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`px-4 py-3 text-sm font-body cursor-pointer flex items-center gap-2 transition-colors ${
                  isActive
                    ? 'bg-tint text-primary'
                    : 'text-primary hover:bg-tint hover:text-primary'
                }`}
              >
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />}
                <span className={isActive ? '' : 'ml-3.5'}>{o.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
