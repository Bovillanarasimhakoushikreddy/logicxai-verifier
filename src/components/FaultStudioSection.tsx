import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Shuffle,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  DEPTH5_ATOMS,
  DEPTH5_RULES,
  EXPERIMENT2_DATA,
  getCalibratedCohort,
} from '../data/reportData';
import {
  buildOrderingAxioms,
  evaluateRecordToLiterals,
  formatLiteralInequality,
  formatRuleAntecedent,
  modelToFeatureIntervals,
  SatSolver,
  type ClassLabel,
  type FeatureInterval,
  type Rule,
} from '../engine/satSolver';

type AtomPolarity = 0 | 1 | -1; // 0 = unused, +1 = <= t, -1 = > t

interface MonteCarloSummary {
  k: number;
  trials: number;
  deadCount: number;
  liveCount: number;
  satConflicts: number;
  witnessedAll569: number;
  witnessedTest171: number;
  missedAllPct: number;
  missedTestPct: number;
  elapsedMs: number;
}

export default function FaultStudioSection() {
  // Default to a realistic specific 5-literal injected rule that creates a real SAT conflict
  // yet is narrow enough that empirical testing often misses it
  const [polarities, setPolarities] = useState<Record<number, AtomPolarity>>({
    1: 1, // worst radius <= 16.795
    2: 1, // worst concave points <= 0.14315
    3: 1, // smoothness error <= 0.003294
    4: 1, // worst fractal dimension <= 0.0708
    12: -1, // worst concavity > 0.1907
  });
  const [injectedClass, setInjectedClass] = useState<ClassLabel>('Mal');
  const [randomK, setRandomK] = useState<number>(5);
  const [mcResult, setMcResult] = useState<MonteCarloSummary | null>(null);

  const cohort = useMemo(() => getCalibratedCohort(), []);
  const axioms = useMemo(() => buildOrderingAxioms(DEPTH5_ATOMS), []);
  const axiomClauses = useMemo(() => axioms.map((a) => a.clause), [axioms]);

  const injectedLiterals = useMemo(() => {
    const lits: number[] = [];
    for (const atom of DEPTH5_ATOMS) {
      const p = polarities[atom.id] ?? 0;
      if (p === 1) lits.push(atom.id);
      else if (p === -1) lits.push(-atom.id);
    }
    return lits;
  }, [polarities]);

  // Evaluate the custom injected rule against Depth-5 Theory (SAT + Empirical Cohort)
  const analysis = useMemo(() => {
    const t0 = performance.now();
    const solver = new SatSolver(axiomClauses, DEPTH5_ATOMS.length);

    if (injectedLiterals.length === 0) {
      return {
        empty: true,
        isLive: false,
        deadReason: 'Select at least one literal to construct an injected rule.',
        satConflicts: [] as { rule: Rule; intervals: FeatureInterval[] }[],
        satSameClassOverlaps: [] as Rule[],
        witnessedRecordsAll: [] as number[],
        witnessedRecordsTest: [] as number[],
        satTimeMs: 0,
      };
    }

    // 1. P1 Dead-Rule check
    const liveRes = solver.solve(injectedLiterals);
    if (!liveRes.sat) {
      // Check ordering axiom clash
      let deadReason = 'Antecedent is unsatisfiable under background ordering axioms Γ.';
      const litSet = new Set(injectedLiterals);
      const texAtoms = DEPTH5_ATOMS.filter((a) => a.feature === 'worst texture').sort(
        (a, b) => a.threshold - b.threshold
      );
      for (let i = 0; i < texAtoms.length; i++) {
        for (let j = i + 1; j < texAtoms.length; j++) {
          if (litSet.has(texAtoms[i].id) && litSet.has(-texAtoms[j].id)) {
            deadReason = `Violates ordering axiom Γ: [worst texture ≤ ${texAtoms[i].threshold}] ∧ [worst texture > ${texAtoms[j].threshold}] is impossible in ℝ.`;
          }
        }
      }
      return {
        empty: false,
        isLive: false,
        deadReason,
        satConflicts: [],
        satSameClassOverlaps: [],
        witnessedRecordsAll: [],
        witnessedRecordsTest: [],
        satTimeMs: Math.max(0.01, performance.now() - t0),
      };
    }

    // 2. P2/P3 SAT Conflict Check against all 14 Depth-5 rules
    const satConflicts: { rule: Rule; intervals: FeatureInterval[] }[] = [];
    const satSameClassOverlaps: Rule[] = [];

    for (const rule of DEPTH5_RULES) {
      const res = solver.solve([...injectedLiterals, ...rule.literals]);
      if (res.sat) {
        if (rule.cls !== injectedClass) {
          const relevant = new Set<number>([
            ...injectedLiterals.map((l) => Math.abs(l)),
            ...rule.literals.map((l) => Math.abs(l)),
          ]);
          satConflicts.push({
            rule,
            intervals: modelToFeatureIntervals(res.model, DEPTH5_ATOMS, relevant),
          });
        } else {
          satSameClassOverlaps.push(rule);
        }
      }
    }
    const satTimeMs = Math.max(0.01, performance.now() - t0);

    // 3. Empirical Testing Baseline over 569 records (and 171 held-out)
    const witnessedRecordsAll: number[] = [];
    const witnessedRecordsTest: number[] = [];

    for (const rec of cohort) {
      const stateLits = evaluateRecordToLiterals(rec.values, DEPTH5_ATOMS);
      const stateSet = new Set(stateLits);
      const injectedFires = injectedLiterals.every((l) => stateSet.has(l));
      if (!injectedFires) continue;

      // Find which existing Depth-5 rule fires on rec
      const fired = DEPTH5_RULES.find((r) => r.literals.every((l) => stateSet.has(l)));
      if (fired && fired.cls !== injectedClass) {
        witnessedRecordsAll.push(rec.id);
        if (rec.split === 'test') {
          witnessedRecordsTest.push(rec.id);
        }
      }
    }

    return {
      empty: false,
      isLive: true,
      deadReason: '',
      satConflicts,
      satSameClassOverlaps,
      witnessedRecordsAll,
      witnessedRecordsTest,
      satTimeMs,
    };
  }, [axiomClauses, cohort, injectedClass, injectedLiterals]);

  const setAtomPol = (atomId: number, pol: AtomPolarity) => {
    setPolarities((prev) => ({ ...prev, [atomId]: pol }));
  };

  const loadPreset = (type: 'stealth' | 'dead' | 'broad') => {
    if (type === 'stealth') {
      setPolarities({
        1: 1,
        2: 1,
        3: 1,
        4: 1,
        12: -1,
      });
      setInjectedClass('Mal');
    } else if (type === 'dead') {
      setPolarities({
        8: 1, // worst texture <= 23.74
        6: -1, // worst texture > 33.27
        1: 1,
      });
      setInjectedClass('Mal');
    } else {
      setPolarities({
        1: 1,
        12: -1,
      });
      setInjectedClass('Mal');
    }
  };

  const generateRandomFault = (k: number) => {
    const ids = DEPTH5_ATOMS.map((a) => a.id);
    // Fisher-Yates partial shuffle
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const chosen = ids.slice(0, k);
    const nextPol: Record<number, AtomPolarity> = {};
    for (const id of chosen) {
      nextPol[id] = Math.random() < 0.5 ? 1 : -1;
    }
    setPolarities(nextPol);
    setInjectedClass(Math.random() < 0.5 ? 'Ben' : 'Mal');
  };

  const runLiveMonteCarlo = (k: number) => {
    const trials = 200;
    const t0 = performance.now();
    const solver = new SatSolver(axiomClauses, DEPTH5_ATOMS.length);

    // Precompute cohort state sets & base predictions once
    const cohortCompiled = cohort.map((rec) => {
      const stateSet = new Set(evaluateRecordToLiterals(rec.values, DEPTH5_ATOMS));
      const baseRule = DEPTH5_RULES.find((r) => r.literals.every((l) => stateSet.has(l)));
      return {
        split: rec.split,
        stateSet,
        baseCls: baseRule?.cls ?? 'Ben',
      };
    });

    let deadCount = 0;
    let liveCount = 0;
    let satConflicts = 0;
    let witnessedAll569 = 0;
    let witnessedTest171 = 0;

    for (let trial = 0; trial < trials; trial++) {
      const ids = DEPTH5_ATOMS.map((a) => a.id);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      const lits = ids.slice(0, k).map((id) => (Math.random() < 0.5 ? id : -id));
      const cls: ClassLabel = Math.random() < 0.5 ? 'Ben' : 'Mal';

      if (!solver.solve(lits).sat) {
        deadCount++;
        continue;
      }
      liveCount++;

      let hasSatConflict = false;
      for (const r of DEPTH5_RULES) {
        if (r.cls !== cls && solver.solve([...lits, ...r.literals]).sat) {
          hasSatConflict = true;
          break;
        }
      }

      if (hasSatConflict) {
        satConflicts++;
        let seenAll = false;
        let seenTest = false;
        for (const rec of cohortCompiled) {
          if (rec.baseCls !== cls && lits.every((l) => rec.stateSet.has(l))) {
            seenAll = true;
            if (rec.split === 'test') {
              seenTest = true;
              break;
            }
          }
        }
        if (seenAll) witnessedAll569++;
        if (seenTest) witnessedTest171++;
      }
    }

    const elapsedMs = performance.now() - t0;
    setMcResult({
      k,
      trials,
      deadCount,
      liveCount,
      satConflicts,
      witnessedAll569,
      witnessedTest171,
      missedAllPct:
        satConflicts > 0 ? ((satConflicts - witnessedAll569) / satConflicts) * 100 : 0,
      missedTestPct:
        satConflicts > 0 ? ((satConflicts - witnessedTest171) / satConflicts) * 100 : 0,
      elapsedMs,
    });
  };

  const reportRowForK = EXPERIMENT2_DATA.find((d) => d.k === randomK) ?? EXPERIMENT2_DATA[4];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Fault Injection &amp; SAT Witness Studio
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Inject a hand-crafted or random rule into the Depth-5 theory (14 rules, 13
            atoms) to compare exact SAT detection against sample-based testing on 569
            records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => loadPreset('stealth')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            Stealth Conflict (k=5)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('dead')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            Ordering Clash (Dead)
          </button>
          <button
            type="button"
            onClick={() => generateRandomFault(randomK)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Random Fault (k={randomK})
          </button>
        </div>
      </div>

      {/* Asymmetric Split Console: Left Rule Builder (5 cols) | Right Live Verdict & Witness (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Rule Composer */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Compose Injected Rule ρ_new
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {injectedLiterals.length} literals selected from Depth-5 atoms
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPolarities({})}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>

          {/* Class selector */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700">
              Consequent Class C_new
            </span>
            <div className="inline-flex p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setInjectedClass('Ben')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  injectedClass === 'Ben'
                    ? 'bg-white text-[#1D4ED8] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Benign (Ben)
              </button>
              <button
                type="button"
                onClick={() => setInjectedClass('Mal')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  injectedClass === 'Mal'
                    ? 'bg-white text-[#BE123C] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Malignant (Mal)
              </button>
            </div>
          </div>

          {/* Atom toggle list */}
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
            {DEPTH5_ATOMS.map((atom) => {
              const pol = polarities[atom.id] ?? 0;
              return (
                <div
                  key={atom.id}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs transition-colors ${
                    pol !== 0
                      ? 'bg-[#EFF6FF]/60 border-[#BFDBFE]'
                      : 'bg-slate-50/50 border-slate-200/80'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="font-mono font-semibold text-[#1D4ED8] mr-1.5">
                      {atom.symbol}
                    </span>
                    <span className="font-mono text-slate-700 truncate">
                      {atom.feature} ≤ {atom.threshold}
                    </span>
                  </div>
                  <div className="inline-flex shrink-0 bg-white border border-slate-200 rounded-md p-0.5">
                    <button
                      type="button"
                      onClick={() => setAtomPol(atom.id, pol === 1 ? 0 : 1)}
                      className={`px-2 py-0.5 font-mono rounded text-[11px] font-semibold cursor-pointer ${
                        pol === 1
                          ? 'bg-[#1D4ED8] text-white'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      ≤
                    </button>
                    <button
                      type="button"
                      onClick={() => setAtomPol(atom.id, pol === -1 ? 0 : -1)}
                      className={`px-2 py-0.5 font-mono rounded text-[11px] font-semibold cursor-pointer ${
                        pol === -1
                          ? 'bg-[#BE123C] text-white'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Verification Comparison & SAT Witness Output */}
        <div className="lg:col-span-7 space-y-6">
          {/* Formula Preview */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Formal Verification vs. Empirical Testing Verdict
              </h2>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                SAT check: {analysis.satTimeMs.toFixed(2)} ms
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-900 overflow-x-auto">
              ρ_new : ∀x ∈ D ({formatRuleAntecedent(injectedLiterals, DEPTH5_ATOMS)} →{' '}
              <span
                className={
                  injectedClass === 'Mal'
                    ? 'text-[#BE123C] font-semibold'
                    : 'text-[#1D4ED8] font-semibold'
                }
              >
                {injectedClass}(x)
              </span>
              )
            </div>

            {analysis.empty ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                Select one or more atoms on the left to test an injected rule.
              </p>
            ) : !analysis.isLive ? (
              <div className="p-4 bg-[#FFF1F2] border border-[#FECDD3] rounded-lg space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#9F1239]">
                  <XCircle className="w-4 h-4" />
                  Dead Rule Caught by SAT (P1 Violation)
                </div>
                <p className="text-xs text-[#881337]">{analysis.deadReason}</p>
                <p className="text-xs text-slate-600 pt-1">
                  In Experiment 2, 13.0% of random 6-literal rules were self-contradictory
                  under Γ; sample testing never distinguishes a dead rule from a rare
                  clinical rule.
                </p>
              </div>
            ) : (
              <>
                {/* Side-by-side 3-Engine Detection Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="border border-slate-200 rounded-lg p-4">
                    <div className="text-xs text-slate-500">Formal SAT Verifier</div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-sm font-bold">
                      {analysis.satConflicts.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-[#BE123C]">
                          <XCircle className="w-4 h-4" />
                          Conflict Detected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                          Consistent
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono tabular-nums text-slate-600 mt-1">
                      {analysis.satConflicts.length} conflicting rule(s)
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-4">
                    <div className="text-xs text-slate-500">Testing (All 569 Records)</div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-sm font-bold">
                      {analysis.satConflicts.length === 0 ? (
                        <span className="text-emerald-700">No Conflict</span>
                      ) : analysis.witnessedRecordsAll.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-amber-700">
                          <AlertTriangle className="w-4 h-4" />
                          Exposed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[#BE123C]">
                          <AlertTriangle className="w-4 h-4" />
                          MISSED (Blind!)
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono tabular-nums text-slate-600 mt-1">
                      {analysis.witnessedRecordsAll.length} / 569 records hit
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-4">
                    <div className="text-xs text-slate-500">Testing (171 Held-out)</div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-sm font-bold">
                      {analysis.satConflicts.length === 0 ? (
                        <span className="text-emerald-700">No Conflict</span>
                      ) : analysis.witnessedRecordsTest.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-amber-700">
                          <AlertTriangle className="w-4 h-4" />
                          Exposed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[#BE123C]">
                          <AlertTriangle className="w-4 h-4" />
                          MISSED (Blind!)
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono tabular-nums text-slate-600 mt-1">
                      {analysis.witnessedRecordsTest.length} / 171 test hits
                    </div>
                  </div>
                </div>

                {/* Callout if SAT found a conflict that testing missed! */}
                {analysis.satConflicts.length > 0 &&
                  analysis.witnessedRecordsAll.length === 0 && (
                    <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-xs text-[#92400E] leading-relaxed">
                      <span className="font-semibold">
                        Geometric Blind Spot Demonstrated:{' '}
                      </span>
                      This injected rule creates a real logical contradiction in ℝ³⁰, yet{' '}
                      <span className="font-mono font-semibold">0 of 569</span> dataset
                      records lie in the conflicting hyper-rectangle. Accuracy testing passes
                      silently, while SAT proves the defect and constructs the exact patient
                      region below.
                    </div>
                  )}

                {/* SAT Witness Panel */}
                {analysis.satConflicts.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-slate-700">
                      Concrete SAT Conflict Witnesses (Showing{' '}
                      {Math.min(3, analysis.satConflicts.length)} of{' '}
                      {analysis.satConflicts.length})
                    </h3>
                    {analysis.satConflicts.slice(0, 3).map((cw) => (
                      <div
                        key={cw.rule.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-slate-900">
                            ρ_new ({injectedClass}) contradicts existing rule{' '}
                            <span className="font-mono text-[#1D4ED8]">{cw.rule.id}</span> (
                            {cw.rule.cls})
                          </span>
                          <span className="font-mono text-slate-500">
                            SAT(Γ ∧ A_new ∧ A_{cw.rule.index + 1}) = True
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-600">
                          Existing {cw.rule.id}:{' '}
                          {cw.rule.literals
                            .map((l) => formatLiteralInequality(l, DEPTH5_ATOMS))
                            .join(' ∧ ')}
                        </div>
                        <div className="bg-white border border-slate-200 rounded p-2.5">
                          <div className="text-[11px] font-medium text-[#BE123C] mb-1">
                            Contradictory Clinical Region (SAT Witness Assignment):
                          </div>
                          <div className="font-mono text-xs text-slate-900 leading-relaxed">
                            {cw.intervals.map((iv) => iv.formatted).join('  ∧  ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Live Monte Carlo Experiment 2 Runner */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Live Experiment 2 Batch Simulator (200 Trials)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Replicate Section 3.3 live in your browser: inject 200 random k-literal
                  rules into Depth-5 and compare SAT against 569-record testing.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
                  <span>Rule length k:</span>
                  <select
                    value={randomK}
                    onChange={(e) => setRandomK(Number(e.target.value))}
                    className="font-mono text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-900"
                  >
                    {[1, 2, 3, 4, 5, 6].map((k) => (
                      <option key={k} value={k}>
                        k = {k}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => runLiveMonteCarlo(randomK)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  Run 200 Trials
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs font-semibold text-slate-700">
                  Report Baseline (Table 6 · 1,000 trials at k = {randomK})
                </div>
                <div className="mt-3 space-y-1.5 text-xs font-mono tabular-nums text-slate-700">
                  <div className="flex justify-between">
                    <span>Dead rules caught:</span>
                    <span className="font-semibold">{reportRowForK.dead} / 1000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Real conflicts (SAT):</span>
                    <span className="font-semibold text-[#1D4ED8]">
                      {reportRowForK.satConflicts} ({reportRowForK.satPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Missed by 569 records:</span>
                    <span className="font-semibold text-[#BE123C]">
                      {reportRowForK.missed569Pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Missed by 171 held-out:</span>
                    <span className="font-semibold text-[#BE123C]">
                      {reportRowForK.missed171Pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-lg">
                <div className="text-xs font-semibold text-slate-700">
                  Live Browser Run{' '}
                  {mcResult ? `(k = ${mcResult.k} · ${mcResult.elapsedMs.toFixed(0)} ms)` : '(Click Run 200 Trials)'}
                </div>
                {mcResult ? (
                  <div className="mt-3 space-y-1.5 text-xs font-mono tabular-nums text-slate-700">
                    <div className="flex justify-between">
                      <span>Dead rules caught:</span>
                      <span className="font-semibold">
                        {mcResult.deadCount} / {mcResult.trials}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Real conflicts (SAT):</span>
                      <span className="font-semibold text-[#1D4ED8]">
                        {mcResult.satConflicts} / {mcResult.liveCount} live
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Missed by 569 cohort:</span>
                      <span className="font-semibold text-[#BE123C]">
                        {mcResult.missedAllPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Missed by 171 test split:</span>
                      <span className="font-semibold text-[#BE123C]">
                        {mcResult.missedTestPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                    Execute 200 live random rule injections right now to verify how quickly
                    testing miss rates climb as rule specificity k increases from 1 to 6.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
