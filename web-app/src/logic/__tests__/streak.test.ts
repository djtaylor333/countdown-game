import { getStreak, recordDailyPlay, generateShareText } from '../streak';
import type { DailyResult } from '../types';

function makeResult(overrides: Partial<DailyResult> = {}): DailyResult {
  return {
    dateKey: '2026-03-03',
    lettersScore1: 4,
    lettersMax1: 9,
    lettersScore2: 3,
    lettersMax2: 9,
    lettersScore: 7,
    lettersMax: 18,
    numbersScore: 10,
    numbersMax: 10,
    totalScore: 17,
    completed: true,
    ...overrides,
  };
}

describe('streak', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── getStreak ──────────────────────────────────────────────────────────────

  describe('getStreak', () => {
    it('returns default streak data when nothing stored', () => {
      const s = getStreak();
      expect(s.currentPlayStreak).toBe(0);
      expect(s.currentCompleteStreak).toBe(0);
      expect(s.lastPlayDate).toBeNull();
      expect(s.lastCompleteDate).toBeNull();
      expect(s.totalGamesPlayed).toBe(0);
      expect(s.totalGamesCompleted).toBe(0);
      expect(s.history).toEqual([]);
    });
  });

  // ── recordDailyPlay ────────────────────────────────────────────────────────

  describe('recordDailyPlay — first play', () => {
    it('sets play streak to 1', () => {
      const s = recordDailyPlay(makeResult());
      expect(s.currentPlayStreak).toBe(1);
    });

    it('sets totalGamesPlayed to 1', () => {
      const s = recordDailyPlay(makeResult());
      expect(s.totalGamesPlayed).toBe(1);
    });

    it('sets lastPlayDate to the result dateKey', () => {
      const s = recordDailyPlay(makeResult({ dateKey: '2026-03-03' }));
      expect(s.lastPlayDate).toBe('2026-03-03');
    });

    it('increments totalGamesCompleted when completed', () => {
      const s = recordDailyPlay(makeResult({ completed: true }));
      expect(s.totalGamesCompleted).toBe(1);
    });

    it('does not increment totalGamesCompleted when not completed', () => {
      const s = recordDailyPlay(makeResult({ completed: false }));
      expect(s.totalGamesCompleted).toBe(0);
    });

    it('adds the result to history', () => {
      const s = recordDailyPlay(makeResult({ dateKey: '2026-03-03' }));
      expect(s.history).toHaveLength(1);
      expect(s.history[0].dateKey).toBe('2026-03-03');
    });
  });

  describe('recordDailyPlay — consecutive days', () => {
    it('increments play streak on consecutive days', () => {
      recordDailyPlay(makeResult({ dateKey: '2026-03-01' }));
      recordDailyPlay(makeResult({ dateKey: '2026-03-02' }));
      const s = recordDailyPlay(makeResult({ dateKey: '2026-03-03' }));
      expect(s.currentPlayStreak).toBe(3);
    });

    it('increments complete streak on consecutive completed days', () => {
      recordDailyPlay(makeResult({ dateKey: '2026-03-01', completed: true }));
      recordDailyPlay(makeResult({ dateKey: '2026-03-02', completed: true }));
      const s = recordDailyPlay(makeResult({ dateKey: '2026-03-03', completed: true }));
      expect(s.currentCompleteStreak).toBe(3);
    });
  });

  describe('recordDailyPlay — broken streak', () => {
    it('resets play streak to 1 if a day is missed', () => {
      recordDailyPlay(makeResult({ dateKey: '2026-03-01' }));
      // Skip March 2, play March 3
      const s = recordDailyPlay(makeResult({ dateKey: '2026-03-03' }));
      expect(s.currentPlayStreak).toBe(1);
    });

    it('resets complete streak to 1 if a day is missed', () => {
      recordDailyPlay(makeResult({ dateKey: '2026-03-01', completed: true }));
      const s = recordDailyPlay(makeResult({ dateKey: '2026-03-03', completed: true }));
      expect(s.currentCompleteStreak).toBe(1);
    });
  });

  describe('recordDailyPlay — duplicate date', () => {
    it('does not double-count totalGamesPlayed for the same date', () => {
      recordDailyPlay(makeResult({ dateKey: '2026-03-03', lettersScore1: 2, lettersScore: 5 }));
      const s = recordDailyPlay(makeResult({ dateKey: '2026-03-03', lettersScore1: 4, lettersScore: 7 }));
      expect(s.totalGamesPlayed).toBe(1);
    });

    it('updates the score to max on duplicate date', () => {
      recordDailyPlay(makeResult({ dateKey: '2026-03-03', lettersScore1: 2, lettersScore2: 3, lettersScore: 5, totalScore: 15 }));
      const s = recordDailyPlay(makeResult({ dateKey: '2026-03-03', lettersScore1: 5, lettersScore2: 3, lettersScore: 8, totalScore: 18 }));
      const entry = s.history.find(h => h.dateKey === '2026-03-03');
      expect(entry?.lettersScore).toBe(8);
      expect(entry?.totalScore).toBe(18);
    });
  });

  describe('recordDailyPlay — persistence', () => {
    it('persists to localStorage and reloads correctly', () => {
      recordDailyPlay(makeResult({ dateKey: '2026-03-03' }));
      // getStreak() re-reads from localStorage
      const s = getStreak();
      expect(s.currentPlayStreak).toBe(1);
      expect(s.totalGamesPlayed).toBe(1);
    });
  });
});

// ── generateShareText ────────────────────────────────────────────────────────

describe('generateShareText', () => {
  it('returns a non-empty string with the date', () => {
    const result = makeResult({ dateKey: '2026-03-03', totalScore: 17 });
    const text = generateShareText(result);
    expect(text).toContain('2026-03-03');
    expect(text.length).toBeGreaterThan(10);
  });

  it('includes score information', () => {
    const result = makeResult({ lettersScore: 7, lettersMax: 9, numbersScore: 10 });
    const text = generateShareText(result);
    // Should show letters score
    expect(text).toMatch(/7/);
  });
});
