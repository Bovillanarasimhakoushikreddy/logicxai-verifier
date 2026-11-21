import type { Atom, ClassLabel, Rule } from '../engine/satSolver';

/**
 * Authentic data extracted directly from the DMGT Experiential Learning Report:
 * "Propositional and Predicate Logic-Based Rule Verification for Explainable AI Systems:
 *  A SAT-Driven Study on Decision-Tree Rule Bases"
 */

export const REPORT_METADATA = {
  title:
    'Propositional and Predicate Logic-Based Rule Verification for Explainable AI Systems',
  subtitle: 'A SAT-Driven Study on Decision-Tree Rule Bases',
  course: 'Discrete Mathematics and Graph Theory (25BSMA10)',
  programme: 'CSE — Artificial Intelligence and Machine Learning (AIML)',
  institution: 'JAIN (Deemed-to-be University)',
  topicNo: 'Topic No. 15',
  dataset: 'Breast Cancer Wisconsin (Diagnostic) — 569 records, 30 numeric features',
  split: '398 training (148 Malignant, 250 Benign) / 171 held-out test (seed 42)',
  pdfPath: '/assets/aistudio/DMGT_EXP_Rep_0c19179d.pdf',
  students: [
    { name: 'K Rajeswara Reddy', usn: '25BTRCL125' },
    { name: 'Kiraneswar', usn: '25BTRCL123' },
    { name: 'Koushik D', usn: '25BTRCL065' },
    { name: 'Kiran Elisetty', usn: '25BTRCL069' },
    { name: 'Koushik B N', usn: '25BTRCL038' },
    { name: 'G Surya', usn: '25BTRCL080' },
  ],
};

// ============================================================================
// WORKED EXAMPLE: DEPTH-3 RULE BASE (Section 3.1, Fig. 3, Table 3)
// ============================================================================

export const DEPTH3_ATOMS: Atom[] = [
  {
    id: 1,
    symbol: 'a₁',
    feature: 'worst radius',
    threshold: 16.795,
    unit: 'µm',
    min: 7.9,
    max: 36.0,
    step: 0.05,
  },
  {
    id: 2,
    symbol: 'a₂',
    feature: 'worst concave points',
    threshold: 0.14315,
    min: 0.0,
    max: 0.291,
    step: 0.001,
  },
  {
    id: 3,
    symbol: 'a₃',
    feature: 'smoothness error',
    threshold: 0.003294,
    min: 0.0015,
    max: 0.025,
    step: 0.0001,
  },
  {
    id: 4,
    symbol: 'a₄',
    feature: 'worst texture',
    threshold: 23.74,
    min: 12.0,
    max: 49.5,
    step: 0.1,
  },
  {
    id: 5,
    symbol: 'a₅',
    feature: 'texture error',
    threshold: 0.45455,
    min: 0.36,
    max: 3.5,
    step: 0.01,
  },
  {
    id: 6,
    symbol: 'a₆',
    feature: 'worst concavity',
    threshold: 0.1907,
    min: 0.0,
    max: 1.25,
    step: 0.005,
  },
];

export const DEPTH3_RULES: Rule[] = [
  {
    id: 'ρ₁',
    index: 0,
    literals: [1, 2, 3],
    cls: 'Ben',
    trainCovered: 3,
    trainBreakdown: [1, 2],
  },
  {
    id: 'ρ₂',
    index: 1,
    literals: [1, 2, -3],
    cls: 'Ben',
    trainCovered: 238,
    trainBreakdown: [3, 235],
  },
  {
    id: 'ρ₃',
    index: 2,
    literals: [1, -2, 4],
    cls: 'Ben',
    trainCovered: 7,
    trainBreakdown: [1, 6],
  },
  {
    id: 'ρ₄',
    index: 3,
    literals: [1, -2, -4],
    cls: 'Mal',
    trainCovered: 19,
    trainBreakdown: [18, 1],
  },
  {
    id: 'ρ₅',
    index: 4,
    literals: [-1, 5],
    cls: 'Ben',
    trainCovered: 3,
    trainBreakdown: [0, 3],
  },
  {
    id: 'ρ₆',
    index: 5,
    literals: [-1, -5, 6],
    cls: 'Ben',
    trainCovered: 5,
    trainBreakdown: [2, 3],
  },
  {
    id: 'ρ₇',
    index: 6,
    literals: [-1, -5, -6],
    cls: 'Mal',
    trainCovered: 123,
    trainBreakdown: [123, 0],
  },
];

