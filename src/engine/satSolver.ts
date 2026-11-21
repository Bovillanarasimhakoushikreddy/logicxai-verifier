/**
 * Formal Propositional & Predicate Logic SAT Verification Engine
 * Implements Algorithms 1, 2, and 3 from:
 * "Propositional and Predicate Logic-Based Rule Verification for Explainable AI Systems"
 */

export type ClassLabel = 'Ben' | 'Mal';

export interface Atom {
  id: number; // 1-indexed propositional variable ID
  symbol: string; // e.g. "a1"
  feature: string; // e.g. "worst radius"
  threshold: number; // e.g. 16.795
  unit?: string;
  min: number;
  max: number;
  step: number;
}

export interface Rule {
  id: string; // e.g. "ρ1"
  index: number; // 0-indexed
  literals: number[]; // signed integers: +id means atom is true (x_f <= t), -id means negated (x_f > t)
  cls: ClassLabel;
  trainCovered?: number;
  trainBreakdown?: [number, number]; // [Mal, Ben]
  isInjected?: boolean;
  disabled?: boolean;
}

export interface OrderingAxiom {
  feature: string;
  fromAtom: Atom;
  toAtom: Atom;
  clause: [number, number]; // [-fromAtom.id, +toAtom.id] representing (a_i -> a_{i+1})
  formula: string;
}

export interface SatSolveResult {
  sat: boolean;
  model: Record<number, boolean>;
  decisions: number;
  unitPropagations: number;
  conflicts: number;
}

export interface ConflictWitness {
  ruleA: Rule;
  ruleB: Rule;
  sameClass: boolean;
  model: Record<number, boolean>;
  intervals: FeatureInterval[];
}

export interface FeatureInterval {
  feature: string;
  lower?: number; // strictly greater than lower (x > lower)
  upper?: number; // less than or equal to upper (x <= upper)
  formatted: string;
}

export interface VerificationReport {
  deadRules: { rule: Rule; violatedAxiom?: string }[];
  overlaps: ConflictWitness[];
  conflicts: ConflictWitness[];
  isComplete: boolean;
  gapWitness?: {
    model: Record<number, boolean>;
    intervals: FeatureInterval[];
  };
  pairsChecked: number;
  totalQueries: number;
  elapsedMs: number;
  axiomsCount: number;
  activeRuleCount: number;
}

export interface DeletionStep {
  literal: number;
  atom: Atom;
  isPositive: boolean;
  wasInFiredRule: boolean;
  dropped: boolean;
  reason: string;
  counterRuleId?: string;
}

export interface ExplanationResult {
  stateLiterals: number[];
  firedRules: Rule[];
  predictedClass: ClassLabel | null;
  minimalLiterals: number[];
  reductionPct: number;
  steps: DeletionStep[];
  modusTollens: {
    oppositeClass: ClassLabel;
    refutedRules: {
      ruleId: string;
      falsifiedLiterals: number[];
    }[];
  }[];
  elapsedMs: number;
}

/**
 * Generates background threshold-ordering axioms Gamma (Eq. 3):
 * For every feature f with sorted thresholds t_1 < ... < t_q:
 *   a_{f,t_i} -> a_{f,t_{i+1}}  ===  (!a_{f,t_i} v a_{f,t_{i+1}})
 */
export function buildOrderingAxioms(atoms: Atom[]): OrderingAxiom[] {
  const byFeature = new Map<string, Atom[]>();
  for (const atom of atoms) {
    const list = byFeature.get(atom.feature) ?? [];
    list.push(atom);
    byFeature.set(atom.feature, list);
  }

  const axioms: OrderingAxiom[] = [];
  for (const [feature, list] of byFeature.entries()) {
    const sorted = [...list].sort((a, b) => a.threshold - b.threshold);
    for (let i = 0; i < sorted.length - 1; i++) {
      const a1 = sorted[i];
      const a2 = sorted[i + 1];
      axioms.push({
        feature,
        fromAtom: a1,
        toAtom: a2,
        clause: [-a1.id, a2.id],
        formula: `(${a1.symbol} → ${a2.symbol})  ≡  (¬${a1.symbol} ∨ ${a2.symbol})`,
      });
    }
  }
  return axioms;
}

/**
 * Compact DPLL SAT Solver with Unit Propagation and Assumption-Based Queries.
 * Handles CNF formulas over 1-indexed variables (positive literal = +v, negative = -v).
 */
export class SatSolver {
  private baseClauses: number[][];
  private maxVar: number;

