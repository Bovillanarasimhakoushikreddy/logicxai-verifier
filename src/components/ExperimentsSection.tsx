import { useState } from 'react';
import { Play, CheckCircle2 } from 'lucide-react';
import {
  EXPERIMENT1_DATA,
  EXPERIMENT2_DATA,
  EXPERIMENT3_DATA,
  EXPERIMENT4_DATA,
  EXPERIMENT5_DATA,
  TABLE10_COMPARISON,
} from '../data/reportData';
import { runLiveEngineRace } from '../engine/satSolver';

type ExpTab = 'exp1' | 'exp2' | 'exp3' | 'exp45' | 'summary';

export default function ExperimentsSection() {
  const [activeExp, setActiveExp] = useState<ExpTab>('exp3');
  const [hoverExp1Idx, setHoverExp1Idx] = useState<number | null>(null);
  const [hoverExp2Idx, setHoverExp2Idx] = useState<number | null>(null);
  const [hoverExp3Idx, setHoverExp3Idx] = useState<number | null>(null);

  // Live Browser Race State (Experiment 3 interactive verification)
  const [raceN, setRaceN] = useState<number>(14);
  const [raceHistory, setRaceHistory] = useState<
    ReturnType<typeof runLiveEngineRace>[]
  >([]);

  const handleRunRace = () => {
    const result = runLiveEngineRace(raceN);
    setRaceHistory((prev) => [
      result,
      ...prev.filter((r) => r.nAtoms !== raceN),
    ].sort((a, b) => a.nAtoms - b.nAtoms));
  };

  // Experiment 3 finite points (n=8..24) for log-scale chart
  const exp3Finite = EXPERIMENT3_DATA.filter((d) => d.truthTableMs !== null);

  return (
    <div className="space-y-8">
      {/* Header & Experiment Sub-navigation */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Empirical Benchmarks &amp; Comparative Analysis
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Interactive charts and exact tabular datasets from Experiments 1–5 (Section 3,
            Tables 5–10) plus a live in-browser Truth-Table vs. SAT benchmark.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg shrink-0">
          {[
            { id: 'exp1' as const, label: 'Exp 1 · Depth 2–8' },
            { id: 'exp2' as const, label: 'Exp 2 · Faults' },
            { id: 'exp3' as const, label: 'Exp 3 · Engines' },
            { id: 'exp45' as const, label: 'Exp 4 & 5 · XAI' },
            { id: 'summary' as const, label: 'Table 10 Summary' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveExp(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeExp === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= EXPERIMENT 1 ================= */}
      {activeExp === 'exp1' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fig 4b: Train vs Held-out Accuracy */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Fig. 4(b) — Rule-Base Accuracy vs. Tree Depth
                  </h2>
                  <p className="text-xs text-slate-500">
                    Held-out accuracy peaks at 93.0% (depth 5) before slight overfitting at
                    depth 6 (100% pure training leaves).
                  </p>
                </div>
              </div>

              <svg viewBox="0 0 500 240" className="w-full h-auto">
                {/* Y-axis gridlines (90 to 101) */}
                {[90, 92, 94, 96, 98, 100].map((val) => {
                  const y = 205 - ((val - 90) / 11) * 175;
                  return (
                    <g key={val}>
                      <line
                        x1={52}
                        y1={y}
                        x2={475}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeWidth={1}
                      />
                      <text
                        x={44}
                        y={y + 4}
                        textAnchor="end"
                        fontSize={10}
                        fontFamily="IBM Plex Mono, monospace"
                        fill="#64748B"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* X-axis labels */}
                {EXPERIMENT1_DATA.map((d, i) => {
                  const x = 68 + i * 65;
                  return (
                    <text
                      key={d.depth}
                      x={x}
                      y={226}
                      textAnchor="middle"
                      fontSize={10}
                      fontFamily="IBM Plex Mono, monospace"
                      fill="#64748B"
                    >
                      d={d.depth}
                    </text>
                  );
                })}

                {/* Train polyline */}
                <polyline
                  fill="none"
                  stroke="#1D4ED8"
                  strokeWidth={2.5}
                  points={EXPERIMENT1_DATA.map((d, i) => {
                    const x = 68 + i * 65;
                    const y = 205 - ((d.trainAcc - 90) / 11) * 175;
                    return `${x},${y}`;
                  }).join(' ')}
                />

                {/* Test polyline */}
                <polyline
                  fill="none"
                  stroke="#EA580C"
                  strokeWidth={2.5}
                  strokeDasharray="5 3"
                  points={EXPERIMENT1_DATA.map((d, i) => {
                    const x = 68 + i * 65;
                    const y = 205 - ((d.testAcc - 90) / 11) * 175;
                    return `${x},${y}`;
                  }).join(' ')}
                />

                {/* Interactive data points */}
                {EXPERIMENT1_DATA.map((d, i) => {
                  const x = 68 + i * 65;
                  const yTrain = 205 - ((d.trainAcc - 90) / 11) * 175;
                  const yTest = 205 - ((d.testAcc - 90) / 11) * 175;
                  const hovered = hoverExp1Idx === i;
                  return (
                    <g
                      key={d.depth}
                      onMouseEnter={() => setHoverExp1Idx(i)}
                      onMouseLeave={() => setHoverExp1Idx(null)}
                      className="cursor-crosshair"
                    >
                      {hovered && (
                        <line
                          x1={x}
                          y1={20}
                          x2={x}
                          y2={205}
                          stroke="#94A3B8"
                          strokeWidth={1}
                          strokeDasharray="2 2"
                        />
                      )}
                      <circle
                        cx={x}
                        cy={yTrain}
                        r={hovered ? 5.5 : 4}
                        fill="#1D4ED8"
                        stroke="#FFFFFF"
                        strokeWidth={1.5}
                      />
                      <rect
                        x={x - (hovered ? 5 : 3.5)}
                        y={yTest - (hovered ? 5 : 3.5)}
                        width={hovered ? 10 : 7}
                        height={hovered ? 10 : 7}
                        fill="#EA580C"
                        stroke="#FFFFFF"
                        strokeWidth={1.5}
                      />
                    </g>
                  );
                })}
              </svg>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#1D4ED8] inline-block" />
                    Train Accuracy (%)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#EA580C] inline-block" />
                    Held-Out Test Accuracy (%)
                  </span>
                </div>
                {hoverExp1Idx !== null && (
                  <span className="font-mono text-slate-900 font-semibold tabular-nums">
                    Depth {EXPERIMENT1_DATA[hoverExp1Idx].depth}: Train{' '}
                    {EXPERIMENT1_DATA[hoverExp1Idx].trainAcc}% · Test{' '}
                    {EXPERIMENT1_DATA[hoverExp1Idx].testAcc}%
                  </span>
                )}
              </div>
            </div>

            {/* Fig 4a & 4c: Theory Size & Verification Latency */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Fig. 4(a, c) — Formal Theory Size &amp; Sub-Millisecond SAT Time
                </h2>
                <p className="text-xs text-slate-500">
                  Every rule base from depth 2 to 8 passed all P1–P4 checks in 0.11–0.73 ms
                  with 100% fidelity to the CART model.
                </p>
              </div>

              <svg viewBox="0 0 500 240" className="w-full h-auto">
                {[0, 0.2, 0.4, 0.6, 0.8].map((val) => {
                  const y = 205 - (val / 0.85) * 175;
                  return (
                    <g key={val}>
                      <line
                        x1={52}
                        y1={y}
                        x2={475}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeWidth={1}
                      />
                      <text
                        x={44}
                        y={y + 4}
                        textAnchor="end"
                        fontSize={10}
                        fontFamily="IBM Plex Mono, monospace"
                        fill="#64748B"
                      >
                        {val.toFixed(1)}ms
                      </text>
                    </g>
                  );
                })}

                {EXPERIMENT1_DATA.map((d, i) => {
                  const x = 68 + i * 65;
                  const barH = (d.rules / 18) * 150;
                  return (
                    <g key={d.depth}>
                      {/* Subtle bars for |R| */}
                      <rect
                        x={x - 14}
                        y={205 - barH}
                        width={28}
                        height={barH}
                        rx={3}
                        fill="#EFF6FF"
                        stroke="#BFDBFE"
                        strokeWidth={1}
                      />
                      <text
                        x={x}
                        y={205 - barH - 5}
                        textAnchor="middle"
                        fontSize={9.5}
                        fontFamily="IBM Plex Mono, monospace"
                        fill="#1D4ED8"
                      >
                        {d.rules}R
                      </text>
                      <text
                        x={x}
                        y={226}
                        textAnchor="middle"
                        fontSize={10}
                        fontFamily="IBM Plex Mono, monospace"
                        fill="#64748B"
                      >
                        d={d.depth}
                      </text>
                    </g>
                  );
                })}

                {/* Verification time line */}
                <polyline
                  fill="none"
                  stroke="#047857"
                  strokeWidth={2.5}
                  points={EXPERIMENT1_DATA.map((d, i) => {
                    const x = 68 + i * 65;
                    const y = 205 - (d.timeMs / 0.85) * 175;
                    return `${x},${y}`;
                  }).join(' ')}
                />

                {EXPERIMENT1_DATA.map((d, i) => {
                  const x = 68 + i * 65;
                  const y = 205 - (d.timeMs / 0.85) * 175;
                  return (
                    <g key={`t-${d.depth}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r={4}
                        fill="#047857"
                        stroke="#FFFFFF"
                        strokeWidth={1.5}
                      />
                      <text
                        x={x}
                        y={y - 9}
                        textAnchor="middle"
                        fontSize={9.5}
                        fontFamily="IBM Plex Mono, monospace"
                        fontWeight={600}
                        fill="#065F46"
                      >
                        {d.timeMs.toFixed(2)}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#EFF6FF] border border-[#BFDBFE] inline-block rounded-xs" />
                  Rule Count |R|
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#047857] inline-block" />
                  Full P1–P4 Verification Time (ms)
                </span>
              </div>
            </div>
          </div>

          {/* Table 5 */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-bold text-slate-900 mb-3">
              Table 5 — Properties and Verification Outcomes of Tree-Derived Rule Bases
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-sans">
                    <th className="py-2.5 pr-3">Depth</th>
                    <th className="py-2.5 px-3">|R|</th>
                    <th className="py-2.5 px-3">Atoms n</th>
                    <th className="py-2.5 px-3">Mean Len</th>
                    <th className="py-2.5 px-3">Train Acc.</th>
                    <th className="py-2.5 px-3">Test Acc.</th>
                    <th className="py-2.5 px-3">Pure Rules</th>
                    <th className="py-2.5 px-3">Pairs</th>
                    <th className="py-2.5 px-3">Dead/Ovlp/Conf</th>
                    <th className="py-2.5 px-3">P4 Complete</th>
                    <th className="py-2.5 pl-3 text-right">Time (ms)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {EXPERIMENT1_DATA.map((row) => (
                    <tr
                      key={row.depth}
                      className={
                        row.depth === 5 ? 'bg-[#EFF6FF]/60 font-semibold' : 'hover:bg-slate-50'
                      }
                    >
                      <td className="py-2.5 pr-3">{row.depth}</td>
                      <td className="py-2.5 px-3">{row.rules}</td>
                      <td className="py-2.5 px-3">{row.atoms}</td>
                      <td className="py-2.5 px-3">{row.meanLen.toFixed(2)}</td>
                      <td className="py-2.5 px-3">{row.trainAcc.toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-[#1D4ED8]">{row.testAcc.toFixed(1)}%</td>
                      <td className="py-2.5 px-3">{row.pure}</td>
                      <td className="py-2.5 px-3">{row.pairs}</td>
                      <td className="py-2.5 px-3 text-emerald-700">
                        {row.deadOverlapConflict}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700">✓ Yes</td>
                      <td className="py-2.5 pl-3 text-right">{row.timeMs.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= EXPERIMENT 2 ================= */}
      {activeExp === 'exp2' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fig 5a: Detection Rate */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-base font-bold text-slate-900">
                Fig. 5(a) — Fault Detection Rate by Method (6,000 Trials)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 mb-4">
                Share of live injected rules whose conflict is caught by SAT vs. dataset
                testing.
              </p>

              <svg viewBox="0 0 500 245" className="w-full h-auto">
                {[20, 40, 60, 80, 100].map((val) => {
                  const y = 205 - ((val - 20) / 85) * 175;
                  return (
                    <g key={val}>
                      <line
                        x1={48}
                        y1={y}
                        x2={475}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeWidth={1}
                      />
                      <text
                        x={40}
                        y={y + 4}
                        textAnchor="end"
                        fontSize={10}
                        fontFamily="IBM Plex Mono, monospace"
                        fill="#64748B"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* SAT Line */}
                <polyline
                  fill="none"
                  stroke="#1D4ED8"
                  strokeWidth={2.5}
                  points={EXPERIMENT2_DATA.map((d, i) => {
                    const x = 76 + i * 74;
                    const y = 205 - ((d.satPct - 20) / 85) * 175;
                    return `${x},${y}`;
                  }).join(' ')}
                />
                {/* 569 Testing Line */}
                <polyline
                  fill="none"
                  stroke="#EA580C"
                  strokeWidth={2.5}
                  points={EXPERIMENT2_DATA.map((d, i) => {
                    const x = 76 + i * 74;
                    const y = 205 - ((d.witnessed569Pct - 20) / 85) * 175;
                    return `${x},${y}`;
                  }).join(' ')}
                />
                {/* 171 Held-out Line */}
                <polyline
                  fill="none"
                  stroke="#047857"
                  strokeWidth={2.2}
                  strokeDasharray="4 3"
                  points={EXPERIMENT2_DATA.map((d, i) => {
                    const x = 76 + i * 74;
                    const y = 205 - ((d.witnessed171Pct - 20) / 85) * 175;
                    return `${x},${y}`;
                  }).join(' ')}
                />

                {EXPERIMENT2_DATA.map((d, i) => {
                  const x = 76 + i * 74;
                  const ySat = 205 - ((d.satPct - 20) / 85) * 175;
                  const y569 = 205 - ((d.witnessed569Pct - 20) / 85) * 175;
                  const y171 = 205 - ((d.witnessed171Pct - 20) / 85) * 175;
                  const hovered = hoverExp2Idx === i;
                  return (
                    <g
                      key={d.k}
                      onMouseEnter={() => setHoverExp2Idx(i)}
                      onMouseLeave={() => setHoverExp2Idx(null)}
                      className="cursor-crosshair"
                    >
                      <text
                        x={x}
                        y={228}
                        textAnchor="middle"
                        fontSize={10}
                        fontFamily="IBM Plex Mono, monospace"
                        fill="#64748B"
                      >
                        k={d.k}
                      </text>
                      <circle cx={x} cy={ySat} r={hovered ? 5 : 3.5} fill="#1D4ED8" />
                      <circle cx={x} cy={y569} r={hovered ? 5 : 3.5} fill="#EA580C" />
                      <circle cx={x} cy={y171} r={hovered ? 5 : 3.5} fill="#047857" />
                    </g>
                  );
                })}
              </svg>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex flex-wrap items-center gap-3.5">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#1D4ED8] inline-block" />
                    Formal SAT
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#EA580C] inline-block" />
                    All 569 Records
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#047857] inline-block" />
                    171 Held-Out
                  </span>
                </div>
                {hoverExp2Idx !== null && (
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    k={EXPERIMENT2_DATA[hoverExp2Idx].k}: SAT{' '}
                    {EXPERIMENT2_DATA[hoverExp2Idx].satPct}% · 569-rec{' '}
                    {EXPERIMENT2_DATA[hoverExp2Idx].witnessed569Pct}%
                  </span>
                )}
              </div>
            </div>

            {/* Fig 5b: Missed Real Conflicts Grouped Bar Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-base font-bold text-slate-900">
                Fig. 5(b) — Real Conflicts Missed by Sample Testing (%)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 mb-4">
                At k = 6 literals, 67.1% of real conflicts are invisible on all 569 records
                and 76.0% on the 171 held-out set.
              </p>

              <svg viewBox="0 0 500 245" className="w-full h-auto">
                {[0, 20, 40, 60, 80].map((val) => {
                  const y = 205 - (val / 85) * 175;
                  return (
                    <g key={val}>
                      <line
                        x1={48}
                        y1={y}
                        x2={475}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeWidth={1}
                      />
                      <text
                        x={40}
                        y={y + 4}
                        textAnchor="end"
                        fontSize={10}
                        fontFamily="IBM Plex Mono, monospace"
                        fill="#64748B"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {EXPERIMENT2_DATA.map((d, i) => {
                  const cx = 82 + i * 72;
                  const h569 = (d.missed569Pct / 85) * 175;
                  const h171 = (d.missed171Pct / 85) * 175;
                  return (
                    <g key={d.k}>
                      <rect
                        x={cx - 21}
                        y={205 - h569}
                        width={19}
                        height={h569}
                        rx={2}
                        fill="#1D4ED8"
                      />
                      <rect
                        x={cx + 2}
                        y={205 - h171}
                        width={19}
                        height={h171}
                        rx={2}
                        fill="#BE123C"
                      />
                      <text
                        x={cx}
                        y={228}
                        textAnchor="middle"
                        fontSize={10}
                        fontFamily="IBM Plex Mono, monospace"
                        fill="#64748B"
                      >
                        k={d.k}
                      </text>
                      {d.k === 6 && (
                        <text
                          x={cx + 11}
                          y={205 - h171 - 6}
                          textAnchor="middle"
                          fontSize={10}
                          fontFamily="IBM Plex Mono, monospace"
                          fontWeight={700}
                          fill="#BE123C"
                        >
                          76.0%
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#1D4ED8] inline-block rounded-xs" />
                  Missed vs. All 569 Records
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#BE123C] inline-block rounded-xs" />
                  Missed vs. 171 Held-Out Test Set
                </span>
              </div>
            </div>
          </div>

          {/* Table 6 */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-bold text-slate-900 mb-3">
              Table 6 — Detection of Conflicts Caused by an Injected Rule (1,000 Trials per
              k)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-sans">
                    <th className="py-2.5 pr-3">k (literals)</th>
                    <th className="py-2.5 px-3">Dead Rules</th>
                    <th className="py-2.5 px-3">Live Rules</th>
                    <th className="py-2.5 px-3">Real Conflicts (SAT)</th>
                    <th className="py-2.5 px-3">Witnessed (569)</th>
                    <th className="py-2.5 px-3">Witnessed (171)</th>
                    <th className="py-2.5 px-3">Missed (569)</th>
                    <th className="py-2.5 pl-3 text-right">Missed (171)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {EXPERIMENT2_DATA.map((row) => (
                    <tr
                      key={row.k}
                      className={
                        row.k === 6 ? 'bg-[#FFF1F2]/70 font-semibold' : 'hover:bg-slate-50'
                      }
                    >
                      <td className="py-2.5 pr-3">{row.k}</td>
                      <td className="py-2.5 px-3">{row.dead}</td>
                      <td className="py-2.5 px-3">{row.live}</td>
                      <td className="py-2.5 px-3 text-[#1D4ED8]">
                        {row.satConflicts} ({row.satPct.toFixed(1)}%)
                      </td>
                      <td className="py-2.5 px-3">
                        {row.witnessed569} ({row.witnessed569Pct.toFixed(1)}%)
                      </td>
                      <td className="py-2.5 px-3">
                        {row.witnessed171} ({row.witnessed171Pct.toFixed(1)}%)
                      </td>
                      <td className="py-2.5 px-3 text-[#BE123C]">
                        {row.missed569Pct.toFixed(1)}%
                      </td>
                      <td className="py-2.5 pl-3 text-right text-[#BE123C]">
                        {row.missed171Pct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= EXPERIMENT 3 ================= */}
      {activeExp === 'exp3' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Fig 6: Log-Scale Engine Comparison Chart */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Fig. 6 — Verification Runtime Across 3 Engines (Log₁₀ Scale, n = 8…24)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 mb-4">
                  40-rule conflict-free base (every pair must be proved UNSAT). Truth-table
                  grows ~2.3× per atom while CDCL SAT stays flat near ~1 ms.
                </p>

                <svg viewBox="0 0 540 270" className="w-full h-auto">
                  {/* Log10 Y-axis: 10^-0.5 (0.3ms) to 10^4.5 (31,600ms) */}
                  {[0, 1, 2, 3, 4].map((exp) => {
                    const y = 225 - ((exp + 0.5) / 5) * 200;
                    return (
                      <g key={exp}>
                        <line
                          x1={58}
                          y1={y}
                          x2={515}
                          y2={y}
                          stroke="#E2E8F0"
                          strokeWidth={1}
                        />
                        <text
                          x={50}
                          y={y + 4}
                          textAnchor="end"
                          fontSize={10}
                          fontFamily="IBM Plex Mono, monospace"
                          fill="#64748B"
                        >
                          10^{exp} ms
                        </text>
                      </g>
                    );
                  })}

                  {/* Helper for log y */}
                  {(() => {
                    const mapY = (ms: number) =>
                      225 - ((Math.log10(ms) + 0.5) / 5) * 200;
                    const mapX = (i: number) => 78 + i * 52;

                    return (
                      <>
                        {/* Truth table */}
                        <polyline
                          fill="none"
                          stroke="#BE123C"
                          strokeWidth={2.5}
                          points={exp3Finite
                            .map((d, i) => `${mapX(i)},${mapY(d.truthTableMs!)}`)
                            .join(' ')}
                        />
                        {/* SMT Z3 */}
                        <polyline
                          fill="none"
                          stroke="#047857"
                          strokeWidth={2.2}
                          strokeDasharray="5 3"
                          points={exp3Finite
                            .map((d, i) => `${mapX(i)},${mapY(d.smtMs)}`)
                            .join(' ')}
                        />
                        {/* SAT Glucose4 */}
                        <polyline
                          fill="none"
                          stroke="#1D4ED8"
                          strokeWidth={2.5}
                          points={exp3Finite
                            .map((d, i) => `${mapX(i)},${mapY(d.satMs)}`)
                            .join(' ')}
                        />

                        {exp3Finite.map((d, i) => {
                          const x = mapX(i);
                          const hovered = hoverExp3Idx === i;
                          return (
                            <g
                              key={d.n}
                              onMouseEnter={() => setHoverExp3Idx(i)}
                              onMouseLeave={() => setHoverExp3Idx(null)}
                              className="cursor-crosshair"
                            >
                              {hovered && (
                                <line
                                  x1={x}
                                  y1={20}
                                  x2={x}
                                  y2={225}
                                  stroke="#94A3B8"
                                  strokeDasharray="2 2"
                                />
                              )}
                              <text
                                x={x}
                                y={248}
                                textAnchor="middle"
                                fontSize={10}
                                fontFamily="IBM Plex Mono, monospace"
                                fill="#64748B"
                              >
                                n={d.n}
                              </text>
                              <circle
                                cx={x}
                                cy={mapY(d.truthTableMs!)}
                                r={hovered ? 5 : 3.5}
                                fill="#BE123C"
                              />
                              <polygon
                                points={`${x},${mapY(d.smtMs) - 4} ${x - 4},${mapY(d.smtMs) + 3.5} ${x + 4},${mapY(d.smtMs) + 3.5}`}
                                fill="#047857"
                              />
                              <rect
                                x={x - 3.5}
                                y={mapY(d.satMs) - 3.5}
                                width={7}
                                height={7}
                                fill="#1D4ED8"
                              />
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#BE123C] inline-block" />
                    Truth Table (2ⁿ)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#047857] inline-block" />
                    SMT (Z3)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#1D4ED8] inline-block" />
                    CDCL SAT (Glucose4)
                  </span>
                </div>
                {hoverExp3Idx !== null && (
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    n={exp3Finite[hoverExp3Idx].n}: TT{' '}
                    {exp3Finite[hoverExp3Idx].truthTableMs}ms vs SAT{' '}
                    {exp3Finite[hoverExp3Idx].satMs}ms ({exp3Finite[hoverExp3Idx].speedup})
                  </span>
                )}
              </div>
            </div>

            {/* Interactive In-Browser Truth Table vs SAT Race */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Live Browser Race: Truth Table vs. SAT
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Run both brute-force 2ⁿ truth-table enumeration and our DPLL SAT solver
                    right now in JavaScript to experience exponential scaling firsthand.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="race-n-slider" className="font-semibold text-slate-800">
                      Propositional Atoms (n):
                    </label>
                    <span className="font-mono font-bold text-[#1D4ED8] tabular-nums">
                      n = {raceN} ({(1 << raceN).toLocaleString()} rows)
                    </span>
                  </div>
                  <input
                    id="race-n-slider"
                    type="range"
                    min={8}
                    max={17}
                    step={1}
                    value={raceN}
                    onChange={(e) => setRaceN(Number(e.target.value))}
                    className="w-full scientific-slider"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>n=8 (256)</span>
                    <span>n=13 (8,192)</span>
                    <span>n=17 (131,072)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunRace}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Execute Live Race at n = {raceN}
                  </button>
                </div>

                {raceHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-sans">
                          <th className="py-1.5 pr-2">n</th>
                          <th className="py-1.5 px-2">2ⁿ Rows</th>
                          <th className="py-1.5 px-2">Truth Table</th>
                          <th className="py-1.5 px-2">SAT</th>
                          <th className="py-1.5 pl-2 text-right">Speedup</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {raceHistory.map((r) => (
                          <tr key={r.nAtoms}>
                            <td className="py-1.5 pr-2 font-semibold">{r.nAtoms}</td>
                            <td className="py-1.5 px-2 text-slate-600">
                              {r.assignments.toLocaleString()}
                            </td>
                            <td className="py-1.5 px-2 text-[#BE123C]">
                              {r.truthTableMs.toFixed(2)} ms
                            </td>
                            <td className="py-1.5 px-2 text-[#1D4ED8]">
                              {r.satMs.toFixed(2)} ms
                            </td>
                            <td className="py-1.5 pl-2 text-right font-semibold text-emerald-700">
                              {r.speedup >= 10
                                ? `${Math.round(r.speedup)}×`
                                : `${r.speedup.toFixed(1)}×`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-3">
                    Click &ldquo;Execute Live Race&rdquo; across multiple values of n (e.g.,
                    n=10, n=14, n=17) to build your live empirical speedup table.
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>
                  Verdicts agreed across all 45/45 benchmark runs in the report.
                </span>
              </div>
            </div>
          </div>

          {/* Table 7 */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-bold text-slate-900 mb-3">
              Table 7 — Time (ms) to Decide Class Consistency of a 40-Rule Base over n Atoms
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-sans">
                    <th className="py-2.5 pr-3">Atoms n</th>
                    <th className="py-2.5 px-3">Assignments 2ⁿ</th>
                    <th className="py-2.5 px-3">Truth Table (ms)</th>
                    <th className="py-2.5 px-3">SAT Glucose4 (ms)</th>
                    <th className="py-2.5 px-3">SMT Z3 (ms)</th>
                    <th className="py-2.5 pl-3 text-right">Truth Table ÷ SAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {EXPERIMENT3_DATA.map((row) => (
                    <tr
                      key={row.n}
                      className={
                        row.n === 24 || row.n === 1000
                          ? 'bg-[#EFF6FF]/60 font-semibold'
                          : 'hover:bg-slate-50'
                      }
                    >
                      <td className="py-2 pr-3">{row.n}</td>
                      <td className="py-2 px-3 text-slate-600">{row.assignments}</td>
                      <td className="py-2 px-3 text-[#BE123C]">
                        {row.truthTableMs !== null ? row.truthTableMs.toFixed(1) : '—'}
                      </td>
                      <td className="py-2 px-3 text-[#1D4ED8]">{row.satMs.toFixed(2)}</td>
                      <td className="py-2 px-3 text-emerald-700">
                        {row.smtMs.toFixed(1)}
                      </td>
                      <td className="py-2 pl-3 text-right font-semibold">{row.speedup}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= EXPERIMENT 4 & 5 ================= */}
      {activeExp === 'exp45' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Fig 7 Grouped Bar Chart */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-base font-bold text-slate-900">
                Fig. 7 — Full State vs. Fired Rule vs. Minimal Explanation (Exp. 4)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 mb-4">
                Mean number of literals over 100 sampled records. At depths 3–5, 55–57% of
                records achieve strictly shorter minimal proofs.
              </p>

              <svg viewBox="0 0 480 245" className="w-full h-auto">
                {[0, 3, 6, 9, 12, 15].map((val) => {
                  const y = 205 - (val / 16) * 175;
                  return (
                    <g key={val}>
                      <line
                        x1={44}
                        y1={y}
                        x2={460}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeWidth={1}
                      />
                      <text
                        x={36}
                        y={y + 4}
                        textAnchor="end"
                        fontSize={10}
                        fontFamily="IBM Plex Mono, monospace"
                        fill="#64748B"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {EXPERIMENT4_DATA.map((d, i) => {
                  const cx = 100 + i * 102;
                  const hFull = (d.fullState / 16) * 175;
                  const hRule = (d.firedRule / 16) * 175;
                  const hMin = (d.minimalExp / 16) * 175;
                  return (
                    <g key={d.depth}>
                      <rect
                        x={cx - 33}
                        y={205 - hFull}
                        width={20}
                        height={hFull}
                        rx={2}
                        fill="#94A3B8"
                      />
                      <rect
                        x={cx - 10}
                        y={205 - hRule}
                        width={20}
                        height={hRule}
                        rx={2}
                        fill="#EA580C"
                      />
                      <rect
                        x={cx + 13}
                        y={205 - hMin}
                        width={20}
                        height={hMin}
                        rx={2}
                        fill="#047857"
                      />
                      <text
                        x={cx}
                        y={228}
                        textAnchor="middle"
                        fontSize={10.5}
                        fontFamily="IBM Plex Mono, monospace"
                        fill="#475569"
                      >
                        Depth {d.depth}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#94A3B8] inline-block rounded-xs" />
                  All Atoms (Full State)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#EA580C] inline-block rounded-xs" />
                  Fired Rule
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#047857] inline-block rounded-xs" />
                  Minimal Explanation
                </span>
              </div>
            </div>

            {/* Table 8 & Table 9 */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-base font-bold text-slate-900 mb-3">
                  Table 8 — Explanation Compactness (100 Sampled Records)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-sans">
                        <th className="py-2 pr-2">Depth</th>
                        <th className="py-2 px-2">Atoms</th>
                        <th className="py-2 px-2">Rule Len</th>
                        <th className="py-2 px-2">Minimal</th>
                        <th className="py-2 px-2">Reduction</th>
                        <th className="py-2 px-2">Shortened</th>
                        <th className="py-2 pl-2 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {EXPERIMENT4_DATA.map((r) => (
                        <tr key={r.depth} className="hover:bg-slate-50">
                          <td className="py-2 pr-2 font-semibold">{r.depth}</td>
                          <td className="py-2 px-2">{r.fullState}</td>
                          <td className="py-2 px-2">{r.firedRule.toFixed(2)}</td>
                          <td className="py-2 px-2 text-emerald-700 font-semibold">
                            {r.minimalExp.toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-[#1D4ED8] font-semibold">
                            −{r.reductionPct.toFixed(1)}%
                          </td>
                          <td className="py-2 px-2">{r.shortenedPct}%</td>
                          <td className="py-2 pl-2 text-right">{r.timeMs.toFixed(2)} ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-base font-bold text-slate-900 mb-1">
                  Table 9 — Robustness Over 30 Stratified Random Splits (Exp. 5)
                </h2>
                <p className="text-xs text-slate-500 mb-3">
                  Logical guarantees hold across 60 / 60 models while held-out accuracy
                  fluctuates by ±2.2–2.4 points across seeds 0–29.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-sans">
                        <th className="py-2 pr-2">Depth</th>
                        <th className="py-2 px-2">P1–P4 Hold</th>
                        <th className="py-2 px-2">Held-Out Acc.</th>
                        <th className="py-2 px-2">Rules |R|</th>
                        <th className="py-2 pl-2 text-right">Time (mean/max)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {EXPERIMENT5_DATA.map((r) => (
                        <tr key={r.depth}>
                          <td className="py-2.5 pr-2 font-semibold">{r.depth}</td>
                          <td className="py-2.5 px-2 text-emerald-700 font-semibold">
                            ✓ {r.allPass}
                          </td>
                          <td className="py-2.5 px-2">{r.heldOutAcc}</td>
                          <td className="py-2.5 px-2">{r.rulesMeanRange}</td>
                          <td className="py-2.5 pl-2 text-right">{r.verifyTimeMeanMax}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= COMPARATIVE SUMMARY ================= */}
      {activeExp === 'summary' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Table 10 — Comparative Summary of Verification Methods
            </h2>
            <p className="text-xs text-slate-600 mb-4">
              Formal SAT-based verification combines the exhaustive guarantee of truth
              tables with millisecond scalability up to 1,000+ propositional atoms.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-3 pr-4 font-medium">Verification Aspect</th>
                    <th className="py-3 px-4 font-medium">Accuracy / Testing</th>
                    <th className="py-3 px-4 font-medium">Truth-Table Checking</th>
                    <th className="py-3 pl-4 font-semibold text-[#1D4ED8]">
                      SAT-Based Verification (Proposed)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {TABLE10_COMPARISON.map((row) => (
                    <tr key={row.aspect} className="hover:bg-slate-50/70">
                      <td className="py-3 pr-4 font-semibold text-slate-900">
                        {row.aspect}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{row.testing}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {row.truthTable}
                      </td>
                      <td className="py-3 pl-4 font-mono font-semibold text-emerald-700">
                        {row.sat}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h3 className="text-base font-bold text-slate-900">
                Section 3.9 — Practical Deployment Workflow
              </h3>
              <ol className="space-y-2.5 text-xs text-slate-700 leading-relaxed list-decimal list-inside">
                <li>
                  <span className="font-semibold text-slate-900">Lossless Extraction:</span>{' '}
                  Convert trained tree splits to predicate rules instantaneously (100%
                  fidelity).
                </li>
                <li>
                  <span className="font-semibold text-slate-900">CI Verification Gate:</span>{' '}
                  Run P1–P4 SAT checks on every clinical rule edit (&lt; 1 ms overhead).
                </li>
                <li>
                  <span className="font-semibold text-slate-900">
                    SAT Witness as Bug Report:
                  </span>{' '}
                  Surface exact contradictory or uncovered measurement regions to domain
                  reviewers.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">
                    Audit-Ready Explanations:
                  </span>{' '}
                  Serve minimal sufficient reasons S to physicians and regulators alongside
                  predictions.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">
                    Complementary Testing:
                  </span>{' '}
                  Keep empirical test-set accuracy because logic guarantees consistency, not
                  medical ground-truth correctness.
                </li>
              </ol>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h3 className="text-base font-bold text-slate-900">
                Section 3.8 &amp; 4 — Limitations &amp; Future Research Scope
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-700 leading-relaxed list-disc list-inside">
                <li>
                  <span className="font-semibold text-slate-900">Model Class:</span> Current
                  encoding handles axis-aligned CART thresholds; linear oblique rules (w₁x₁ +
                  w₂x₂ ≤ b) require SMT with Linear Real Arithmetic.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">Ensembles &amp; Monotonicity:</span>{' '}
                  Extending formal verification to Random Forests, GBDTs, and domain axioms
                  such as monotonicity (larger radius never lowers risk).
                </li>
                <li>
                  <span className="font-semibold text-slate-900">
                    Contrastive Explanations:
                  </span>{' '}
                  Computing minimal feature perturbations that flip a diagnosis using the
                  same SAT oracle.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">
                    Specification Correctness:
                  </span>{' '}
                  A logically consistent rule base can still be clinically wrong; formal
                  proofs complement rather than replace medical review.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
