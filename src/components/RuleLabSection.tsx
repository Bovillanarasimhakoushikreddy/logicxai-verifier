import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  GitMerge,
  Eye,
  EyeOff,
  ArrowLeftRight,
} from 'lucide-react';
import {
  DEPTH3_ATOMS,
  DEPTH3_RULES,
  DEPTH3_TREE_NODES,
  DEPTH5_ATOMS,
  DEPTH5_RULES,
} from '../data/reportData';
import {
  buildOrderingAxioms,
  formatLiteralInequality,
  formatRuleAntecedent,
  verifyRuleBase,
  type Rule,
} from '../engine/satSolver';

type DepthMode = 'depth3' | 'depth5';

const TABLE4_ROWS = [
  { a1: true, a2: true, a3: true },
  { a1: true, a2: true, a3: false },
  { a1: true, a2: false, a3: true },
  { a1: true, a2: false, a3: false },
  { a1: false, a2: true, a3: true },
  { a1: false, a2: true, a3: false },
  { a1: false, a2: false, a3: true },
  { a1: false, a2: false, a3: false },
];

export default function RuleLabSection() {
  const [depthMode, setDepthMode] = useState<DepthMode>('depth3');
  const [d3Rules, setD3Rules] = useState<Rule[]>(() =>
    DEPTH3_RULES.map((r) => ({ ...r, literals: [...r.literals] }))
  );
  const [d5Rules, setD5Rules] = useState<Rule[]>(() =>
    DEPTH5_RULES.map((r) => ({ ...r, literals: [...r.literals] }))
  );
  const [selectedRuleId, setSelectedRuleId] = useState<string>('ρ₂');
  const [showTruthTable, setShowTruthTable] = useState<boolean>(true);
  const [highlightRowIdx, setHighlightRowIdx] = useState<number>(0);

  const atoms = depthMode === 'depth3' ? DEPTH3_ATOMS : DEPTH5_ATOMS;
  const rules = depthMode === 'depth3' ? d3Rules : d5Rules;
  const setRules = depthMode === 'depth3' ? setD3Rules : setD5Rules;

  const axioms = useMemo(() => buildOrderingAxioms(atoms), [atoms]);
  const report = useMemo(() => verifyRuleBase(rules, atoms), [rules, atoms]);

  const selectedRule =
    rules.find((r) => r.id === selectedRuleId) ?? rules[0];

  // Determine which nodes/edges are highlighted for the selected Depth-3 leaf
  const highlightedNodeIds = useMemo(() => {
    if (depthMode !== 'depth3' || !selectedRule) return new Set<string>();
    const nodeMap = new Map(DEPTH3_TREE_NODES.map((n) => [n.id, n]));
    const parentOf = new Map<string, string>();
    for (const node of DEPTH3_TREE_NODES) {
      if (node.leftId) parentOf.set(node.leftId, node.id);
      if (node.rightId) parentOf.set(node.rightId, node.id);
    }
    const leaf = DEPTH3_TREE_NODES.find((n) => n.ruleId === selectedRule.id);
    const set = new Set<string>();
    let cur = leaf?.id;
    while (cur) {
      set.add(cur);
      cur = parentOf.get(cur);
      if (cur && !nodeMap.has(cur)) break;
    }
    return set;
  }, [depthMode, selectedRule]);

  const toggleRuleDisabled = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, disabled: !r.disabled } : r))
    );
  };

  const flipRuleClass = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId ? { ...r, cls: r.cls === 'Ben' ? 'Mal' : 'Ben' } : r
      )
    );
  };

  const injectDemoOverlapConflict = () => {
    const newId = `ρ*${rules.length + 1}`;
    const injected: Rule =
      depthMode === 'depth3'
        ? {
            id: newId,
            index: rules.length,
            literals: [1, -4], // worst radius <= 16.795 ^ worst texture > 23.74 -> Mal overlaps Ben rules ρ1, ρ2
            cls: 'Mal',
            isInjected: true,
          }
        : {
            id: newId,
            index: rules.length,
            literals: [1, 2, -8], // worst radius <= 16.795 ^ concave pts <= 0.14315 ^ worst texture > 23.74 -> Mal conflicts with Ben rules ρ1, ρ3, ρ4, ρ6
            cls: 'Mal',
            isInjected: true,
          };
    setRules((prev) => [...prev, injected]);
    setSelectedRuleId(newId);
  };

  const injectDemoDeadRule = () => {
    const newId = `ρ†${rules.length + 1}`;
    const injected: Rule =
      depthMode === 'depth3'
        ? {
            id: newId,
            index: rules.length,
            literals: [1, -1, 2], // direct contradiction a1 ^ !a1
            cls: 'Mal',
            isInjected: true,
          }
        : {
            id: newId,
            index: rules.length,
            literals: [8, -6], // worst texture <= 23.74 AND worst texture > 33.27 (violates Gamma!)
            cls: 'Mal',
            isInjected: true,
          };
    setRules((prev) => [...prev, injected]);
    setSelectedRuleId(newId);
  };

  const resetRuleBase = () => {
    if (depthMode === 'depth3') {
      setD3Rules(DEPTH3_RULES.map((r) => ({ ...r, literals: [...r.literals] })));
      setSelectedRuleId('ρ₂');
    } else {
      setD5Rules(DEPTH5_RULES.map((r) => ({ ...r, literals: [...r.literals] })));
      setSelectedRuleId('ρ₃');
    }
  };

  const handleModeSwitch = (mode: DepthMode) => {
    setDepthMode(mode);
    setSelectedRuleId(mode === 'depth3' ? 'ρ₂' : 'ρ₃');
  };

  const isModified =
    rules.length !== (depthMode === 'depth3' ? DEPTH3_RULES.length : DEPTH5_RULES.length) ||
    rules.some((r, idx) => {
      const orig = (depthMode === 'depth3' ? DEPTH3_RULES : DEPTH5_RULES)[idx];
      return !orig || r.disabled || r.cls !== orig.cls;
    });

  return (
    <div className="space-y-8">
      {/* Workspace Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Interactive Decision-Tree &amp; SAT Verification Lab
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Inspect extracted predicate-logic rules, disable rules to trigger P4 completeness
            gaps, or inject contradictions to observe live SAT witnesses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => handleModeSwitch('depth3')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                depthMode === 'depth3'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Depth-3 Worked Example (7 rules)
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('depth5')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                depthMode === 'depth5'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Depth-5 Theory (14 rules)
            </button>
          </div>
        </div>
      </div>

      {/* Live Algorithm 2 Verification Status Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* P1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">P1 · No Dead Rules</span>
            {report.deadRules.length === 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PASS
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#BE123C]">
                <XCircle className="w-3.5 h-3.5" />
                FAIL ({report.deadRules.length})
              </span>
            )}
          </div>
          <div className="mt-2 font-mono text-lg font-bold tabular-nums text-slate-900">
            {report.activeRuleCount - report.deadRules.length} / {report.activeRuleCount}{' '}
            <span className="text-xs font-normal text-slate-500">live rules</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {report.deadRules.length === 0
              ? 'All antecedents satisfiable under Γ'
              : report.deadRules[0].violatedAxiom}
          </p>
        </div>

        {/* P2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              P2 · Mutual Exclusivity
            </span>
            {report.overlaps.length === 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PASS
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                OVERLAP ({report.overlaps.length})
              </span>
            )}
          </div>
          <div className="mt-2 font-mono text-lg font-bold tabular-nums text-slate-900">
            {report.overlaps.length}{' '}
            <span className="text-xs font-normal text-slate-500">
              of {report.pairsChecked} pairs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Checked via 2-SAT pairwise assumptions
          </p>
        </div>

        {/* P3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              P3 · Class Consistency
            </span>
            {report.conflicts.length === 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PASS
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#BE123C]">
                <XCircle className="w-3.5 h-3.5" />
                CONFLICT ({report.conflicts.length})
              </span>
            )}
          </div>
          <div className="mt-2 font-mono text-lg font-bold tabular-nums text-slate-900">
            {report.conflicts.length}{' '}
            <span className="text-xs font-normal text-slate-500">contradictions</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {report.conflicts.length === 0
              ? 'Zero Ben/Mal contradictory overlaps'
              : `Conflict: ${report.conflicts[0].ruleA.id} vs ${report.conflicts[0].ruleB.id}`}
          </p>
        </div>

        {/* P4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">P4 · Completeness</span>
            {report.isComplete ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                COMPLETE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#BE123C]">
                <XCircle className="w-3.5 h-3.5" />
                GAP FOUND
              </span>
            )}
          </div>
          <div className="mt-2 font-mono text-lg font-bold tabular-nums text-slate-900">
            {report.elapsedMs.toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-500">
              ms ({report.totalQueries} SAT calls)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {report.isComplete
              ? 'De Morgan refutation Eq. (4) is UNSAT'
              : 'Satisfying assignment exposes uncovered region'}
          </p>
        </div>
      </div>

      {/* Live SAT Witness Inspector (Appears whenever P1, P3, or P4 fails) */}
      {(report.deadRules.length > 0 ||
        report.conflicts.length > 0 ||
        !report.isComplete) && (
        <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[#9F1239] font-semibold text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Formal Verification Counter-Examples &amp; SAT Witnesses</span>
            </div>
            <button
              type="button"
              onClick={resetRuleBase}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#9F1239] bg-white border border-[#FDA4AF] rounded-md hover:bg-[#FFE4E6] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore Conflict-Free Tree
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {report.deadRules.map((d) => (
              <div
                key={d.rule.id}
                className="bg-white border border-[#FECDD3] rounded-lg p-4 space-y-1.5"
              >
                <div className="text-xs font-semibold text-[#BE123C]">
                  P1 Violation — Dead Rule {d.rule.id}
                </div>
                <div className="font-mono text-xs text-slate-800">
                  {formatRuleAntecedent(d.rule.literals, atoms)}
                </div>
                <p className="text-xs text-slate-600">{d.violatedAxiom}</p>
              </div>
            ))}

            {report.conflicts.slice(0, 4).map((c, idx) => (
              <div
                key={`${c.ruleA.id}-${c.ruleB.id}-${idx}`}
                className="bg-white border border-[#FECDD3] rounded-lg p-4 space-y-2"
              >
                <div className="text-xs font-semibold text-[#BE123C]">
                  P3 Class Conflict — {c.ruleA.id} ({c.ruleA.cls}) clashes with{' '}
                  {c.ruleB.id} ({c.ruleB.cls})
                </div>
                <p className="text-xs text-slate-600">
                  Concrete SAT Witness (feasible clinical input where both rules fire):
                </p>
                <div className="font-mono text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded p-2.5 leading-relaxed">
                  {c.intervals.map((iv) => iv.formatted).join('  ∧  ')}
                </div>
              </div>
            ))}

            {!report.isComplete && report.gapWitness && (
              <div className="bg-white border border-[#FECDD3] rounded-lg p-4 space-y-2 lg:col-span-2">
                <div className="text-xs font-semibold text-[#BE123C]">
                  P4 Completeness Gap Witness — Input region where NO rule fires
                </div>
                <p className="text-xs text-slate-600">
                  The refutation formula Γ ∧ ⋀ₖ (¬Aₖ) is SAT. Any patient record matching
                  the interval below receives no classification:
                </p>
                <div className="font-mono text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded p-2.5 leading-relaxed">
                  {report.gapWitness.intervals.map((iv) => iv.formatted).join('  ∧  ')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Interactive Stage: Tree Visualizer (Depth 3) or Ordering Axiom Graph (Depth 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Main Visual Stage */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {depthMode === 'depth3'
                  ? 'Fig. 3 — Rooted Binary Decision Tree (Depth 3, 398 Training Records)'
                  : 'Appendix B — Depth-5 Formal Theory & Threshold-Ordering Axioms Γ'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {depthMode === 'depth3'
                  ? 'Click any leaf node to trace its root-to-leaf literal conjunction Aₖ and Lowest Common Ancestors.'
                  : '13 atomic predicates with background 2-CNF ordering axioms chaining thresholds of the same feature.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={injectDemoOverlapConflict}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                + Trigger P3 Conflict
              </button>
              <button
                type="button"
                onClick={injectDemoDeadRule}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                + Trigger Dead Rule
              </button>
              {isModified && (
                <button
                  type="button"
                  onClick={resetRuleBase}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] hover:bg-[#DBEAFE] rounded-md transition-colors whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {depthMode === 'depth3' ? (
            <div className="mt-4 overflow-x-auto">
              <svg
                viewBox="0 0 920 462"
                className="w-full min-w-[700px] h-auto select-none"
                role="img"
                aria-label="Interactive Depth-3 Decision Tree from Figure 3"
              >
                {/* Edges */}
                {DEPTH3_TREE_NODES.map((node) => {
                  const edges: { targetId: string; isLeft: boolean }[] = [];
                  if (node.leftId) edges.push({ targetId: node.leftId, isLeft: true });
                  if (node.rightId) edges.push({ targetId: node.rightId, isLeft: false });
                  return edges.map(({ targetId, isLeft }) => {
                    const target = DEPTH3_TREE_NODES.find((n) => n.id === targetId);
                    if (!target) return null;
                    const active =
                      highlightedNodeIds.has(node.id) &&
                      highlightedNodeIds.has(target.id);
                    const midX = (node.x + target.x) / 2;
                    const midY = (node.y + target.y) / 2;
                    return (
                      <g key={`${node.id}-${targetId}`}>
                        <line
                          x1={node.x}
                          y1={node.y + 30}
                          x2={target.x}
                          y2={target.y - 28}
                          stroke={active ? '#1D4ED8' : '#CBD5E1'}
                          strokeWidth={active ? 2.5 : 1.5}
                        />
                        <rect
                          x={midX - 18}
                          y={midY - 9}
                          width={36}
                          height={18}
                          rx={4}
                          fill={active ? '#EFF6FF' : '#F8FAFC'}
                          stroke={active ? '#93C5FD' : '#E2E8F0'}
                          strokeWidth={1}
                        />
                        <text
                          x={midX}
                          y={midY + 3.5}
                          textAnchor="middle"
                          fontSize={10}
                          fontFamily="IBM Plex Mono, monospace"
                          fontWeight={600}
                          fill={active ? '#1D4ED8' : '#64748B'}
                        >
                          {isLeft ? 'True' : 'False'}
                        </text>
                      </g>
                    );
                  });
                })}

                {/* Nodes */}
                {DEPTH3_TREE_NODES.map((node) => {
                  const isHighlighted = highlightedNodeIds.has(node.id);
                  const matchingRule = node.ruleId
                    ? rules.find((r) => r.id === node.ruleId)
                    : undefined;
                  const isDisabled = matchingRule?.disabled;
                  const effectiveCls = matchingRule?.cls ?? node.cls;
                  const boxW = node.isLeaf ? 112 : 164;
                  const boxH = node.isLeaf ? 60 : 62;

                  const fillColor = isDisabled
                    ? '#F1F5F9'
                    : effectiveCls === 'Ben'
                    ? isHighlighted
                      ? '#DBEAFE'
                      : '#EFF6FF'
                    : isHighlighted
                    ? '#FFE4E6'
                    : '#FFF1F2';

                  const strokeColor = isDisabled
                    ? '#94A3B8'
                    : isHighlighted
                    ? '#1D4ED8'
                    : effectiveCls === 'Ben'
                    ? '#93C5FD'
                    : '#FDA4AF';

                  return (
                    <g
                      key={node.id}
                      onClick={() => {
                        if (node.ruleId) setSelectedRuleId(node.ruleId);
                      }}
                      className={node.isLeaf ? 'cursor-pointer' : ''}
                    >
                      <rect
                        x={node.x - boxW / 2}
                        y={node.y - boxH / 2}
                        width={boxW}
                        height={boxH}
                        rx={8}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isHighlighted ? 2.2 : 1.2}
                        strokeDasharray={isDisabled ? '4 3' : undefined}
                      />
                      {node.isLeaf ? (
                        <>
                          <text
                            x={node.x}
                            y={node.y - 11}
                            textAnchor="middle"
                            fontSize={12}
                            fontFamily="IBM Plex Mono, monospace"
                            fontWeight={700}
                            fill={isDisabled ? '#64748B' : '#0F172A'}
                          >
                            {node.ruleId} · {effectiveCls === 'Ben' ? 'Benign' : 'Malignant'}
                          </text>
                          <text
                            x={node.x}
                            y={node.y + 6}
                            textAnchor="middle"
                            fontSize={10.5}
                            fontFamily="IBM Plex Mono, monospace"
                            fill="#475569"
                          >
                            n = {node.samples} [{node.value[0]}M, {node.value[1]}B]
                          </text>
                          <text
                            x={node.x}
                            y={node.y + 21}
                            textAnchor="middle"
                            fontSize={9.5}
                            fontFamily="DM Sans, sans-serif"
                            fill={isDisabled ? '#BE123C' : '#64748B'}
                          >
                            {isDisabled ? 'Disabled (Gap)' : 'Click to inspect'}
                          </text>
                        </>
                      ) : (
                        <>
                          <text
                            x={node.x}
                            y={node.y - 12}
                            textAnchor="middle"
                            fontSize={11}
                            fontFamily="IBM Plex Mono, monospace"
                            fontWeight={600}
                            fill="#0F172A"
                          >
                            a{node.atomId}: {node.condition}
                          </text>
                          <text
                            x={node.x}
                            y={node.y + 5}
                            textAnchor="middle"
                            fontSize={10}
                            fontFamily="IBM Plex Mono, monospace"
                            fill="#475569"
                          >
                            samples = {node.samples}
                          </text>
                          <text
                            x={node.x}
                            y={node.y + 20}
                            textAnchor="middle"
                            fontSize={10}
                            fontFamily="IBM Plex Mono, monospace"
                            fill="#64748B"
                          >
                            [{node.value[0]} Mal, {node.value[1]} Ben]
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            /* Depth-5 Ordering Axioms & Atom Matrix */
            <div className="mt-5 space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-800">
                    Background Threshold-Ordering Axioms Γ ({axioms.length} 2-CNF clauses)
                  </h3>
                  <span className="text-xs font-mono text-[#1D4ED8]">
                    Hypothetical Syllogism Chain
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Because <span className="font-mono text-slate-800">worst texture</span>{' '}
                  appears at three thresholds in Depth 5, Γ prevents the SAT solver from
                  picking impossible combinations (e.g. texture ≤ 23.74 ∧ texture &gt;
                  33.27).
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs">
                  <span className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-900">
                    a₈ [worst texture ≤ 23.74]
                  </span>
                  <span className="text-[#1D4ED8] font-bold">→</span>
                  <span className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-900">
                    a₁₃ [worst texture ≤ 30.975]
                  </span>
                  <span className="text-[#1D4ED8] font-bold">→</span>
                  <span className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-900">
                    a₆ [worst texture ≤ 33.27]
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {axioms.map((ax, i) => (
                    <div
                      key={i}
                      className="text-xs font-mono bg-white border border-slate-200 rounded px-3 py-2 text-slate-700"
                    >
                      {ax.formula}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-700 mb-2.5">
                  Table B1 — Atomic Propositions (n = 13)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {atoms.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs"
                    >
                      <span className="font-mono font-semibold text-[#1D4ED8]">
                        {a.symbol}
                      </span>
                      <span className="font-mono text-slate-800">
                        [{a.feature} ≤ {a.threshold}]
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Deck: Selected Rule Predicate-Logic Inspector */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Selected Rule Inspector
            </h2>
            <span className="text-xs font-mono text-slate-500">
              {selectedRule?.id}
            </span>
          </div>

          {selectedRule && (
            <>
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-500">
                  Predicate-Logic Form (Eq. 2)
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-900 leading-relaxed">
                  {selectedRule.id}: ∀x ∈ D (
                  {formatRuleAntecedent(selectedRule.literals, atoms)} →{' '}
                  <span
                    className={
                      selectedRule.cls === 'Mal'
                        ? 'text-[#BE123C] font-semibold'
                        : 'text-[#1D4ED8] font-semibold'
                    }
                  >
                    {selectedRule.cls}(x)
                  </span>
                  )
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-500">
                  Readable Clinical Conditions ({selectedRule.literals.length} literals)
                </div>
                <ul className="space-y-1.5">
                  {selectedRule.literals.map((lit, i) => (
                    <li
                      key={`${lit}-${i}`}
                      className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-mono"
                    >
                      <span className="text-slate-800">
                        {formatLiteralInequality(lit, atoms)}
                      </span>
                      <span className="text-slate-400">
                        {lit > 0 ? `+a${Math.abs(lit)}` : `¬a${Math.abs(lit)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-xs font-medium text-slate-500">
                  Interactive Perturbation Controls
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleRuleDisabled(selectedRule.id)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    {selectedRule.disabled ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        Re-enable Rule
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Disable (Gap)
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => flipRuleClass(selectedRule.id)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    Flip Class
                  </button>
                </div>
              </div>

              {depthMode === 'depth3' && (
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-800">
                    Atomic Dictionary (Depth 3)
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-slate-600">
                    {DEPTH3_ATOMS.map((a) => (
                      <div key={a.id}>
                        <span className="text-[#1D4ED8] font-semibold">{a.symbol}</span> = [
                        {a.feature} ≤ {a.threshold}]
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Full Rule Base Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            {depthMode === 'depth3'
              ? 'Table 3 — Extracted Depth-3 Rule Base'
              : 'Table B2 — Extracted Depth-5 Rule Base'}
          </h2>
          <span className="text-xs text-slate-500">
            Click any row to inspect · Toggle rules to test Completeness (P4) live
          </span>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2.5 pr-3 font-medium">Rule</th>
                <th className="py-2.5 px-3 font-medium">Antecedent Aₖ(x)</th>
                <th className="py-2.5 px-3 font-medium">Len</th>
                <th className="py-2.5 px-3 font-medium">Class</th>
                {depthMode === 'depth3' && (
                  <th className="py-2.5 px-3 font-medium">Train Covered</th>
                )}
                <th className="py-2.5 px-3 font-medium">SAT Status</th>
                <th className="py-2.5 pl-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((rule) => {
                const isSelected = rule.id === selectedRule?.id;
                const isDead = report.deadRules.some((d) => d.rule.id === rule.id);
                const hasConflict = report.conflicts.some(
                  (c) => c.ruleA.id === rule.id || c.ruleB.id === rule.id
                );

                return (
                  <tr
                    key={rule.id}
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#EFF6FF]/70'
                        : 'hover:bg-slate-50'
                    } ${rule.disabled ? 'opacity-55' : ''}`}
                  >
                    <td className="py-2.5 pr-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {rule.id}
                      {rule.isInjected && (
                        <span className="ml-1.5 text-[11px] font-sans font-medium text-[#BE123C]">
                          (injected)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-800 whitespace-nowrap">
                      {formatRuleAntecedent(rule.literals, atoms)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs tabular-nums text-slate-600">
                      {rule.literals.length}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs font-semibold whitespace-nowrap">
                      <span
                        className={
                          rule.cls === 'Mal' ? 'text-[#BE123C]' : 'text-[#1D4ED8]'
                        }
                      >
                        {rule.cls === 'Mal' ? 'Malignant' : 'Benign'}
                      </span>
                    </td>
                    {depthMode === 'depth3' && (
                      <td className="py-2.5 px-3 font-mono text-xs tabular-nums text-slate-600">
                        {rule.trainCovered ?? '—'}
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-xs font-medium whitespace-nowrap">
                      {rule.disabled ? (
                        <span className="text-slate-500">Disabled</span>
                      ) : isDead ? (
                        <span className="text-[#BE123C]">✕ Dead (UNSAT)</span>
                      ) : hasConflict ? (
                        <span className="text-[#BE123C]">✕ Class Conflict</span>
                      ) : (
                        <span className="text-emerald-700">✓ Live &amp; Consistent</span>
                      )}
                    </td>
                    <td
                      className="py-2.5 pl-3 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => toggleRuleDisabled(rule.id)}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 mr-3 cursor-pointer"
                      >
                        {rule.disabled ? 'Enable' : 'Disable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => flipRuleClass(rule.id)}
                        className="text-xs font-medium text-[#1D4ED8] hover:underline cursor-pointer"
                      >
                        Flip
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 4 Interactive Resolution Merge Truth-Table Proof */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-[#1D4ED8]" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Table 4 — Exhaustive Truth-Table Proof of Resolution Rule Merge
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Sibling leaves <span className="font-mono">ρ₁</span> and{' '}
                <span className="font-mono">ρ₂</span> share class Benign and differ only in{' '}
                <span className="font-mono">a₃</span>, simplifying{' '}
                <span className="font-mono text-slate-900">
                  (a₁ ∧ a₂ ∧ a₃) ∨ (a₁ ∧ a₂ ∧ ¬a₃) ≡ a₁ ∧ a₂
                </span>
                .
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTruthTable((v) => !v)}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
          >
            {showTruthTable ? 'Hide Proof Table' : 'Show Proof Table'}
          </button>
        </div>

        {showTruthTable && (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3 font-medium">Row</th>
                  <th className="py-2 px-3 font-medium">a₁</th>
                  <th className="py-2 px-3 font-medium">a₂</th>
                  <th className="py-2 px-3 font-medium">a₃</th>
                  <th className="py-2 px-3 font-medium">ρ₁ (a₁∧a₂∧a₃)</th>
                  <th className="py-2 px-3 font-medium">ρ₂ (a₁∧a₂∧¬a₃)</th>
                  <th className="py-2 px-3 font-medium">Merged (ρ₁ ∨ ρ₂)</th>
                  <th className="py-2 px-3 font-medium">Simplified (a₁ ∧ a₂)</th>
                  <th className="py-2 pl-3 font-medium">Equal?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {TABLE4_ROWS.map((row, idx) => {
                  const r1 = row.a1 && row.a2 && row.a3;
                  const r2 = row.a1 && row.a2 && !row.a3;
                  const merged = r1 || r2;
                  const simp = row.a1 && row.a2;
                  const isSel = idx === highlightRowIdx;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setHighlightRowIdx(idx)}
                      className={`cursor-pointer ${
                        isSel ? 'bg-[#EFF6FF]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2 pr-3 text-slate-400 tabular-nums">{idx + 1}</td>
                      <td className="py-2 px-3">{row.a1 ? 'T' : 'F'}</td>
                      <td className="py-2 px-3">{row.a2 ? 'T' : 'F'}</td>
                      <td className="py-2 px-3">{row.a3 ? 'T' : 'F'}</td>
                      <td className="py-2 px-3 text-slate-600">{r1 ? 'T' : 'F'}</td>
                      <td className="py-2 px-3 text-slate-600">{r2 ? 'T' : 'F'}</td>
                      <td
                        className={`py-2 px-3 font-semibold ${
                          merged ? 'text-[#1D4ED8]' : 'text-slate-500'
                        }`}
                      >
                        {merged ? 'T' : 'F'}
                      </td>
                      <td
                        className={`py-2 px-3 font-semibold ${
                          simp ? 'text-[#1D4ED8]' : 'text-slate-500'
                        }`}
                      >
                        {simp ? 'T' : 'F'}
                      </td>
                      <td className="py-2 pl-3 text-emerald-700 font-semibold">
                        {merged === simp ? '✓ Equivalent' : '✕'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
