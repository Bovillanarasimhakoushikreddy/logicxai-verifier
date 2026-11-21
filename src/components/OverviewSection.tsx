import { useState } from 'react';
import { ArrowRight, Check, BookOpen, GitBranch, ShieldCheck, FileText } from 'lucide-react';
import {
  PIPELINE_STAGES,
  REPORT_METADATA,
  TABLE1_INFERENCE_RULES,
  TABLE12_DMGT_MAPPING,
} from '../data/reportData';

interface OverviewSectionProps {
  onNavigate: (tab: 'overview' | 'rule-lab' | 'fault-studio' | 'explainer' | 'experiments') => void;
  onOpenReport: () => void;
}

const THEOREM_PARTS = [
  {
    id: 'part-1',
    label: '(i) Mutual Exclusivity (P2) & Consistency (P3)',
    claim: 'For all distinct leaves i ≠ j, Γ ∧ Aᵢ ∧ Aⱼ is unsatisfiable.',
    proof:
      'Let v be the unique Lowest Common Ancestor (LCA) of leaves i and j in the rooted binary tree, testing atom a. One path takes the True (left) branch collecting +a, while the other takes the False (right) branch collecting ¬a. Thus Aᵢ ∧ Aⱼ contains (a ∧ ¬a), which is unsatisfiable by contradiction even without Γ. Because P2 ⇒ P3, class consistency follows immediately.',
    formula: 'LCA(i, j) = v(a)  ⇒  a ∈ Aᵢ ∧ ¬a ∈ Aⱼ  ⇒  Aᵢ ∧ Aⱼ ⊨ ⊥',
  },
  {
    id: 'part-2',
    label: '(ii) Completeness (P4)',
    claim: 'Every input x satisfies at least one rule: Γ ⊨ A₁ ∨ … ∨ A_R.',
    proof:
      'At every internal vertex testing atom a, every numeric record x satisfies either x_f ≤ t (a is True) or x_f > t (¬a is True) by the Law of Excluded Middle. Following the unique satisfied branch from root to leaf guarantees reaching some leaf k with Aₖ(x) = True. By De Morgan’s law, the refutation CNF Γ ∧ ⋀ₖ (¬ℓ_{k1} ∨ … ∨ ¬ℓ_{km}) has zero satisfying assignments (UNSAT).',
    formula: '∀x ∈ ℝ³⁰ : (a(x) ∨ ¬a(x))  ⇒  Γ ∧ ¬A₁ ∧ … ∧ ¬A_R ⊨ ⊥',
  },
  {
    id: 'part-3',
    label: '(iii) Dead-Rule Freedom (P1)',
    claim: 'No rule is dead (Γ ∧ Aₖ is satisfiable for every leaf k).',
    proof:
      'A CART decision tree is grown strictly from empirical data. Each internal split selects a threshold t lying strictly between observed feature values reaching that vertex. Consequently, no root-to-leaf path ever conjoins contradictory thresholds of the same feature (such as x ≤ 23.74 ∧ x > 33.27), ensuring Γ ∧ Aₖ always admits a satisfying assignment.',
    formula: '∃x ∈ D_train : Aₖ(x) = ⊤  ⇒  SAT(Γ ∧ Aₖ)',
  },
];

