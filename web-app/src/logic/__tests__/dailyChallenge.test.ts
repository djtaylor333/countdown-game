import { getDailyChallenge, getTodayKey } from '../dailyChallenge';

// ── getTodayKey ──────────────────────────────────────────────────────────────

describe('getTodayKey', () => {
  it('returns a date string in YYYY-MM-DD format', () => {
    const key = getTodayKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('pads month and day with leading zeros', () => {
    // Mock Date to a single-digit month/day
    const OrigDate = global.Date;
    class MockDate extends OrigDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(2026, 0, 5); // Jan 5 2026
        } else {
          // @ts-expect-error: spread
          super(...args);
        }
      }
    }
    global.Date = MockDate as unknown as typeof Date;
    const key = getTodayKey();
    expect(key).toBe('2026-01-05');
    global.Date = OrigDate;
  });
});

// ── getDailyChallenge ────────────────────────────────────────────────────────

describe('getDailyChallenge', () => {
  const DATE = '2026-03-03';

  it('returns a challenge with correct dateKey', () => {
    const c = getDailyChallenge(DATE);
    expect(c.dateKey).toBe(DATE);
  });

  it('returns exactly 9 letters in round 1', () => {
    const c = getDailyChallenge(DATE);
    expect(c.letterRound1).toHaveLength(9);
  });

  it('returns exactly 9 letters in round 2', () => {
    const c = getDailyChallenge(DATE);
    expect(c.letterRound2).toHaveLength(9);
  });

  it('returns exactly 6 numbers', () => {
    const c = getDailyChallenge(DATE);
    expect(c.numbers).toHaveLength(6);
  });

  it('returns a 3-digit target (100–999)', () => {
    const c = getDailyChallenge(DATE);
    expect(c.target).toBeGreaterThanOrEqual(100);
    expect(c.target).toBeLessThanOrEqual(999);
  });

  it('is fully deterministic — same date always gives same puzzle', () => {
    const a = getDailyChallenge(DATE);
    const b = getDailyChallenge(DATE);
    expect(a.letterRound1).toEqual(b.letterRound1);
    expect(a.letterRound2).toEqual(b.letterRound2);
    expect(a.numbers).toEqual(b.numbers);
    expect(a.target).toBe(b.target);
  });

  it('produces different puzzles for different dates', () => {
    const a = getDailyChallenge('2026-03-03');
    const b = getDailyChallenge('2026-03-04');
    // At least one field should differ
    const same =
      a.letterRound1.join() === b.letterRound1.join() &&
      a.letterRound2.join() === b.letterRound2.join() &&
      a.numbers.join() === b.numbers.join() &&
      a.target === b.target;
    expect(same).toBe(false);
  });

  it('letterRound1 and letterRound2 differ for the same date', () => {
    const c = getDailyChallenge(DATE);
    expect(c.letterRound1.join()).not.toBe(c.letterRound2.join());
  });

  it('round 1 always has at least 3 vowels', () => {
    const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
    for (const date of ['2026-01-01', '2026-06-15', '2026-12-31']) {
      const c = getDailyChallenge(date);
      const count = c.letterRound1.filter(l => vowels.has(l)).length;
      expect(count).toBeGreaterThanOrEqual(3);
    }
  });

  it('round 2 always has at least 3 vowels', () => {
    const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
    for (const date of ['2026-01-01', '2026-06-15', '2026-12-31']) {
      const c = getDailyChallenge(date);
      const count = c.letterRound2.filter(l => vowels.has(l)).length;
      expect(count).toBeGreaterThanOrEqual(3);
    }
  });

  it('largeCount is between 0 and 4', () => {
    for (const date of ['2026-01-01', '2026-03-03', '2026-07-04', '2026-11-25']) {
      const c = getDailyChallenge(date);
      expect(c.largeCount).toBeGreaterThanOrEqual(0);
      expect(c.largeCount).toBeLessThanOrEqual(4);
    }
  });
});
