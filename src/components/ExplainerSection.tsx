import { useMemo, useState } from 'react';
import { CheckCircle2, MinusCircle, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import {
  DEPTH3_ATOMS,
  DEPTH3_RULES,
  DEPTH5_ATOMS,
  DEPTH5_RULES,
  PATIENT_CASES,
} from '../data/reportData';
import {
  computeMinimalExplanation,
  formatLiteralInequality,
  formatLiteralSymbol,
  formatRuleAntecedent,
} from '../engine/satSolver';

type DepthMode = 'depth3' | 'depth5';

export default function ExplainerSection() {
  const [depthMode, setDepthMode] = useState<DepthMode>('depth3');
  const [selectedCaseId, setSelectedCaseId] = useState<string>(PATIENT_CASES[0].id);
  const [recordValues, setRecordValues] = useState<Record<string, number>>(() => ({
    ...PATIENT_CASES[0].values,
  }));

  const atoms = depthMode === 'depth3' ? DEPTH3_ATOMS : DEPTH5_ATOMS;
  const rules = depthMode === 'depth3' ? DEPTH3_RULES : DEPTH5_RULES;

  // Deduplicate features for the slider controls (since Depth-5 has 3 thresholds for 'worst texture')
  const uniqueFeatureControls = useMemo(() => {
    const map = new Map<
      string,
      {
        feature: string;
        min: number;
        max: number;
        step: number;
        unit?: string;
        thresholds: { symbol: string; threshold: number }[];
      }
    >();
    for (const atom of atoms) {
      const existing = map.get(atom.feature);
      if (existing) {
        existing.thresholds.push({ symbol: atom.symbol, threshold: atom.threshold });
      } else {
        map.set(atom.feature, {
          feature: atom.feature,
          min: atom.min,
          max: atom.max,
          step: atom.step,
          unit: atom.unit,
          thresholds: [{ symbol: atom.symbol, threshold: atom.threshold }],
        });
      }
    }
    for (const entry of map.values()) {
      entry.thresholds.sort((a, b) => a.threshold - b.threshold);
    }
    return Array.from(map.values());
  }, [atoms]);

  const explanation = useMemo(
    () => computeMinimalExplanation(recordValues, rules, atoms),
    [recordValues, rules, atoms]
  );

  const loadPatientCase = (caseId: string) => {
    const found = PATIENT_CASES.find((c) => c.id === caseId);
    if (!found) return;
    setSelectedCaseId(caseId);
    setRecordValues({ ...found.values });
  };

  const updateFeature = (feature: string, val: number) => {
    setSelectedCaseId('custom');
    setRecordValues((prev) => ({ ...prev, [feature]: val }));
  };

  const firedRule = explanation.firedRules[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Minimal Abductive Explanation Engine (Algorithm 3)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Adjust clinical tumour measurements to compute a provably sufficient minimal
            explanation S ⊆ α(x) and trace every redundant literal pruned by SAT.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setDepthMode('depth3')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              depthMode === 'depth3'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Depth-3 Model (6 atoms)
          </button>
          <button
            type="button"
            onClick={() => setDepthMode('depth5')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              depthMode === 'depth5'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Depth-5 Model (13 atoms)
          </button>
        </div>
      </div>

      {/* Patient Case Selector Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PATIENT_CASES.map((pc) => {
          const active = selectedCaseId === pc.id;
          return (
            <button
              key={pc.id}
              type="button"
              onClick={() => loadPatientCase(pc.id)}
              className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                active
                  ? 'bg-[#EFF6FF] border-[#1D4ED8]'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-semibold text-slate-900">{pc.label}</div>
              <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                {pc.summary}
              </p>
            </button>
          );
        })}
      </div>

      {/* Two-Zone Sandbox Layout: Left Feature Sliders (5 cols) | Right Live Explanation Stage (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Clinical Feature Sliders */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#1D4ED8]" />
              <h2 className="text-base font-bold text-slate-900">
                Patient Feature Vector x ∈ ℝ³⁰
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {uniqueFeatureControls.length} active features
            </span>
          </div>

          <div className="space-y-5">
            {uniqueFeatureControls.map((ctrl) => {
              const val = recordValues[ctrl.feature] ?? ctrl.min;
              return (
                <div key={ctrl.feature} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <label
                      htmlFor={`slider-${ctrl.feature}`}
                      className="text-xs font-semibold text-slate-800 capitalize"
                    >
                      {ctrl.feature}
                    </label>
                    <span className="text-sm font-mono font-bold tabular-nums text-[#1D4ED8]">
                      {val.toFixed(ctrl.step < 0.001 ? 4 : ctrl.step < 0.05 ? 3 : 2)}
                      {ctrl.unit ? (
                        <span className="text-[11px] font-normal text-slate-400 ml-1">
                          {ctrl.unit}
                        </span>
                      ) : null}
                    </span>
                  </div>

                  <input
                    id={`slider-${ctrl.feature}`}
                    type="range"
                    min={ctrl.min}
                    max={ctrl.max}
                    step={ctrl.step}
                    value={val}
                    onChange={(e) => updateFeature(ctrl.feature, Number(e.target.value))}
                    className="w-full scientific-slider"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                    <span>{ctrl.min}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {ctrl.thresholds.map((t) => {
                        const isTrue = val <= t.threshold;
                        return (
                          <span
                            key={t.symbol}
                            className={
                              isTrue
                                ? 'text-emerald-700 font-semibold'
                                : 'text-[#BE123C] font-semibold'
                            }
                          >
                            {isTrue ? t.symbol : `¬${t.symbol}`} (≤{t.threshold})
                          </span>
                        );
                      })}
                    </div>
                    <span>{ctrl.max}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Minimal Explanation & Greedy Deletion Proof */}
        <div className="lg:col-span-7 space-y-6">
          {/* Prediction & Compression Summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Formal Classification (Modus Ponens via {firedRule?.id ?? '—'})
                </div>
                <div className="mt-1 flex items-baseline gap-3">
                  <span
                    className={`text-2xl font-bold ${
                      explanation.predictedClass === 'Mal'
                        ? 'text-[#BE123C]'
                        : 'text-[#1D4ED8]'
                    }`}
                  >
                    {explanation.predictedClass === 'Mal' ? 'Malignant' : 'Benign'}
                  </span>
                  <span className="text-xs font-mono text-slate-500 tabular-nums">
                    Computed in {explanation.elapsedMs.toFixed(2)} ms
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500">Explanation Compression</div>
                <div className="text-lg font-mono font-bold tabular-nums text-emerald-700 mt-0.5">
                  {explanation.minimalLiterals.length} of {atoms.length} atoms
                  <span className="text-xs font-normal text-slate-500 ml-1.5">
                    ({explanation.reductionPct.toFixed(0)}% shorter than fired rule)
                  </span>
                </div>
              </div>
            </div>

            {/* 3-Tier Visual Compression Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Full State α(x)</span>
                  <span className="font-mono tabular-nums text-slate-700">
                    {atoms.length} literals
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-sm overflow-hidden">
                  <div className="h-full bg-slate-400" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">
                    Fired Rule Antecedent ({firedRule?.id})
                  </span>
                  <span className="font-mono tabular-nums text-slate-700">
                    {firedRule?.literals.length ?? 0} literals
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-200"
                    style={{
                      width: `${((firedRule?.literals.length ?? 0) / atoms.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-900">
                    Minimal Abductive Explanation S (Proof-Backed)
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-emerald-700">
                    {explanation.minimalLiterals.length} literals
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-200"
                    style={{
                      width: `${(explanation.minimalLiterals.length / atoms.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Final Minimal Explanation Box */}
            <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#065F46]">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  Provably Sufficient Reason (Eq. 5: Γ ∧ ⋀S ∧ A_r ⊨ ⊥ for every
                  opposite-class rule r)
                </span>
              </div>
              <div className="font-mono text-xs text-slate-900 bg-white border border-[#A7F3D0] rounded p-3 space-y-1">
                <div>
                  <span className="text-slate-500">Symbolic: </span>
                  <span className="font-semibold text-[#047857]">
                    {formatRuleAntecedent(explanation.minimalLiterals, atoms)}
                  </span>{' '}
                  ⇒ {explanation.predictedClass}
                </div>
                <div>
                  <span className="text-slate-500">Clinical: </span>
                  {explanation.minimalLiterals
                    .map((l) => `[${formatLiteralInequality(l, atoms)}]`)
                    .join('  ∧  ')}
                </div>
              </div>
              <p className="text-xs text-[#065F46] leading-relaxed">
                Regardless of how the other{' '}
                <span className="font-mono font-semibold">
                  {atoms.length - explanation.minimalLiterals.length}
                </span>{' '}
                atomic conditions vary (even outside the training set), these{' '}
                {explanation.minimalLiterals.length} measurements logically force the{' '}
                <span className="font-semibold">
                  {explanation.predictedClass === 'Mal' ? 'Malignant' : 'Benign'}
                </span>{' '}
                classification.
              </p>
            </div>
          </div>

          {/* Step-by-Step Greedy Deletion Trace */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Algorithm 3 — Live Greedy Literal Deletion Trace
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Literals outside fired rule {firedRule?.id} are tested first, then literals
                inside {firedRule?.id}. One pass yields a subset-minimal explanation by
                monotonicity of entailment.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-2 font-medium">#</th>
                    <th className="py-2 px-2 font-medium">Literal</th>
                    <th className="py-2 px-2 font-medium">Condition</th>
                    <th className="py-2 px-2 font-medium">Origin</th>
                    <th className="py-2 px-2 font-medium">SAT Verdict</th>
                    <th className="py-2 pl-2 font-medium">Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {explanation.steps.map((step, i) => (
                    <tr
                      key={`${step.literal}-${i}`}
                      className={step.dropped ? 'text-slate-500' : 'bg-[#ECFDF5]/40'}
                    >
                      <td className="py-2 pr-2 font-mono tabular-nums text-slate-400">
                        {i + 1}
                      </td>
                      <td className="py-2 px-2 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {formatLiteralSymbol(step.literal, atoms)}
                      </td>
                      <td className="py-2 px-2 font-mono text-slate-700 whitespace-nowrap">
                        {formatLiteralInequality(step.literal, atoms)}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap text-slate-500">
                        {step.wasInFiredRule ? `In ${firedRule?.id}` : 'Outside rule'}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap font-semibold">
                        {step.dropped ? (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <MinusCircle className="w-3.5 h-3.5" />
                            Pruned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Kept in S
                          </span>
                        )}
                      </td>
                      <td className="py-2 pl-2 text-slate-600">{step.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modus Tollens Counter-Explanation */}
          {explanation.modusTollens[0] && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h2 className="text-base font-bold text-slate-900">
                Modus Tollens Refutation — Why NOT{' '}
                {explanation.modusTollens[0].oppositeClass === 'Mal'
                  ? 'Malignant'
                  : 'Benign'}
                ?
              </h2>
              <p className="text-xs text-slate-600">
                Applying <span className="font-mono">A_r → C_r, ¬C_r ∴ ¬A_r</span> to every
                opposite-class rule shows which clinical thresholds falsified each rival
                diagnosis:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {explanation.modusTollens[0].refutedRules.map((ref) => (
                  <div
                    key={ref.ruleId}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="font-mono font-semibold text-slate-900">
                      Rule {ref.ruleId} blocked because:
                    </div>
                    <div className="font-mono text-[11px] text-slate-600 mt-1">
                      Patient violates{' '}
                      {ref.falsifiedLiterals
                        .map((l) => formatLiteralInequality(l, atoms))
                        .join(' and ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
