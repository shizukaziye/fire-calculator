import { useEffect, useState } from 'react';

// Percent fields are stored as decimals (0.08) but edited in whole percents (8).
// dollarMonthly fields are stored as an ANNUAL amount but edited per month (÷12).
const toDisplay = (f, v) =>
  f.type === 'percent' ? +(v * 100).toFixed(4) : f.type === 'dollarMonthly' ? Math.round(v / 12) : v;
const fromDisplay = (f, dv) =>
  f.type === 'percent' ? dv / 100 : f.type === 'dollarMonthly' ? dv * 12 : dv;

export default function Field({ field, value, onChange, disabled = false }) {
  if (field.type === 'bool') {
    return (
      <div className={`flex items-center justify-between py-1.5 ${disabled ? 'opacity-40' : ''}`}>
        <span className="text-sm text-slate-300">{field.label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={value}
          aria-label={field.label}
          disabled={disabled}
          onClick={() => onChange(!value)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            disabled ? 'cursor-not-allowed' : ''
          } ${value ? 'bg-emerald-500' : 'bg-slate-600'}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
              value ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>
    );
  }

  const dv = toDisplay(field, value);

  // Local draft string so the user can clear/retype freely without the
  // controlled value snapping back mid-edit. Synced from props when not editing.
  const [draft, setDraft] = useState(String(dv));
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setDraft(String(dv));
  }, [dv, editing]);

  const commit = (raw) => {
    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') return;
    const num = Number(raw);
    if (!Number.isNaN(num)) onChange(fromDisplay(field, num));
  };

  const isPct = field.type === 'percent';
  const isUsd = field.type === 'dollar' || field.type === 'dollarMonthly';
  const isMonthly = field.type === 'dollarMonthly';
  const sliderValue = Math.min(Math.max(dv, field.min), field.max);

  return (
    <div className={`py-1.5 ${disabled ? 'opacity-40' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm text-slate-300">{field.label}</label>
        <div className="flex items-center gap-1">
          {isUsd && <span className="text-xs text-slate-500">$</span>}
          <input
            type="number"
            inputMode="decimal"
            value={draft}
            min={field.min}
            step={field.step}
            disabled={disabled}
            onFocus={() => setEditing(true)}
            onBlur={() => {
              setEditing(false);
              setDraft(String(toDisplay(field, value)));
            }}
            onChange={(e) => {
              setDraft(e.target.value);
              commit(e.target.value);
            }}
            className="w-24 rounded bg-slate-800 px-2 py-1 text-right text-sm tabular-nums text-slate-100 outline-none focus:ring-1 focus:ring-emerald-400 disabled:cursor-not-allowed"
          />
          {isPct && <span className="text-xs text-slate-500">%</span>}
          {isMonthly && <span className="text-xs text-slate-500">/mo</span>}
        </div>
      </div>
      <input
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        value={sliderValue}
        disabled={disabled}
        onChange={(e) => onChange(fromDisplay(field, Number(e.target.value)))}
        className="mt-1.5 w-full cursor-pointer accent-emerald-500 disabled:cursor-not-allowed"
        aria-label={field.label}
      />
    </div>
  );
}