export interface TreeNode {
  id: string;
  x: number;
  y: number;
  isLeaf: boolean;
  atomId?: number;
  condition?: string;
  samples: number;
  value: [number, number]; // [Mal, Ben]
  cls: ClassLabel;
  ruleId?: string;
  leftId?: string;
  rightId?: string;
}

// Exact layout matching Fig. 3 (Depth-3 CART tree on 398 training records)
export const DEPTH3_TREE_NODES: TreeNode[] = [
  {
    id: 'n0',
    x: 460,
    y: 52,
    isLeaf: false,
    atomId: 1,
    condition: 'worst radius ≤ 16.795',
    samples: 398,
    value: [148, 250],
    cls: 'Ben',
    leftId: 'n1',
    rightId: 'n2',
  },
  {
    id: 'n1',
    x: 245,
    y: 168,
    isLeaf: false,
    atomId: 2,
    condition: 'worst concave pts ≤ 0.143',
    samples: 267,
    value: [23, 244],
    cls: 'Ben',
    leftId: 'n3',
    rightId: 'n4',
  },
  {
    id: 'n2',
    x: 685,
    y: 168,
    isLeaf: false,
    atomId: 5,
    condition: 'texture error ≤ 0.455',
    samples: 131,
    value: [125, 6],
    cls: 'Mal',
    leftId: 'l5',
    rightId: 'n6',
  },
  {
    id: 'n3',
    x: 132,
    y: 288,
    isLeaf: false,
    atomId: 3,
    condition: 'smoothness err ≤ 0.0033',
    samples: 241,
    value: [4, 237],
    cls: 'Ben',
    leftId: 'l1',
    rightId: 'l2',
  },
  {
    id: 'n4',
    x: 365,
    y: 288,
    isLeaf: false,
    atomId: 4,
    condition: 'worst texture ≤ 23.74',
    samples: 26,
    value: [19, 7],
    cls: 'Mal',
    leftId: 'l3',
    rightId: 'l4',
  },
  {
    id: 'l5',
    x: 565,
    y: 288,
    isLeaf: true,
    samples: 3,
    value: [0, 3],
    cls: 'Ben',
    ruleId: 'ρ₅',
  },
  {
    id: 'n6',
    x: 775,
    y: 288,
    isLeaf: false,
    atomId: 6,
    condition: 'worst concavity ≤ 0.191',
    samples: 128,
    value: [125, 3],
    cls: 'Mal',
    leftId: 'l6',
    rightId: 'l7',
  },
  {
    id: 'l1',
    x: 68,
    y: 408,
    isLeaf: true,
    samples: 3,
    value: [1, 2],
    cls: 'Ben',
    ruleId: 'ρ₁',
  },
  {
    id: 'l2',
    x: 196,
    y: 408,
    isLeaf: true,
    samples: 238,
    value: [3, 235],
    cls: 'Ben',
    ruleId: 'ρ₂',
  },
  {
    id: 'l3',
    x: 312,
    y: 408,
    isLeaf: true,
    samples: 7,
    value: [1, 6],
    cls: 'Ben',
    ruleId: 'ρ₃',
  },
  {
    id: 'l4',
    x: 432,
    y: 408,
    isLeaf: true,
    samples: 19,
    value: [18, 1],
    cls: 'Mal',
    ruleId: 'ρ₄',
  },
  {
    id: 'l6',
    x: 700,
    y: 408,
    isLeaf: true,
    samples: 5,
    value: [2, 3],
    cls: 'Ben',
    ruleId: 'ρ₆',
  },
  {
    id: 'l7',
    x: 842,
    y: 408,
    isLeaf: true,
    samples: 123,
    value: [123, 0],
    cls: 'Mal',
    ruleId: 'ρ₇',
  },
];