  constructor(clauses: number[][] = [], numVars = 0) {
    this.baseClauses = clauses.map((c) => [...c]);
    this.maxVar = numVars;
    for (const c of clauses) {
      for (const lit of c) {
        const v = Math.abs(lit);
        if (v > this.maxVar) this.maxVar = v;
      }
    }
  }

  addClause(clause: number[]): void {
    this.baseClauses.push([...clause]);
    for (const lit of clause) {
      const v = Math.abs(lit);
      if (v > this.maxVar) this.maxVar = v;
    }
  }

  solve(assumptions: number[] = []): SatSolveResult {
    const clauses: number[][] = [
      ...this.baseClauses,
      ...assumptions.map((lit) => [lit]),
    ];

    let maxV = this.maxVar;
    for (const lit of assumptions) {
      const v = Math.abs(lit);
      if (v > maxV) maxV = v;
    }

    const assignment = new Int8Array(maxV + 1); // 0 = unassigned, 1 = true, -1 = false
    const stats = { decisions: 0, unitPropagations: 0, conflicts: 0 };

    const dpll = (assign: Int8Array): boolean => {
      // Iterative unit propagation
      const localAssign = new Int8Array(assign);
      let changed = true;

      while (changed) {
        changed = false;
        for (let i = 0; i < clauses.length; i++) {
          const clause = clauses[i];
          let satisfied = false;
          let unassignedCount = 0;
          let lastUnassignedLit = 0;

          for (let j = 0; j < clause.length; j++) {
            const lit = clause[j];
            const v = Math.abs(lit);
            const val = localAssign[v];
            if (val === 0) {
              unassignedCount++;
              lastUnassignedLit = lit;
            } else if ((lit > 0 && val === 1) || (lit < 0 && val === -1)) {
              satisfied = true;
              break;
            }
          }

          if (!satisfied) {
            if (unassignedCount === 0) {
              stats.conflicts++;
              return false; // Conflict!
            }
            if (unassignedCount === 1) {
              const v = Math.abs(lastUnassignedLit);
              localAssign[v] = lastUnassignedLit > 0 ? 1 : -1;
              stats.unitPropagations++;
              changed = true;
            }
          }
        }
      }

      // Pick first unassigned variable occurring in an unsatisfied clause (shortest clause preference)
      let bestVar = 0;
      let bestClauseLen = Infinity;

      for (let i = 0; i < clauses.length; i++) {
        const clause = clauses[i];
        let satisfied = false;
        let firstUnassigned = 0;
        let unassignedCount = 0;
        for (let j = 0; j < clause.length; j++) {
          const lit = clause[j];
          const v = Math.abs(lit);
          const val = localAssign[v];
          if ((lit > 0 && val === 1) || (lit < 0 && val === -1)) {
            satisfied = true;
            break;
          }
          if (val === 0) {
            if (firstUnassigned === 0) firstUnassigned = v;
            unassignedCount++;
          }
        }
        if (!satisfied && unassignedCount > 0 && unassignedCount < bestClauseLen) {
          bestClauseLen = unassignedCount;
          bestVar = firstUnassigned;
        }
      }

      if (bestVar === 0) {
        // All clauses satisfied! Copy final model back
        assign.set(localAssign);
        return true;
      }

      stats.decisions++;

      // Branch True
      const tryTrue = new Int8Array(localAssign);
      tryTrue[bestVar] = 1;
      if (dpll(tryTrue)) {
        assign.set(tryTrue);
        return true;
      }

      // Branch False
      const tryFalse = new Int8Array(localAssign);
      tryFalse[bestVar] = -1;
      if (dpll(tryFalse)) {
        assign.set(tryFalse);
        return true;
      }

      return false;
    };

    const sat = dpll(assignment);
    const model: Record<number, boolean> = {};
    if (sat) {
      for (let v = 1; v <= maxV; v++) {
        model[v] = assignment[v] === -1 ? false : true;
      }
    }

    return {
      sat,
      model,
      ...stats,
    };
  }
}

/**
 * Translates a SAT satisfying assignment (model) or literal list into
 * clean, tight, human-readable feature intervals under Gamma.
 */
