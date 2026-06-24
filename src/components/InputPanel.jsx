import { useState } from 'react';
import { SECTIONS } from '../fields';
import { takeHome } from '../fireModel';
import { fmtUSD } from '../format';
import Field from './Field';

// Convert a gross salary -> take-home (today $) using the model's MFJ helper,
// then drop it straight into the incomeToday input.
function TakeHomeHelper({ onApply }) {
  const [gross, setGross] = useState(300_000);
  const net = Math.round(takeHome(gross || 0));
  return (
    <div className="mt-2 rounded-md border border-slate-800 bg-slate-900/40 p-3">
      <p className="mb-2 text-xs text-slate-400">
        Gross salary → take-home (MFJ, CA)
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">$</span>
        <input
          type="number"
          min={0}
          step={5_000}
          value={gross}
          onChange={(e) => setGross(Number(e.target.value) || 0)}
          className="w-28 rounded bg-slate-800 px-2 py-1 text-right text-sm tabular-nums text-slate-100 outline-none focus:ring-1 focus:ring-emerald-400"
        />
        <span className="text-sm text-slate-300">→ {fmtUSD(net)}</span>
        <button
          type="button"
          onClick={() => onApply(net)}
          className="ml-auto rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
        >
          Use
        </button>
      </div>
    </div>
  );
}

// Mode-aware hint shown under the Market assumptions header.
const MARKET_NOTE = {
  fixed: null,
  historical:
    'Historical mode ignores these and replays actual S&P 500 returns + US CPI (1928–2025).',
  montecarlo:
    'In Monte Carlo mode these are the MEANS each year is drawn around (see Monte Carlo settings).',
};

function Chevron({ open }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${open ? 'rotate-90' : ''}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function InputPanel({ config, setField, onReset, mode }) {
  const sections = SECTIONS.filter((s) => !s.onlyInMode || s.onlyInMode === mode);

  const [collapsed, setCollapsed] = useState(
    () => new Set(SECTIONS.filter((s) => s.defaultCollapsed).map((s) => s.id))
  );
  const toggle = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => setCollapsed(new Set(sections.map((s) => s.id)));

  return (
    <aside className="w-full shrink-0 overflow-y-auto border-b border-slate-800 p-4 lg:w-[360px] lg:border-b-0 lg:border-r">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Inputs
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-800"
        >
          Reset to defaults
        </button>
      </div>
      <div className="mb-3 flex justify-end gap-3 text-xs text-slate-500">
        <button type="button" onClick={expandAll} className="hover:text-slate-300">
          Expand all
        </button>
        <span className="text-slate-700">·</span>
        <button type="button" onClick={collapseAll} className="hover:text-slate-300">
          Collapse all
        </button>
      </div>

      <div className="space-y-3">
        {sections.map((section) => {
          const open = !collapsed.has(section.id);
          return (
            <section key={section.id}>
              <button
                type="button"
                onClick={() => toggle(section.id)}
                className="flex w-full items-center gap-1.5 border-b border-slate-800 pb-1 text-left text-xs font-semibold uppercase tracking-wide text-emerald-400/90 hover:text-emerald-300"
              >
                <Chevron open={open} />
                <span>{section.title}</span>
              </button>
              {open && (
                <>
                  {section.id === 'market' && MARKET_NOTE[mode] && (
                    <p className="mb-1 mt-1 text-xs text-amber-300/80">{MARKET_NOTE[mode]}</p>
                  )}
                  <div className="divide-y divide-slate-800/60">
                    {section.fields.map((field) => (
                      <Field
                        key={field.key}
                        field={field.labelFn ? { ...field, label: field.labelFn(config) } : field}
                        value={config[field.key]}
                        disabled={field.disabledWhen ? field.disabledWhen(config) : false}
                        onChange={(v) => setField(field.key, v)}
                      />
                    ))}
                  </div>
                  {section.id === 'income' && (
                    <TakeHomeHelper onApply={(v) => setField('incomeToday', v)} />
                  )}
                </>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
}
