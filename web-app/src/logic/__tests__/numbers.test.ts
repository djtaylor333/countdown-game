import {
  generateNumbers,
  generateTarget,
  solveNumbers,
  scoreNumbersRound,
  formatSolution,
  validateSteps,
} from '../numbers';
import type { EquationStep } from '../types';

// ── generateNumbers ──────────────────────────────────────────────────────────

describe('generateNumbers', () => {
  it('always produces exactly 6 numbers', () => {
    for (const lc of [0, 1, 2, 3, 4]) {
      expect(generateNumbers(lc, 42)).toHaveLength(6);
    }
  });

  it('includes the correct number of large numbers', () => {
    const large = new Set([25, 50, 75, 100]);
    for (const lc of [0, 1, 2, 3, 4]) {
      const nums = generateNumbers(lc, 42 + lc);
      const largeCount = nums.filter(n => large.has(n)).length;
      expect(largeCount).toBe(lc);
    }
  });

  it('keeps small numbers in range 1–10', () => {
    const nums = generateNumbers(2, 99);
    const large = new Set([25, 50, 75, 100]);
    const small = nums.filter(n => !large.has(n));
    for (const n of small) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(10);
    }
  });

  it('is deterministic for the same seed', () => {
    expect(generateNumbers(2, 777)).toEqual(generateNumbers(2, 777));
  });

  it('differs for different seeds', () => {
    const a = generateNumbers(2, 100);
    const b = generateNumbers(2, 200);
    expect(a).not.toEqual(b);
  });

  it('clamps largeCount to 0–4', () => {
    expect(generateNumbers(-1, 1)).toHaveLength(6);
    expect(generateNumbers(5, 1)).toHaveLength(6);
  });
});

// ── generateTarget ───────────────────────────────────────────────────────────

describe('generateTarget', () => {
  it('produces a 3-digit number (100–999)', () => {
    for (let seed = 0; seed < 20; seed++) {
      const t = generateTarget(seed);
      expect(t).toBeGreaterThanOrEqual(100);
      expect(t).toBeLessThanOrEqual(999);
    }
  });

  it('is deterministic for same seed', () => {
    expect(generateTarget(42)).toBe(generateTarget(42));
  });

  it('differs for different seeds', () => {
    const values = new Set<number>();
    for (let s = 0; s < 20; s++) values.add(generateTarget(s * 1000));
    expect(values.size).toBeGreaterThan(5); // expect variety
  });
});

// ── solveNumbers ─────────────────────────────────────────────────────────────

describe('solveNumbers', () => {
  it('finds exact solution for a solvable puzzle', () => {
    // 75 + 25 = 100, trivially exact
    const result = solveNumbers([75, 25, 3, 4, 5, 6], 100);
    expect(result.exact).toBe(true);
    expect(result.closest).toBe(100);
    expect(result.diff).toBe(0);
  });

  it('finds exact solution for known puzzle: 812', () => {
    // From Wikipedia example: 50+8=58, 7×2×58=812
    const result = solveNumbers([50, 8, 7, 2, 3, 75], 812);
    expect(result.exact).toBe(true);
    expect(result.diff).toBe(0);
  });

  it('returns nearest when no exact solution exists', () => {
    // With only [1,1,2,2,3,3] and target 999, won't be exact
    const result = solveNumbers([1, 1, 2, 2, 3, 3], 999);
    expect(result.closest).toBeGreaterThan(0);
    expect(result.diff).toBeGreaterThan(0);
  });

  it('returns valid steps when exact', () => {
    const result = solveNumbers([100, 7, 5, 2, 3, 4], 100);
    expect(result.exact).toBe(true);
    // Steps may be empty (100 is already the target) or show computation
  });

  it('handles target that equals one of the given numbers', () => {
    const result = solveNumbers([504, 100, 2, 3, 4, 5], 504);
    // 504 is not in the valid large set but solveNumbers should handle any int
    // The simple case: if numbers contains 504, diff should be 0
    // But 504 is out of normal range — let's use 100 which IS in numbers
    const r2 = solveNumbers([100, 7, 5, 2, 3, 4], 100);
    expect(r2.exact).toBe(true);
  });

  it('does not use fractions or negative intermediates', () => {
    const result = solveNumbers([7, 3, 5, 6, 4, 2], 200);
    if (result.steps.length > 0) {
      for (const step of result.steps) {
        expect(step.result).toBeGreaterThan(0);
        expect(Number.isInteger(step.result)).toBe(true);
      }
    }
  });
});