export function modelToFeatureIntervals(
  modelOrLits: Record<number, boolean> | number[],
  atoms: Atom[],
  onlyRelevantIds?: Set<number>
): FeatureInterval[] {
  const atomMap = new Map(atoms.map((a) => [a.id, a]));
  const bounds = new Map<string, { lower?: number; upper?: number }>();

  const applyLit = (id: number, isTrue: boolean) => {
    if (onlyRelevantIds && !onlyRelevantIds.has(id)) return;
    const atom = atomMap.get(id);
    if (!atom) return;
    const cur = bounds.get(atom.feature) ?? {};
    if (isTrue) {
      // x <= threshold
      if (cur.upper === undefined || atom.threshold < cur.upper) {
        cur.upper = atom.threshold;
      }
    } else {
      // x > threshold
      if (cur.lower === undefined || atom.threshold > cur.lower) {
        cur.lower = atom.threshold;
      }
    }
    bounds.set(atom.feature, cur);
  };

  if (Array.isArray(modelOrLits)) {
    for (const lit of modelOrLits) {
      applyLit(Math.abs(lit), lit > 0);
    }
  } else {
    for (const [k, val] of Object.entries(modelOrLits)) {
      applyLit(Number(k), val);
    }
  }

  const intervals: FeatureInterval[] = [];
  for (const [feature, { lower, upper }] of bounds.entries()) {
    let formatted = '';
    if (lower !== undefined && upper !== undefined) {
      formatted = `${lower} < ${feature} ≤ ${upper}`;
    } else if (upper !== undefined) {
      formatted = `${feature} ≤ ${upper}`;
    } else if (lower !== undefined) {
      formatted = `${feature} > ${lower}`;
    }
    intervals.push({ feature, lower, upper, formatted });
  }
  return intervals;
}

/**
 * Format a literal like +1 -> "a1", -3 -> "¬a3"
 */
export function formatLiteralSymbol(lit: number, atoms: Atom[]): string {
  const id = Math.abs(lit);
  const atom = atoms.find((a) => a.id === id);
  const sym = atom ? atom.symbol : `a${id}`;
  return lit > 0 ? sym : `¬${sym}`;
}

export function formatLiteralInequality(lit: number, atoms: Atom[]): string {
  const id = Math.abs(lit);
  const atom = atoms.find((a) => a.id === id);
  if (!atom) return lit > 0 ? `a${id}` : `¬a${id}`;
  return lit > 0
    ? `${atom.feature} ≤ ${atom.threshold}`
    : `${atom.feature} > ${atom.threshold}`;
}

export function formatRuleAntecedent(literals: number[], atoms: Atom[]): string {
  if (literals.length === 0) return '⊤';
  return literals.map((l) => formatLiteralSymbol(l, atoms)).join(' ∧ ');
}

/**
 * Algorithm 2 — Formal Verification of P1, P2, P3, and P4 using incremental SAT.
 */
export function verifyRuleBase(rules: Rule[], atoms: Atom[]): VerificationReport {
  const t0 = performance.now();
  const activeRules = rules.filter((r) => !r.disabled);
  const axioms = buildOrderingAxioms(atoms);
  const axiomClauses = axioms.map((a) => a.clause);

  const solver = new SatSolver(axiomClauses, atoms.length);
  let totalQueries = 0;

  // P1: No dead rule — check Gamma ^ A_k is SAT
  const deadRules: { rule: Rule; violatedAxiom?: string }[] = [];
  const liveSet = new Set<string>();

  for (const rule of activeRules) {
    totalQueries++;
    const res = solver.solve(rule.literals);
    if (!res.sat) {
      // Find why it is dead (direct contradiction or ordering axiom clash)
      let reason = 'Self-contradictory literal pair (a ∧ ¬a)';
      const litSet = new Set(rule.literals);
      let directClash = false;
      for (const l of rule.literals) {
        if (litSet.has(-l)) {
          const atom = atoms.find((a) => a.id === Math.abs(l));
          reason = `Direct contradiction: ${atom?.symbol ?? `a${Math.abs(l)}`} ∧ ¬${atom?.symbol ?? `a${Math.abs(l)}`}`;
          directClash = true;
          break;
        }
      }
      if (!directClash) {
        // Check ordering axioms
        for (const ax of axioms) {
          // If A_k asserts a_i and !a_j for thresholds t_i < t_j
          const featureAtoms = atoms
            .filter((a) => a.feature === ax.feature)
            .sort((a, b) => a.threshold - b.threshold);
          for (let i = 0; i < featureAtoms.length; i++) {
            for (let j = i + 1; j < featureAtoms.length; j++) {
              if (litSet.has(featureAtoms[i].id) && litSet.has(-featureAtoms[j].id)) {
                reason = `Violates ordering axiom Γ: [${featureAtoms[i].feature} ≤ ${featureAtoms[i].threshold}] ∧ [${featureAtoms[j].feature} > ${featureAtoms[j].threshold}]`;
              }
            }
          }
        }
      }
      deadRules.push({ rule, violatedAxiom: reason });
    } else {
      liveSet.add(rule.id);
    }
  }

  // P2 (Mutual exclusivity) & P3 (Class consistency)
  const overlaps: ConflictWitness[] = [];
  const conflicts: ConflictWitness[] = [];
  let pairsChecked = 0;

  for (let i = 0; i < activeRules.length; i++) {
    for (let j = i + 1; j < activeRules.length; j++) {
      pairsChecked++;
      const rA = activeRules[i];
      const rB = activeRules[j];
      if (!liveSet.has(rA.id) || !liveSet.has(rB.id)) continue;

      totalQueries++;
      const res = solver.solve([...rA.literals, ...rB.literals]);
      if (res.sat) {
        const relevantVars = new Set<number>([
          ...rA.literals.map((l) => Math.abs(l)),
          ...rB.literals.map((l) => Math.abs(l)),
        ]);
        const witness: ConflictWitness = {
          ruleA: rA,
          ruleB: rB,
          sameClass: rA.cls === rB.cls,
          model: res.model,
          intervals: modelToFeatureIntervals(res.model, atoms, relevantVars),
        };
        overlaps.push(witness);
        if (rA.cls !== rB.cls) {
          conflicts.push(witness);
        }
      }
    }
  }

  // P4: Completeness (Eq. 4) — Gamma ^ /\_{k} ( !l_{k1} v ... v !l_{km} ) must be UNSAT
  const completenessSolver = new SatSolver(axiomClauses, atoms.length);
  for (const rule of activeRules) {
    completenessSolver.addClause(rule.literals.map((l) => -l));
  }
  totalQueries++;
  const compRes = completenessSolver.solve();
  const isComplete = !compRes.sat;
  let gapWitness: VerificationReport['gapWitness'];

  if (!isComplete) {
    gapWitness = {
      model: compRes.model,
      intervals: modelToFeatureIntervals(compRes.model, atoms),
    };
  }

  const elapsedMs = Math.max(0.01, performance.now() - t0);

  return {
    deadRules,
    overlaps,
    conflicts,
    isComplete,
    gapWitness,
    pairsChecked,
    totalQueries,
    elapsedMs,
    axiomsCount: axioms.length,
    activeRuleCount: activeRules.length,
  };
}

