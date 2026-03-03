import type { EquationStep, Operation } from './types';

// ── Number pools (authentic Countdown) ──────────────────────────────────────

const LARGE_NUMBERS = [25, 50, 75, 100];
// Small: two each of 1–10
const SMALL_NUMBERS = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rng = seededRandom(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generate 6 numbers for a round.
 * largeCount: 0-4, how many large numbers (25/50/75/100) to include.
 * The rest come from small (1-10, two of each).
 */
export function generateNumbers(largeCount: number, seed?: number): number[] {
  const lc = Math.max(0, Math.min(4, largeCount));
  const sc = 6 - lc;

  let large = [...LARGE_NUMBERS];
  let small = [...SMALL_NUMBERS];

  if (seed !== undefined) {
    large = seededShuffle(large, seed);
    small = seededShuffle(small, seed + 77);
  } else {
    large = seededShuffle(large, Date.now());
    small = seededShuffle(small, Date.now() + 77);
  }

  return [...large.slice(0, lc), ...small.slice(0, sc)];
}

/**
 * Generate a random 3-digit target (100-999).
 */
export function generateTarget(seed?: number): number {
  if (seed !== undefined) {
    const rng = seededRandom(seed + 999);
    return Math.floor(rng() * 900) + 100;
  }
  return Math.floor(Math.random() * 900) + 100;
}

// ── Numbers solver ───────────────────────────────────────────────────────────

export interface SolverResult {
  exact: boolean;
  closest: number;
  diff: number;
  steps: EquationStep[];
}

const OPS: Operation[] = ['+', '-', '×', '÷'];

function applyOp(a: number, op: Operation, b: number): number | null {
  switch (op) {
    case '+': return a + b;
    case '-': {
      const r = a - b;
      return r > 0 ? r : null; // no negatives/zero
    }
    case '×': return a * b;
    case '÷': {
      if (b === 0 || a % b !== 0) return null; // integer only
      return a / b;
    }
  }
}

interface SolveState {
  nums: number[];
  steps: EquationStep[];
}

let bestResult: SolverResult | null = null;

function solve(state: SolveState, target: number): void {
  const { nums, steps } = state;

  // Check all current numbers as potential solution
  for (const n of nums) {
    const diff = Math.abs(n - target);
    if (!bestResult || diff < bestResult.diff) {
      bestResult = { exact: diff === 0, closest: n, diff, steps: [...steps] };
    }
    if (bestResult.exact) return;
  }

  if (nums.length < 2) return;

  // Try every pair, every operation
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length; j++) {
      if (i === j) continue;
      const a = nums[i];
      const b = nums[j];

      // Skip commutative duplicates: only process (i,j) where i < j for + and ×
      if ((OPS[0] === '+' || OPS[2] === '×') && i > j) {
        // we still try all ops explicitly below
      }

      for (const op of OPS) {
        // Avoid duplicate commutative cases
        if ((op === '+' || op === '×') && i > j) continue;

        const result = applyOp(a, op, b);
        if (result === null || result <= 0) continue;

        const newNums = nums.filter((_, idx) => idx !== i && idx !== j);
        newNums.push(result);

        const newSteps: EquationStep[] = [...steps, { left: a, right: b, op, result }];
        solve({ nums: newNums, steps: newSteps }, target);

        if (bestResult?.exact) return;
      }
    }
  }
}

/**
 * Solve the numbers game.
 * Returns the best (exact or nearest) solution found.
 */
export function solveNumbers(numbers: number[], target: number): SolverResult {
  bestResult = null;
  solve({ nums: numbers, steps: [] }, target);
  return bestResult ?? { exact: false, closest: 0, diff: target, steps: [] };
}

/**
 * Score a numbers round result.
 * 10 = exact, 7 = within 5, 5 = within 10, 0 = off by more than 10
 */
export function scoreNumbersRound(diff: number): number {
  if (diff === 0) return 10;
  if (diff <= 5) return 7;
  if (diff <= 10) return 5;
  return 0;
}

/**
 * Format equation steps as a human-readable string.
 * e.g. "50 + 8 = 58, 7 × 2 × 58 = 812"
 */
export function formatSolution(steps: EquationStep[]): string {
  return steps.map(s => `${s.left} ${s.op} ${s.right} = ${s.result}`).join(', ');
}

/**
 * Validate that a user's equation steps are valid given the starting numbers.
 */
export function validateSteps(steps: EquationStep[], numbers: number[]): { valid: boolean; finalResult: number | null } {
  if (steps.length === 0) return { valid: false, finalResult: null };

  const available = [...numbers];
  let lastResult: number | null = null;

  for (const step of steps) {
    const leftIdx = available.indexOf(step.left);
    if (leftIdx === -1) return { valid: false, finalResult: null };
    available.splice(leftIdx, 1);

    const rightIdx = available.indexOf(step.right);
    if (rightIdx === -1) return { valid: false, finalResult: null };
    available.splice(rightIdx, 1);

    const result = applyOp(step.left, step.op, step.right);
    if (result === null || result !== step.result) return { valid: false, finalResult: null };

    available.push(result);
    lastResult = result;
  }

  return { valid: true, finalResult: lastResult };
}