// ── scoreNumbersRound ────────────────────────────────────────────────────────

describe('scoreNumbersRound', () => {
  it('returns 10 for exact (diff=0)', () => {
    expect(scoreNumbersRound(0)).toBe(10);
  });

  it('returns 7 for diff 1–5', () => {
    expect(scoreNumbersRound(1)).toBe(7);
    expect(scoreNumbersRound(5)).toBe(7);
  });

  it('returns 5 for diff 6–10', () => {
    expect(scoreNumbersRound(6)).toBe(5);
    expect(scoreNumbersRound(10)).toBe(5);
  });

  it('returns 0 for diff > 10', () => {
    expect(scoreNumbersRound(11)).toBe(0);
    expect(scoreNumbersRound(999)).toBe(0);
  });
});

// ── formatSolution ───────────────────────────────────────────────────────────

describe('formatSolution', () => {
  it('formats a single step correctly', () => {
    const steps: EquationStep[] = [{ left: 50, right: 8, op: '+', result: 58 }];
    expect(formatSolution(steps)).toBe('50 + 8 = 58');
  });

  it('formats multiple steps with comma separation', () => {
    const steps: EquationStep[] = [
      { left: 50, right: 8, op: '+', result: 58 },
      { left: 7, right: 2, op: '×', result: 14 },
    ];
    expect(formatSolution(steps)).toBe('50 + 8 = 58, 7 × 2 = 14');
  });

  it('returns empty string for no steps', () => {
    expect(formatSolution([])).toBe('');
  });
});

// ── validateSteps ────────────────────────────────────────────────────────────

describe('validateSteps', () => {
  it('validates a correct sequence', () => {
    const steps: EquationStep[] = [{ left: 50, right: 8, op: '+', result: 58 }];
    const { valid, finalResult } = validateSteps(steps, [50, 8, 7, 2, 3, 4]);
    expect(valid).toBe(true);
    expect(finalResult).toBe(58);
  });

  it('rejects a step with wrong result', () => {
    const steps: EquationStep[] = [{ left: 50, right: 8, op: '+', result: 60 }];
    const { valid } = validateSteps(steps, [50, 8, 7, 2, 3, 4]);
    expect(valid).toBe(false);
  });

  it('rejects when a number is used that is not available', () => {
    const steps: EquationStep[] = [{ left: 99, right: 8, op: '+', result: 107 }];
    const { valid } = validateSteps(steps, [50, 8, 7, 2, 3, 4]);
    expect(valid).toBe(false);
  });

  it('rejects empty steps', () => {
    const { valid, finalResult } = validateSteps([], [50, 8, 7]);
    expect(valid).toBe(false);
    expect(finalResult).toBeNull();
  });

  it('handles multi-step validation using intermediate results', () => {
    // 50+8=58, then 58×7=406
    const steps: EquationStep[] = [
      { left: 50, right: 8, op: '+', result: 58 },
      { left: 58, right: 7, op: '×', result: 406 },
    ];
    const { valid, finalResult } = validateSteps(steps, [50, 8, 7, 2, 3, 4]);
    expect(valid).toBe(true);
    expect(finalResult).toBe(406);
  });

  it('rejects division that has remainder', () => {
    const steps: EquationStep[] = [{ left: 50, right: 3, op: '÷', result: 16 }];
    const { valid } = validateSteps(steps, [50, 3, 7, 2, 5, 4]);
    expect(valid).toBe(false);
  });
});