/**
 * Evaluate a feature-value record against all atoms to produce full literal state alpha(x).
 */
export function evaluateRecordToLiterals(
  record: Record<string, number>,
  atoms: Atom[]
): number[] {
  return atoms.map((atom) => {
    const val = record[atom.feature] ?? 0;
    return val <= atom.threshold ? atom.id : -atom.id;
  });
}

/**
 * Algorithm 3 — Minimal Abductive Explanation (Eq. 5).
 * Starting from full state alpha(x), tries dropping literals outside the fired rule first,
 * then literals inside the fired rule. A literal is dropped iff no opposite-class rule
 * becomes compatible with the remaining subset under Gamma.
 */
export function computeMinimalExplanation(
  record: Record<string, number>,
  rules: Rule[],
  atoms: Atom[]
): ExplanationResult {
  const t0 = performance.now();
  const activeRules = rules.filter((r) => !r.disabled);
  const stateLiterals = evaluateRecordToLiterals(record, atoms);
  const stateSet = new Set(stateLiterals);

  // Determine which rule(s) fire on x
  const firedRules = activeRules.filter((rule) =>
    rule.literals.every((l) => stateSet.has(l))
  );

  if (firedRules.length === 0) {
    return {
      stateLiterals,
      firedRules: [],
      predictedClass: null,
      minimalLiterals: [],
      reductionPct: 0,
      steps: [],
      modusTollens: [],
      elapsedMs: performance.now() - t0,
    };
  }

  const fired = firedRules[0];
  const predictedClass = fired.cls;
  const oppositeRules = activeRules.filter((r) => r.cls !== predictedClass);

  const axioms = buildOrderingAxioms(atoms);
  const solver = new SatSolver(
    axioms.map((a) => a.clause),
    atoms.length
  );

  let keep = [...stateLiterals];
  const inFiredVars = new Set(fired.literals.map((l) => Math.abs(l)));

  // Order: literals outside A_k first, then literals inside A_k
  const ordered = [
    ...stateLiterals.filter((l) => !inFiredVars.has(Math.abs(l))),
    ...stateLiterals.filter((l) => inFiredVars.has(Math.abs(l))),
  ];

  const steps: DeletionStep[] = [];
  const atomMap = new Map(atoms.map((a) => [a.id, a]));

  for (const lit of ordered) {
    const trial = keep.filter((q) => q !== lit);
    let compatibleOpposite: Rule | undefined;

    for (const opp of oppositeRules) {
      const res = solver.solve([...trial, ...opp.literals]);
      if (res.sat) {
        compatibleOpposite = opp;
        break;
      }
    }

    const atom = atomMap.get(Math.abs(lit))!;
    const wasInFiredRule = inFiredVars.has(Math.abs(lit));

    if (!compatibleOpposite) {
      keep = trial;
      steps.push({
        literal: lit,
        atom,
        isPositive: lit > 0,
        wasInFiredRule,
        dropped: true,
        reason: wasInFiredRule
          ? 'Redundant (sibling rule agrees on class; eliminated by resolution)'
          : 'Not required to block any opposite-class rule',
      });
    } else {
      steps.push({
        literal: lit,
        atom,
        isPositive: lit > 0,
        wasInFiredRule,
        dropped: false,
        reason: `Necessary — dropping allows opposite-class rule ${compatibleOpposite.id} (${compatibleOpposite.cls === 'Mal' ? 'Malignant' : 'Benign'}) to fire`,
        counterRuleId: compatibleOpposite.id,
      });
    }
  }

  const reductionPct =
    fired.literals.length > 0
      ? ((fired.literals.length - keep.length) / fired.literals.length) * 100
      : 0;

  // Modus Tollens explanation: why didn't opposite-class rules fire?
  const oppositeCls: ClassLabel = predictedClass === 'Ben' ? 'Mal' : 'Ben';
  const refutedRules = oppositeRules.map((opp) => ({
    ruleId: opp.id,
    falsifiedLiterals: opp.literals.filter((l) => !stateSet.has(l)),
  }));

  return {
    stateLiterals,
    firedRules,
    predictedClass,
    minimalLiterals: keep,
    reductionPct,
    steps,
    modusTollens: [
      {
        oppositeClass: oppositeCls,
        refutedRules,
      },
    ],
    elapsedMs: Math.max(0.01, performance.now() - t0),
  };
}