// ============================================================================
// APPENDIX B: DEPTH-5 RULE BASE (Tables B1 & B2 — 13 Atoms, 14 Rules)
// ============================================================================

export const DEPTH5_ATOMS: Atom[] = [
  { id: 1, symbol: 'a₁', feature: 'worst radius', threshold: 16.795, unit: 'µm', min: 7.9, max: 36.0, step: 0.05 },
  { id: 2, symbol: 'a₂', feature: 'worst concave points', threshold: 0.14315, min: 0.0, max: 0.291, step: 0.001 },
  { id: 3, symbol: 'a₃', feature: 'smoothness error', threshold: 0.003294, min: 0.0015, max: 0.025, step: 0.0001 },
  { id: 4, symbol: 'a₄', feature: 'worst fractal dimension', threshold: 0.0708, min: 0.055, max: 0.207, step: 0.0005 },
  { id: 5, symbol: 'a₅', feature: 'area error', threshold: 35.435, unit: 'µm²', min: 6.8, max: 180.0, step: 0.5 },
  { id: 6, symbol: 'a₆', feature: 'worst texture', threshold: 33.27, min: 12.0, max: 49.5, step: 0.1 },
  { id: 7, symbol: 'a₇', feature: 'worst compactness', threshold: 0.08237, min: 0.027, max: 1.05, step: 0.002 },
  { id: 8, symbol: 'a₈', feature: 'worst texture', threshold: 23.74, min: 12.0, max: 49.5, step: 0.1 },
  { id: 9, symbol: 'a₉', feature: 'worst area', threshold: 797.05, unit: 'µm²', min: 185, max: 2500, step: 5 },
  { id: 10, symbol: 'a₁₀', feature: 'mean fractal dimension', threshold: 0.06088, min: 0.049, max: 0.097, step: 0.0005 },
  { id: 11, symbol: 'a₁₁', feature: 'texture error', threshold: 0.45455, min: 0.36, max: 3.5, step: 0.01 },
  { id: 12, symbol: 'a₁₂', feature: 'worst concavity', threshold: 0.1907, min: 0.0, max: 1.25, step: 0.005 },
  { id: 13, symbol: 'a₁₃', feature: 'worst texture', threshold: 30.975, min: 12.0, max: 49.5, step: 0.1 },
];

export const DEPTH5_RULES: Rule[] = [
  { id: 'ρ₁', index: 0, literals: [1, 2, 3, 4], cls: 'Ben' },
  { id: 'ρ₂', index: 1, literals: [1, 2, 3, -4], cls: 'Mal' },
  { id: 'ρ₃', index: 2, literals: [1, 2, -3, 5, 6], cls: 'Ben' },
  { id: 'ρ₄', index: 3, literals: [1, 2, -3, 5, -6], cls: 'Ben' },
  { id: 'ρ₅', index: 4, literals: [1, 2, -3, -5, 7], cls: 'Mal' },
  { id: 'ρ₆', index: 5, literals: [1, 2, -3, -5, -7], cls: 'Ben' },
  { id: 'ρ₇', index: 6, literals: [1, -2, 8, 9], cls: 'Ben' },
  { id: 'ρ₈', index: 7, literals: [1, -2, 8, -9], cls: 'Mal' },
  { id: 'ρ₉', index: 8, literals: [1, -2, -8, 10], cls: 'Ben' },
  { id: 'ρ₁₀', index: 9, literals: [1, -2, -8, -10], cls: 'Mal' },
  { id: 'ρ₁₁', index: 10, literals: [-1, 11], cls: 'Ben' },
  { id: 'ρ₁₂', index: 11, literals: [-1, -11, 12, 13], cls: 'Ben' },
  { id: 'ρ₁₃', index: 12, literals: [-1, -11, 12, -13], cls: 'Mal' },
  { id: 'ρ₁₄', index: 13, literals: [-1, -11, -12], cls: 'Mal' },
];

// ============================================================================
// CURATED CLINICAL PATIENT CASES (Breast Cancer Wisconsin Feature Profiles)
// ============================================================================

export interface PatientCase {
  id: string;
  label: string;
  summary: string;
  trueLabel: ClassLabel;
  values: Record<string, number>;
}

