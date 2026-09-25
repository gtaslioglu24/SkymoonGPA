import { useId, useState, type KeyboardEvent } from 'react';
import { THRESHOLDS } from '../lib/grades';
import type { SemesterPoint } from '../lib/semesters';
import { useI18n } from '../lib/i18n';

const W = 640;
const H = 260;
const PAD = { top: 24, right: 52, bottom: 34, left: 12 };

/**
 * Single-series line chart of cumulative GPA across semesters. Threshold guides
 * (2.00 graduation, 3.50 honor) are recessive references; the active semester is
 * revealed on hover, tap or keyboard focus with a crosshair + tooltip. No legend
 * — the title names the one series (per dataviz guidance).
 *
 * The same numbers are also emitted as a plain table for screen readers: a chart
 * whose only affordance is hovering excludes both keyboard and touch users.
 */
export function GpaTrendChart({ points }: { points: SemesterPoint[] }) {
  const { t } = useI18n();
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();
  const descId = useId();

  const graded = points.filter((p) => p.cumulative !== null);
  if (graded.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-line text-sm text-muted dark:border-ink-line">
        {t.semesters.chartEmpty}
      </div>
    );
  }

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const n = points.length;

  const vals = graded.map((p) => p.cumulative as number);
  const dataMin = Math.min(...vals);
  let yMin = Math.min(2.0, Math.floor((dataMin - 0.25) / 0.5) * 0.5);
  yMin = Math.max(0, yMin);
  if (yMin >= 4) yMin = 3.5;
  const yMax = THRESHOLDS.max;

  const xFor = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yFor = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;

  const guides = [THRESHOLDS.graduation, THRESHOLDS.honor].filter((g) => g >= yMin && g <= yMax);

  // Path over points that have a cumulative value (in order).
  const linePts = points
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.cumulative !== null);
  const d = linePts
    .map(({ p, i }, k) => `${k === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.cumulative as number)}`)
    .join(' ');

  const lastIdx = linePts[linePts.length - 1].i;
  const activePoint = active !== null ? points[active] : null;
  const last = points[lastIdx];

  /** Move focus between markers with the arrow keys. */
  const onKeyDown = (e: KeyboardEvent, k: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = e.key === 'ArrowRight' ? k + 1 : k - 1;
    if (next < 0 || next >= linePts.length) return;
    const el = document.getElementById(`${titleId}-pt-${next}`);
    el?.focus();
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ aspectRatio: `${W} / ${H}` }}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
      >
        <title id={titleId}>{t.semesters.chartTitle}</title>
        <desc id={descId}>
          {t.semesters.chartDesc
            .replace('{n}', String(graded.length))
            .replace('{first}', (graded[0].cumulative as number).toFixed(2))
            .replace('{last}', (last.cumulative as number).toFixed(2))}
        </desc>

        {/* Threshold guides */}
        {guides.map((g) => (
          <g key={g}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yFor(g)}
              y2={yFor(g)}
              className="stroke-stone-300 dark:stroke-white/15"
              strokeWidth={1}
              strokeDasharray="3 4"
            />
            <text
              x={W - PAD.right + 8}
              y={yFor(g)}
              dominantBaseline="middle"
              className="fill-stone-500 dark:fill-stone-400"
              fontSize={12}
            >
              {g.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Active crosshair */}
        {activePoint && activePoint.cumulative !== null && (
          <line
            x1={xFor(active as number)}
            x2={xFor(active as number)}
            y1={PAD.top}
            y2={H - PAD.bottom}
            className="stroke-stone-300 dark:stroke-white/20"
            strokeWidth={1}
          />
        )}

        {/* Cumulative line */}
        <path
          d={d}
          fill="none"
          className="stroke-brand-600 dark:stroke-brand-400"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Markers + labels + hover/tap/focus hit areas */}
        {linePts.map(({ p, i }, k) => (
          <g key={p.id}>
            <circle
              cx={xFor(i)}
              cy={yFor(p.cumulative as number)}
              r={4}
              className="fill-brand-600 stroke-paper-raised dark:fill-brand-400 dark:stroke-ink-900"
              strokeWidth={2}
            />
            {i === lastIdx && (
              <text
                x={xFor(i) - 9}
                y={yFor(p.cumulative as number) - 10}
                textAnchor="end"
                className="fill-stone-900 dark:fill-stone-50"
                fontSize={15}
                fontWeight={600}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {(p.cumulative as number).toFixed(2)}
              </text>
            )}
            {/* x-axis label */}
            <text
              x={xFor(i)}
              y={H - PAD.bottom + 20}
              textAnchor="middle"
              className="fill-stone-500 dark:fill-stone-400"
              fontSize={12}
            >
              {shorten(p.name)}
            </text>
            {/* hit area — pointer, touch and keyboard */}
            <circle
              id={`${titleId}-pt-${k}`}
              cx={xFor(i)}
              cy={yFor(p.cumulative as number)}
              r={18}
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`${p.name}: ${(p.cumulative as number).toFixed(2)}`}
              className="cursor-pointer focus:outline-none focus-visible:stroke-brand-500 focus-visible:[stroke-width:2]"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onClick={() => setActive(i)}
              onKeyDown={(e) => onKeyDown(e, k)}
            />
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {activePoint && activePoint.cumulative !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-xs shadow-lg dark:border-ink-line dark:bg-ink-800"
          style={{
            left: `${(xFor(active as number) / W) * 100}%`,
            top: `${(yFor(activePoint.cumulative) / H) * 100}%`,
            marginTop: '-10px',
          }}
        >
          <div className="font-semibold text-stone-900 dark:text-stone-50">{activePoint.name}</div>
          <div className="mt-1 flex gap-3 num text-stone-600 dark:text-stone-300">
            <span>
              {t.semesters.cumulative}{' '}
              <b className="text-stone-900 dark:text-stone-50">
                {activePoint.cumulative.toFixed(2)}
              </b>
            </span>
            {activePoint.spa !== null && (
              <span>
                {t.semesters.spa} <b>{activePoint.spa.toFixed(2)}</b>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Text equivalent of the chart. */}
      <table className="sr-only">
        <caption>{t.semesters.chartTitle}</caption>
        <thead>
          <tr>
            <th scope="col">{t.semesters.term}</th>
            <th scope="col">{t.semesters.spa}</th>
            <th scope="col">{t.semesters.cumulative}</th>
          </tr>
        </thead>
        <tbody>
          {linePts.map(({ p }) => (
            <tr key={p.id}>
              <th scope="row">{p.name}</th>
              <td>{p.spa === null ? '—' : p.spa.toFixed(2)}</td>
              <td>{(p.cumulative as number).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function shorten(name: string): string {
  return name.length > 10 ? name.slice(0, 9) + '…' : name;
}