/**
 * Live Truth-Table vs. SAT Race Benchmark (for Experiment 3 interactive demo).
 * Generates a conflict-free random decision structure of 16 rules over n atoms
 * and runs BOTH brute-force 2^n enumeration and our SAT solver in-browser.
 */
export function runLiveEngineRace(nAtoms: number): {
  nAtoms: number;
  assignments: number;
  truthTableMs: number;
  satMs: number;
  speedup: number;
  agreement: boolean;
  rulesTested: number;
} {
  // Build a balanced complete conflict-free rule base of depth 4 (16 rules) over the first 4 atoms,
  // while nAtoms represents the total atom universe checked by truth-table enumeration (2^n).
  const depth = Math.min(4, nAtoms);
  const rules: { literals: number[]; cls: ClassLabel }[] = [];
  const totalRules = 1 << depth;
  for (let mask = 0; mask < totalRules; mask++) {
    const lits: number[] = [];
    for (let bit = 0; bit < depth; bit++) {
      const atomId = bit + 1;
      lits.push(((mask >> bit) & 1) === 1 ? atomId : -atomId);
    }
    rules.push({ literals: lits, cls: mask % 2 === 0 ? 'Ben' : 'Mal' });
  }

  // 1. Brute-force Truth Table enumeration over all 2^n assignments
  const assignments = 1 << nAtoms;
  const ttStart = performance.now();
  let ttConflict = false;
  for (let assign = 0; assign < assignments; assign++) {
    let seenBen = false;
    let seenMal = false;
    for (let r = 0; r < rules.length; r++) {
      const rule = rules[r];
      let fires = true;
      for (let k = 0; k < rule.literals.length; k++) {
        const lit = rule.literals[k];
        const bitVal = ((assign >> (Math.abs(lit) - 1)) & 1) === 1;
        if ((lit > 0 && !bitVal) || (lit < 0 && bitVal)) {
          fires = false;
          break;
        }
      }
      if (fires) {
        if (rule.cls === 'Ben') seenBen = true;
        else seenMal = true;
      }
    }
    if (seenBen && seenMal) {
      ttConflict = true;
    }
  }
  const truthTableMs = Math.max(0.02, performance.now() - ttStart);

  // 2. SAT solver pairwise consistency check
  const satStart = performance.now();
  const solver = new SatSolver([], nAtoms);
  let satConflict = false;
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      if (rules[i].cls !== rules[j].cls) {
        const res = solver.solve([...rules[i].literals, ...rules[j].literals]);
        if (res.sat) satConflict = true;
      }
    }
  }
  const satMs = Math.max(0.02, performance.now() - satStart);

  return {
    nAtoms,
    assignments,
    truthTableMs,
    satMs,
    speedup: truthTableMs / satMs,
    agreement: ttConflict === satConflict,
    rulesTested: rules.length,
  };
}