export const PATIENT_CASES: PatientCase[] = [
  {
    id: 'case-1',
    label: 'Case A — Typical Benign (Sibling Merge)',
    summary:
      'Small worst radius (12.8 µm) and low concave points (0.068). In Depth 3, smoothness error (a₃) is proven redundant via resolution merge ρ₁ ∨ ρ₂.',
    trueLabel: 'Ben',
    values: {
      'worst radius': 12.8,
      'worst concave points': 0.068,
      'smoothness error': 0.0064,
      'worst fractal dimension': 0.075,
      'area error': 18.5,
      'worst texture': 21.4,
      'worst compactness': 0.142,
      'worst area': 502.0,
      'mean fractal dimension': 0.062,
      'texture error': 0.92,
      'worst concavity': 0.115,
    },
  },
  {
    id: 'case-2',
    label: 'Case B — High-Risk Invasive Malignant',
    summary:
      'Elevated worst radius (22.4 µm), high texture error (1.18), and steep worst concavity (0.485). Fires ρ₇ (Depth 3) / ρ₁₄ (Depth 5) with compact proof.',
    trueLabel: 'Mal',
    values: {
      'worst radius': 22.4,
      'worst concave points': 0.215,
      'smoothness error': 0.0059,
      'worst fractal dimension': 0.088,
      'area error': 86.0,
      'worst texture': 29.8,
      'worst compactness': 0.34,
      'worst area': 1490.0,
      'mean fractal dimension': 0.065,
      'texture error': 1.18,
      'worst concavity': 0.485,
    },
  },
  {
    id: 'case-3',
    label: 'Case C — Boundary Tumour (Texture Decisive)',
    summary:
      'Moderate radius (15.6 µm) with elevated concave points (0.168) and high worst texture (28.9). Demonstrates how a single threshold flip switches Benign to Malignant.',
    trueLabel: 'Mal',
    values: {
      'worst radius': 15.6,
      'worst concave points': 0.168,
      'smoothness error': 0.0072,
      'worst fractal dimension': 0.082,
      'area error': 42.0,
      'worst texture': 28.9,
      'worst compactness': 0.24,
      'worst area': 835.0,
      'mean fractal dimension': 0.066,
      'texture error': 1.05,
      'worst concavity': 0.31,
    },
  },
  {
    id: 'case-4',
    label: 'Case D — Low Texture-Error Exception',
    summary:
      'Large worst radius (17.8 µm) yet unusually low texture error (0.41 ≤ 0.45455). Fires short 2-literal rule ρ₅ (Depth 3) / ρ₁₁ (Depth 5).',
    trueLabel: 'Ben',
    values: {
      'worst radius': 17.8,
      'worst concave points': 0.095,
      'smoothness error': 0.0051,
      'worst fractal dimension': 0.068,
      'area error': 28.0,
      'worst texture': 19.2,
      'worst compactness': 0.12,
      'worst area': 690.0,
      'mean fractal dimension': 0.058,
      'texture error': 0.41,
      'worst concavity': 0.145,
    },
  },
];

// ============================================================================
// SYNTHETIC 569-RECORD CALIBRATED COHORT (Seed 42, matching Fig. 2 distributions)
// Used for live Empirical Testing vs. Formal SAT comparison in Fault Studio
// ============================================================================

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randNormal(rng: () => number, mean: number, std: number, min: number, max: number) {
  const u1 = Math.max(1e-7, rng());
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.min(max, Math.max(min, mean + z * std));
}

export interface CohortRecord {
  id: number;
  split: 'train' | 'test';
  trueClass: ClassLabel;
  values: Record<string, number>;
}

let cachedCohort: CohortRecord[] | null = null;