export default function OverviewSection({
  onNavigate,
  onOpenReport,
}: OverviewSectionProps) {
  const [selectedStageIdx, setSelectedStageIdx] = useState(4);
  const [selectedProofId, setSelectedProofId] = useState(THEOREM_PARTS[0].id);

  const activeStage = PIPELINE_STAGES[selectedStageIdx];
  const activeProof =
    THEOREM_PARTS.find((p) => p.id === selectedProofId) ?? THEOREM_PARTS[0];

  return (
    <div className="space-y-12">
      {/* Hero Split — Balanced 2-Column with items-stretch */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between bg-white border border-slate-200 rounded-xl p-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-slate-500">
              <span>{REPORT_METADATA.course}</span>
              <span aria-hidden="true">·</span>
              <span>{REPORT_METADATA.programme}</span>
              <span aria-hidden="true">·</span>
              <span>{REPORT_METADATA.topicNo}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-[1.15]">
              Propositional &amp; Predicate Logic-Based Rule Verification for Explainable AI
            </h1>

            <p className="text-[15px] leading-relaxed text-slate-600 max-w-2xl">
              Accuracy on a test set only summarizes sampled records—it cannot rule out
              contradictory rules or uncovered clinical regions. This interactive workbench
              formalizes CART decision trees trained on the{' '}
              <span className="font-medium text-slate-800">
                Breast Cancer Wisconsin (Diagnostic)
              </span>{' '}
              dataset (569 records, 30 features) as a logical theory{' '}
              <span className="font-mono text-slate-900">T = Γ ∪ {'{ρ₁, …, ρ_R}'}</span> and
              executes real-time SAT verification and minimal abductive explanations directly
              in your browser.
            </p>
          </div>

          <div className="pt-8 mt-8 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('rule-lab')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Launch Rule Verification Lab
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('fault-studio')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Run Fault Injection Studio
            </button>
            <button
              type="button"
              onClick={onOpenReport}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Read Original PDF
            </button>
          </div>
        </div>

        {/* Right Hero Anchor: Formal Theory Specification Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                Formal Verification Properties (T = Γ ∪ R)
              </h2>
              <span className="text-xs font-mono text-slate-500">Eq. (1)–(5)</span>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              <div className="py-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    P1 · No Dead Rules
                  </span>
                  <span className="text-xs font-mono text-emerald-700">SAT(Γ ∧ Aₖ)</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Every rule antecedent can fire on at least one valid clinical measurement.
                </p>
              </div>

              <div className="py-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    P2 · Mutual Exclusivity
                  </span>
                  <span className="text-xs font-mono text-emerald-700">
                    UNSAT(Γ ∧ Aᵢ ∧ Aⱼ)
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  At most one rule fires for any patient vector across the entire ℝ³⁰ space.
                </p>
              </div>

              <div className="py-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    P3 · Class Consistency
                  </span>
                  <span className="text-xs font-mono text-emerald-700">
                    Cᵢ ≠ Cⱼ ⇒ UNSAT
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  No two rules can ever predict both Malignant and Benign simultaneously.
                </p>
              </div>

              <div className="py-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    P4 · Completeness
                  </span>
                  <span className="text-xs font-mono text-emerald-700">
                    UNSAT(Γ ∧ ⋀ ¬Aₖ)
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Every possible input is covered with zero decision gaps (De Morgan CNF).
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Background Axioms Γ</span>
            <span className="font-mono text-slate-700">
              ⋀ᵢ (¬a_&#123;f,tᵢ&#125; ∨ a_&#123;f,tᵢ₊₁&#125;) ∈ 2-CNF
            </span>
          </div>
        </div>
      </section>

      {/* Full-Width 4-Column Quantitative Proof Strip */}
      <section
        aria-label="Key Experimental Findings"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">
            Tree Rule-Base Verification (Depth 2–8)
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              0.11–0.73
            </span>
            <span className="text-xs font-mono text-slate-500">ms</span>
          </div>
          <p className="text-xs text-slate-600 mt-1.5">
            60 / 60 random splits verified conflict-free and complete (Exp. 1 &amp; 5).
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">
            Real Conflicts Missed by Dataset Testing
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#BE123C]">
              67.1%
            </span>
            <span className="text-xs font-mono text-slate-500">at k = 6</span>
          </div>
          <p className="text-xs text-slate-600 mt-1.5">
            76.0% missed on 171 held-out records vs. 0% missed by SAT across 6,000 trials.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">
            CDCL SAT Speedup Over Truth Tables
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#1D4ED8]">
              10,312×
            </span>
            <span className="text-xs font-mono text-slate-500">at n = 24</span>
          </div>
          <p className="text-xs text-slate-600 mt-1.5">
            1.25 ms for Glucose4 vs. 12.9 s truth-table; 1.05 ms even at n = 1,000 atoms.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">
            Minimal Abductive Explanation Reduction
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#047857]">
              13–19%
            </span>
            <span className="text-xs font-mono text-slate-500">shorter</span>
          </div>
          <p className="text-xs text-slate-600 mt-1.5">
            55–57% of records simplified at depths 3–5 in under 0.30 ms per prediction.
          </p>
        </div>
      </section>

      {/* Section 01: Interactive 6-Stage Pipeline (Fig. 1) */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              01. Logic-Based Verification Pipeline
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Select any stage of the framework (Fig. 1) to inspect its formal definition and
              computational contract.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Fig. 1 · Algorithms 1, 2 &amp; 3
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-6">
          {PIPELINE_STAGES.map((stage, idx) => {
            const active = idx === selectedStageIdx;
            return (
              <button
                key={stage.step}
                type="button"
                onClick={() => setSelectedStageIdx(idx)}
                className={`text-left p-4 rounded-lg border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#EFF6FF] border-[#1D4ED8] text-slate-900'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100/80'
                }`}
              >
                <div
                  className={`text-xs font-mono font-semibold ${
                    active ? 'text-[#1D4ED8]' : 'text-slate-400'
                  }`}
                >
                  Stage {stage.step}
                </div>
                <div className="text-sm font-semibold mt-1 leading-snug">
                  {stage.title}
                </div>
                <div className="text-xs text-slate-500 mt-1">{stage.short}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 p-5 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-1.5">
            <div className="text-xs font-medium text-[#1D4ED8]">
              Stage {activeStage.step} · {activeStage.title}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {activeStage.detail}
            </p>
          </div>
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md px-4 py-3">
            <div className="text-[11px] font-medium text-slate-400 mb-1">
              Formal Representation
            </div>
            <div className="font-mono text-sm text-slate-900 overflow-x-auto">
              {activeStage.formula}
            </div>
          </div>
        </div>
      </section>

      {/* Section 02: Theorem 1 Interactive Proof + Table 1 Rules of Inference */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-900">
              <GitBranch className="w-5 h-5 text-[#1D4ED8]" />
              <h2 className="text-xl font-bold">
                02. Theorem 1: Structural Guarantees of Rooted Trees
              </h2>
            </div>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Let <span className="font-mono text-slate-800">ρ₁, …, ρ_R</span> be the rules
              extracted from the leaves of a full binary decision tree. Then the resulting
              rule base satisfies P1, P2, P3, and P4 by construction.
            </p>

            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg mt-5">
              {THEOREM_PARTS.map((part) => (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => setSelectedProofId(part.id)}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    selectedProofId === part.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {part.label.split(' ')[0]} {part.label.split(' ')[1]}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {activeProof.label}
              </h3>
              <p className="text-xs font-mono text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE] rounded-md px-3.5 py-2.5">
                {activeProof.formula}
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800">Proof sketch: </span>
                {activeProof.proof}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              SAT verification becomes critical whenever rules are edited, merged, or
              authored by clinicians outside tree structure.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('fault-studio')}
              className="text-xs font-semibold text-[#1D4ED8] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Test Fault Injection →
            </button>
          </div>
        </div>

        {/* Table 1: Rules of Inference */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col">
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#1D4ED8]" />
              <h2 className="text-xl font-bold text-slate-900">
                Table 1. Rules of Inference in Verification
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto mt-3 flex-1">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2.5 pr-3 font-medium">Rule of Inference</th>
                  <th className="py-2.5 px-3 font-medium">Formal Schema</th>
                  <th className="py-2.5 pl-3 font-medium">Role in Study</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {TABLE1_INFERENCE_RULES.map((row) => (
                  <tr key={row.name} className="hover:bg-slate-50/70">
                    <td className="py-2.5 pr-3 font-medium text-slate-900 whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-[#1D4ED8] whitespace-nowrap">
                      {row.form}
                    </td>
                    <td className="py-2.5 pl-3 text-xs text-slate-600">{row.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 03: DMGT Concepts Mapping (Table 12) + Research Team */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">
              03. Mapping of DMGT Concepts to Verification Architecture (Table 12)
            </h2>
          </div>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2.5 pr-4 font-medium">DMGT Concept</th>
                  <th className="py-2.5 px-4 font-medium">Where Applied</th>
                  <th className="py-2.5 pl-4 font-medium">Key Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {TABLE12_DMGT_MAPPING.map((item) => (
                  <tr key={item.concept} className="hover:bg-slate-50/70">
                    <td className="py-3 pr-4 font-medium text-slate-900 align-top">
                      {item.concept}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 align-top">
                      {item.whereUsed}
                    </td>
                    <td className="py-3 pl-4 text-xs text-slate-700 align-top">
                      {item.outcome}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-[#1D4ED8]" />
            <h2 className="text-lg font-bold text-slate-900">Study Authors</h2>
          </div>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            {REPORT_METADATA.institution} · {REPORT_METADATA.course}
          </p>
          <ul className="divide-y divide-slate-100 mt-4">
            {REPORT_METADATA.students.map((student, idx) => (
              <li
                key={student.usn}
                className="py-2.5 flex items-center justify-between text-sm"
              >
                <span className="font-medium text-slate-900">
                  <span className="text-xs font-mono text-slate-400 mr-2 tabular-nums">
                    0{idx + 1}.
                  </span>
                  {student.name}
                </span>
                <span className="text-xs font-mono text-slate-500 tabular-nums">
                  {student.usn}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Reproducible seed 42 · 569 clinical records</span>
            </div>
            <p className="text-xs text-slate-500">
              Every verification query in this application executes live SAT solving
              (Algorithms 1–3) over the report&apos;s exact Depth-3 and Depth-5 theories.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
