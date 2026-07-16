// The headline plan choices — marry (and when), kids, rent vs buy (and when) —
// pulled out of the granular left panel so the big levers sit above the charts.
// They edit the same config keys, so everything stays in sync.

import { DEFAULTS } from '../fireModel';
import { HOUSING_PRESETS, METROS, presetPatch } from '../housingPresets';
import Field from './Field';

// Master knobs: drag one number and its whole group scales proportionally
// (preserving whatever ratios the granular sliders currently hold, so those
// sliders visibly move with the knob). If the anchor sits at 0 the current
// ratios are unknowable — fall back to the DEFAULTS ratios.
const scaleGroup = (config, anchorKey, otherKeys, newAnchor) => {
  const old = config[anchorKey];
  const patch = { [anchorKey]: newAnchor };
  for (const k of otherKeys) {
    patch[k] =
      old > 0 ? (config[k] * newAnchor) / old : (DEFAULTS[k] * newAnchor) / DEFAULTS[anchorKey];
  }
  return patch;
};

const LIFE_KNOB = { key: 'lifestyleSolo', label: 'Lifestyle cost (your base)', type: 'dollarMonthly', min: 0, max: 15_000, step: 100 };
const INCOME_KNOB = { key: 'incomeToday', label: 'Income (take-home / yr)', type: 'dollar', min: 0, max: 500_000, step: 5_000 };

const mo = (annual) => '$' + Math.round(annual / 12).toLocaleString() + '/mo';
const usd = (n) => '$' + Math.round(n).toLocaleString();

// Grouped dropdown of real markets; picking one sets house price + both rents
// in one go. Shows "Custom" whenever the sliders have been hand-tuned away
// from any preset.
function HousingPreset({ config, setFields }) {
  const current = config.housingPresetId;
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm text-slate-300" htmlFor="housing-preset">
          Housing market
        </label>
        <select
          id="housing-preset"
          value={current ?? 'custom'}
          onChange={(e) => {
            const p = HOUSING_PRESETS.find((x) => x.id === e.target.value);
            if (p) setFields(presetPatch(p));
          }}
          className="w-56 rounded bg-slate-800 px-2 py-1.5 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-emerald-400"
        >
          {!current && (
            <option value="custom" disabled>
              Custom (hand-tuned)
            </option>
          )}
          {METROS.map((metro) => (
            <optgroup key={metro} label={metro}>
              {HOUSING_PRESETS.filter((p) => p.metro === metro).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.rent3br.toLocaleString()}/mo
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        Sets house <span className="text-slate-400">{usd(config.housePrice)}</span> · 3BR{' '}
        <span className="text-slate-400">{mo(config.rentFamily)}</span> · 2BR{' '}
        <span className="text-slate-400">{mo(config.rentSolo)}</span> — 3BR ~2,000 sqft
        estimates off mid-2026 medians, fine-tune in the Housing panel.
      </p>
    </div>
  );
}

function Segmented({ value, options, onChange }) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-slate-700">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
            value === o.value
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function AgeInput({ value, onChange, disabled, label }) {
  return (
    <label className={`flex items-center gap-1.5 text-sm text-slate-400 ${disabled ? 'opacity-40' : ''}`}>
      {label}
      <input
        type="number"
        inputMode="numeric"
        min={18}
        max={90}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n) && e.target.value !== '') onChange(n);
        }}
        className="w-16 rounded bg-slate-800 px-2 py-1 text-right text-sm tabular-nums text-slate-100 outline-none focus:ring-1 focus:ring-emerald-400 disabled:cursor-not-allowed"
      />
    </label>
  );
}

function Stepper({ value, onChange, min, max }) {
  const btn =
    'h-7 w-7 rounded border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900';
  return (
    <div className="inline-flex items-center gap-2">
      <button type="button" className={btn} disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className="w-5 text-center text-sm font-semibold tabular-nums text-slate-100">{value}</span>
      <button type="button" className={btn} disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}

function Decision({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export default function BigDecisions({ config, setField, setFields }) {
  const retiredNow = config.retireAge <= config.currentAge;
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
        <Decision label="Ages">
          <AgeInput
            label="now"
            value={config.currentAge}
            onChange={(v) => setField('currentAge', v)}
          />
          <AgeInput
            label="retire at"
            value={config.retireAge}
            onChange={(v) => setField('retireAge', v)}
          />
          {retiredNow && (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300">
              retired
            </span>
          )}
        </Decision>
        <Decision label="Household">
          <Segmented
            value={config.willMarry}
            onChange={(v) => setField('willMarry', v)}
            options={[
              { value: false, label: 'Stay single' },
              { value: true, label: 'Marry' },
            ]}
          />
          <AgeInput
            label="at age"
            value={config.marriageAge}
            disabled={!config.willMarry}
            onChange={(v) => setField('marriageAge', v)}
          />
        </Decision>
        <Decision label="Kids">
          <Stepper
            value={config.numKids}
            min={0}
            max={6}
            onChange={(v) => setField('numKids', v)}
          />
          <AgeInput
            label="first at your age"
            value={config.kidAtAge}
            disabled={config.numKids === 0}
            onChange={(v) => setField('kidAtAge', v)}
          />
        </Decision>
        <Decision label="Housing">
          <Segmented
            value={config.buyHome}
            onChange={(v) => setField('buyHome', v)}
            options={[
              { value: false, label: 'Rent' },
              { value: true, label: 'Buy' },
            ]}
          />
          <AgeInput
            label="buy at age"
            value={config.buyAge}
            disabled={!config.buyHome}
            onChange={(v) => setField('buyAge', v)}
          />
        </Decision>
      </div>

      <div className="mt-4 grid gap-x-10 gap-y-2 border-t border-slate-800 pt-2 lg:grid-cols-3">
        <div className={retiredNow ? 'opacity-40' : ''}>
          <Field
            field={INCOME_KNOB}
            value={config.incomeToday}
            onChange={(v) => setField('incomeToday', v)}
            disabled={retiredNow}
          />
          <p className="text-xs text-slate-500">
            Take-home while working (to {config.retireAge}). Gross → take-home helper is in
            the left panel.
          </p>
        </div>
        <div>
          <Field
            field={LIFE_KNOB}
            value={config.lifestyleSolo}
            onChange={(v) =>
              setFields(scaleGroup(config, 'lifestyleSolo', ['lifestylePerSpouse', 'lifestylePerKid'], v))
            }
          />
          <p className="text-xs text-slate-500">
            One knob for all lifestyle sliders — + spouse{' '}
            <span className="text-slate-400">{mo(config.lifestylePerSpouse)}</span> · + each kid{' '}
            <span className="text-slate-400">{mo(config.lifestylePerKid)}</span> scale with it.
          </p>
        </div>
        <HousingPreset config={config} setFields={setFields} />
      </div>
      {retiredNow && (
        <p className="mt-3 border-t border-slate-800 pt-2.5 text-xs text-amber-300/90">
          You&apos;re already retired in this plan — no more earned income, so the
          projection is a stress test of whether the portfolio alone holds to{' '}
          {config.endAge}. The income input is ignored.
        </p>
      )}
    </section>
  );
}