export function getCalibratedCohort(): CohortRecord[] {
  if (cachedCohort) return cachedCohort;
  const rng = mulberry32(42);
  const records: CohortRecord[] = [];

  // 212 Malignant (148 train, 64 test) + 357 Benign (250 train, 107 test) = 569 total
  for (let i = 0; i < 569; i++) {
    const isMal = i < 212;
    const split: 'train' | 'test' = isMal
      ? i < 148
        ? 'train'
        : 'test'
      : i - 212 < 250
      ? 'train'
      : 'test';

    const values: Record<string, number> = isMal
      ? {
          'worst radius': randNormal(rng, 21.1, 4.2, 12.8, 36.0),
          'worst concave points': randNormal(rng, 0.182, 0.046, 0.028, 0.291),
          'smoothness error': randNormal(rng, 0.0068, 0.0029, 0.0026, 0.023),
          'worst fractal dimension': randNormal(rng, 0.091, 0.021, 0.055, 0.207),
          'area error': randNormal(rng, 72.6, 48.0, 14.0, 180.0),
          'worst texture': randNormal(rng, 29.3, 5.4, 16.6, 49.5),
          'worst compactness': randNormal(rng, 0.375, 0.17, 0.051, 1.05),
          'worst area': randNormal(rng, 1422, 597, 508, 2500),
          'mean fractal dimension': randNormal(rng, 0.0626, 0.0075, 0.049, 0.097),
          'texture error': randNormal(rng, 1.21, 0.48, 0.36, 3.5),
          'worst concavity': randNormal(rng, 0.451, 0.18, 0.023, 1.25),
        }
      : {
          'worst radius': randNormal(rng, 13.38, 1.98, 7.9, 19.8),
          'worst concave points': randNormal(rng, 0.074, 0.036, 0.0, 0.175),
          'smoothness error': randNormal(rng, 0.0072, 0.0031, 0.0017, 0.021),
          'worst fractal dimension': randNormal(rng, 0.079, 0.014, 0.055, 0.148),
          'area error': randNormal(rng, 21.1, 8.8, 6.8, 77.0),
          'worst texture': randNormal(rng, 23.5, 5.5, 12.0, 41.8),
          'worst compactness': randNormal(rng, 0.182, 0.092, 0.027, 0.58),
          'worst area': randNormal(rng, 558.9, 163.6, 185, 1210),
          'mean fractal dimension': randNormal(rng, 0.0628, 0.0067, 0.051, 0.095),
          'texture error': randNormal(rng, 1.22, 0.58, 0.36, 3.5),
          'worst concavity': randNormal(rng, 0.166, 0.14, 0.0, 0.72),
        };

    records.push({
      id: i + 1,
      split,
      trueClass: isMal ? 'Mal' : 'Ben',
      values,
    });
  }

  cachedCohort = records;
  return records;
}

// ============================================================================
// REPORT TABLES (EXACT QUANTITATIVE RESULTS FROM SECTION 2 & SECTION 3)
// ============================================================================

export const TABLE1_INFERENCE_RULES = [
  {
    name: 'Modus ponens',
    form: 'p, p → q  ∴  q',
    role: 'A fired rule yields its class label',
  },
  {
    name: 'Modus tollens',
    form: 'p → q, ¬q  ∴  ¬p',
    role: 'Explains why an opposite-class rule did not fire',
  },
  {
    name: 'Hypothetical syllogism',
    form: 'p → q, q → r  ∴  p → r',
    role: 'Chains threshold-ordering axioms across a feature',
  },
  {
    name: 'Disjunctive syllogism',
    form: 'p ∨ q, ¬p  ∴  q',
    role: 'Selects the one remaining active rule',
  },
  {
    name: 'Resolution',
    form: 'p ∨ r, ¬p ∨ s  ∴  r ∨ s',
    role: 'Core deduction step of CDCL SAT solving & sibling rule merging',
  },
  {
    name: 'Universal instantiation',
    form: '∀x P(x)  ∴  P(c)',
    role: 'Applies a quantified decision rule to a concrete patient record c',
  },
  {
    name: 'Existential generalisation',
    form: 'P(c)  ∴  ∃x P(x)',
    role: 'A single counter-example record refutes a universal rule claim',
  },
];

