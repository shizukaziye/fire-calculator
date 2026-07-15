// The headline plan choices — marry (and when), kids, rent vs buy (and when) —
// pulled out of the granular left panel so the big levers sit above the charts.
// They edit the same config keys, so everything stays in sync.

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

export default function BigDecisions({ config, setField }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
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
    </section>
  );
}