// Table 5: Experiment 1 — Verification of extracted rule bases (Depth 2–8)
export const EXPERIMENT1_DATA = [
  { depth: 2, rules: 4, atoms: 3, meanLen: 2.0, trainAcc: 96.5, testAcc: 91.8, pure: '1/4', pairs: 6, deadOverlapConflict: '0 / 0 / 0', complete: true, timeMs: 0.11 },
  { depth: 3, rules: 7, atoms: 6, meanLen: 2.86, trainAcc: 98.0, testAcc: 92.4, pure: '2/7', pairs: 21, deadOverlapConflict: '0 / 0 / 0', complete: true, timeMs: 0.16 },
  { depth: 4, rules: 12, atoms: 11, meanLen: 3.75, trainAcc: 99.2, testAcc: 92.4, pure: '10/12', pairs: 66, deadOverlapConflict: '0 / 0 / 0', complete: true, timeMs: 0.38 },
  { depth: 5, rules: 14, atoms: 13, meanLen: 4.07, trainAcc: 99.5, testAcc: 93.0, pure: '12/14', pairs: 91, deadOverlapConflict: '0 / 0 / 0', complete: true, timeMs: 0.51 },
  { depth: 6, rules: 16, atoms: 15, meanLen: 4.44, trainAcc: 100.0, testAcc: 91.8, pure: '16/16', pairs: 120, deadOverlapConflict: '0 / 0 / 0', complete: true, timeMs: 0.73 },
  { depth: 7, rules: 16, atoms: 15, meanLen: 4.44, trainAcc: 100.0, testAcc: 91.8, pure: '16/16', pairs: 120, deadOverlapConflict: '0 / 0 / 0', complete: true, timeMs: 0.44 },
  { depth: 8, rules: 16, atoms: 15, meanLen: 4.44, trainAcc: 100.0, testAcc: 91.8, pure: '16/16', pairs: 120, deadOverlapConflict: '0 / 0 / 0', complete: true, timeMs: 0.45 },
];

// Table 6: Experiment 2 — Fault injection (1,000 trials per k = 1..6)
export const EXPERIMENT2_DATA = [
  { k: 1, dead: 0, live: 1000, satConflicts: 1000, satPct: 100.0, witnessed569: 977, witnessed569Pct: 97.7, witnessed171: 977, witnessed171Pct: 97.7, missed569Pct: 2.3, missed171Pct: 2.3 },
  { k: 2, dead: 13, live: 987, satConflicts: 986, satPct: 99.9, witnessed569: 894, witnessed569Pct: 90.6, witnessed171: 847, witnessed171Pct: 85.8, missed569Pct: 9.3, missed171Pct: 14.1 },
  { k: 3, dead: 35, live: 965, satConflicts: 958, satPct: 99.3, witnessed569: 705, witnessed569Pct: 73.1, witnessed171: 636, witnessed171Pct: 65.9, missed569Pct: 26.4, missed171Pct: 33.6 },
  { k: 4, dead: 55, live: 945, satConflicts: 931, satPct: 98.5, witnessed569: 572, witnessed569Pct: 60.5, witnessed171: 460, witnessed171Pct: 48.7, missed569Pct: 38.6, missed171Pct: 50.6 },
  { k: 5, dead: 92, live: 908, satConflicts: 877, satPct: 96.6, witnessed569: 433, witnessed569Pct: 47.7, witnessed171: 330, witnessed171Pct: 36.3, missed569Pct: 50.6, missed171Pct: 62.4 },
  { k: 6, dead: 130, live: 870, satConflicts: 824, satPct: 94.7, witnessed569: 271, witnessed569Pct: 31.1, witnessed171: 198, witnessed171Pct: 22.8, missed569Pct: 67.1, missed171Pct: 76.0 },
];

// Table 7: Experiment 3 — Truth table vs. CDCL SAT (Glucose4) vs. SMT (Z3)
export const EXPERIMENT3_DATA = [
  { n: 8, assignments: '256', truthTableMs: 0.6, satMs: 1.0, smtMs: 102.6, speedup: '1×' },
  { n: 10, assignments: '1,024', truthTableMs: 0.7, satMs: 0.92, smtMs: 54.4, speedup: '1×' },
  { n: 12, assignments: '4,096', truthTableMs: 1.0, satMs: 0.88, smtMs: 49.5, speedup: '1×' },
  { n: 14, assignments: '16,384', truthTableMs: 2.0, satMs: 0.81, smtMs: 45.9, speedup: '3×' },
  { n: 16, assignments: '65,536', truthTableMs: 7.6, satMs: 0.88, smtMs: 52.6, speedup: '9×' },
  { n: 18, assignments: '262,144', truthTableMs: 75.3, satMs: 0.94, smtMs: 48.2, speedup: '80×' },
  { n: 20, assignments: '1,048,576', truthTableMs: 413.5, satMs: 0.93, smtMs: 50.8, speedup: '443×' },
  { n: 22, assignments: '4,194,304', truthTableMs: 2382.1, satMs: 0.93, smtMs: 50.7, speedup: '2,563×' },
  { n: 24, assignments: '16,777,216', truthTableMs: 12854.3, satMs: 1.25, smtMs: 52.4, speedup: '10,312×' },
  { n: 50, assignments: '2⁵⁰ (infeasible)', truthTableMs: null, satMs: 0.88, smtMs: 53.2, speedup: '—' },
  { n: 100, assignments: '2¹⁰⁰ (infeasible)', truthTableMs: null, satMs: 0.95, smtMs: 53.6, speedup: '—' },
  { n: 200, assignments: '2²⁰⁰ (infeasible)', truthTableMs: null, satMs: 1.0, smtMs: 50.2, speedup: '—' },
  { n: 500, assignments: '2⁵⁰⁰ (infeasible)', truthTableMs: null, satMs: 0.96, smtMs: 55.5, speedup: '—' },
  { n: 1000, assignments: '2¹⁰⁰⁰ (infeasible)', truthTableMs: null, satMs: 1.05, smtMs: 68.2, speedup: '—' },
];

// Table 8: Experiment 4 — Explanation compactness (100 sampled records)
export const EXPERIMENT4_DATA = [
  { depth: 3, rules: 7, fullState: 6, firedRule: 2.99, minimalExp: 2.42, reductionPct: 19.1, shortenedPct: 57, timeMs: 0.05 },
  { depth: 4, rules: 12, fullState: 11, firedRule: 3.63, minimalExp: 3.08, reductionPct: 15.2, shortenedPct: 55, timeMs: 0.15 },
  { depth: 5, rules: 14, fullState: 13, firedRule: 4.18, minimalExp: 3.63, reductionPct: 13.2, shortenedPct: 55, timeMs: 0.22 },
  { depth: 6, rules: 16, fullState: 15, firedRule: 4.29, minimalExp: 4.21, reductionPct: 1.9, shortenedPct: 8, timeMs: 0.3 },
];

// Table 9: Experiment 5 — Robustness over 30 random stratified splits
export const EXPERIMENT5_DATA = [
  { depth: 3, runs: 30, allPass: '30 / 30', heldOutAcc: '92.3 ± 2.2%', rulesMeanRange: '7.7 (6–8)', verifyTimeMeanMax: '0.20 / 0.65 ms' },
  { depth: 5, runs: 30, allPass: '30 / 30', heldOutAcc: '93.2 ± 2.4%', rulesMeanRange: '14.0 (12–18)', verifyTimeMeanMax: '0.34 / 0.49 ms' },
];

// Table 10: Comparative Summary
export const TABLE10_COMPARISON = [
  { aspect: 'Covers inputs not in dataset', testing: 'No', truthTable: 'Yes (all 2ⁿ cases)', sat: 'Yes (all cases)' },
  { aspect: 'Conflicts missed at k = 6', testing: '67.1% (569 recs)', truthTable: '0%', sat: '0%' },
  { aspect: 'Runtime at n = 24 atoms', testing: '—', truthTable: '12.9 s', sat: '1.25 ms' },
  { aspect: 'Feasible at n = 1,000 atoms', testing: '—', truthTable: 'No', sat: 'Yes (1.05 ms)' },
  { aspect: 'Produces witness / counter-example', testing: 'Only if record exists', truthTable: 'Yes', sat: 'Yes (satisfying assignment)' },
  { aspect: 'Provides minimal explanations', testing: 'No', truthTable: 'Possible, very costly', sat: 'Yes (0.05–0.30 ms)' },
];

// Table 12: DMGT Concepts Mapping
export const TABLE12_DMGT_MAPPING = [
  {
    concept: 'Propositions, connectives, truth tables',
    whereUsed: 'Atoms aⱼ; Table 4; truth-table baseline checker',
    outcome: 'Equivalence can be proved exhaustively, but enumeration scales as 2ⁿ',
  },
  {
    concept: 'Logical equivalences',
    whereUsed: 'Merging ρ₁, ρ₂; De Morgan completeness refutation Eq. (4)',
    outcome: 'Identities shorten rules and yield CNF directly without Tseitin variables',
  },
  {
    concept: 'Rules of inference',
    whereUsed: 'Table 1; Modus Ponens/Tollens explanations; CDCL resolution',
    outcome: 'Modus ponens/tollens explain decisions; resolution drives automated proof',
  },
  {
    concept: 'Predicates and quantifiers',
    whereUsed: 'Rules ∀x (Aₖ(x) → Cₖ(x)); counter-examples ∃x (A ∧ ¬C)',
    outcome: 'Quantifier negation converts universal refutation into finding one witness',
  },
  {
    concept: 'Rooted binary trees',
    whereUsed: 'Decision-tree structure; Theorem 1 proof',
    outcome: 'Unique lowest common ancestors guarantee mutual exclusivity and completeness',
  },
  {
    concept: 'Counting and complexity',
    whereUsed: 'Truth-table size 2ⁿ; pairwise checks R(R−1)/2; 2-SAT',
    outcome: 'Exponential blow-up is measurable; 2-SAT pairwise checks run in linear time',
  },
];

export const PIPELINE_STAGES = [
  {
    step: '01',
    title: 'Clinical Dataset',
    short: '569 records · 30 features',
    detail:
      'Breast Cancer Wisconsin (Diagnostic) fine-needle aspirate measurements split 398 train / 171 stratified test (seed 42). 212 Malignant (37.3%) and 357 Benign (62.7%).',
    formula: 'D = {x₁, …, x₅₆₉} ⊂ ℝ³⁰,  c(x) ∈ {Mal, Ben}',
  },
  {
    step: '02',
    title: 'Decision-Tree Model M',
    short: 'CART Gini · Depth 2–8',
    detail:
      'Full binary rooted tree where each internal vertex tests one feature threshold x_f ≤ t and every leaf carries a class label. A tree with L leaves has L − 1 internal splits.',
    formula: 'Internal split: aⱼ(x) :≡ [x_f ≤ t]',
  },
  {
    step: '03',
    title: 'Rule Extraction (Alg. 1)',
    short: 'Root-to-leaf DFS paths',
    detail:
      'Depth-first traversal converts every leaf k into a conjunction of signed literals Aₖ and sorts per-feature thresholds to emit 2-CNF ordering axioms Γ.',
    formula: 'Γ = ⋀ᵢ (¬a_{f,tᵢ} ∨ a_{f,t_{i+1}})',
  },
  {
    step: '04',
    title: 'Logical Formalisation',
    short: 'PL + FOL Theory T',
    detail:
      'Each rule becomes a universally quantified implication over the domain D. Combining rules with background axioms Γ yields the formal theory T = Γ ∪ {ρ₁, …, ρ_R}.',
    formula: 'ρₖ : ∀x ∈ D (Aₖ(x) → Cₖ(x))',
  },
  {
    step: '05',
    title: 'SAT Verification (Alg. 2)',
    short: 'P1–P4 Formal Proofs',
    detail:
      'Incremental CDCL SAT queries decide dead rules (P1), mutual exclusivity (P2), class consistency (P3), and completeness via De Morgan refutation (P4) in under 1 ms.',
    formula: 'P4: Γ ∧ ⋀ₖ (¬ℓ_{k1} ∨ … ∨ ¬ℓ_{km}) ⊨ ⊥',
  },
  {
    step: '06',
    title: 'Minimal Explanations (Alg. 3)',
    short: 'Abductive Sufficient Reason',
    detail:
      'Greedy literal deletion under SAT entailment removes redundant tests (such as sibling merges) to produce a provably sufficient explanation S ⊆ α(x) in < 0.3 ms.',
    formula: '∀r (Cᵣ ≠ C) : Γ ∧ ⋀S ∧ Aᵣ ⊨ ⊥',
  },
];

