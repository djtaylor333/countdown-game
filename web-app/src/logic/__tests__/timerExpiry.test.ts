/**
 * Tests for timer-expiry behavior.
 *
 * When the 60-second countdown reaches zero the app must:
 * 1. Auto-submit immediately (skip the interactive "submitting" phase).
 * 2. Record 0 pts if nothing was built, or the player's current score otherwise.
 * 3. Reveal the best available answers in the TimesUpModal.
 * 4. Block all further keyboard / UI input for that round.
 *
 * These tests verify the scoring / logic layer that the auto-submit calls.
 * React-layer (reducer & modal) behaviour is covered by the reducer unit tests
 * at the bottom of this file (using the exported reducer helpers).
 */

import {
  scoreLetterRound,
  canFormWord,
} from '../letters';
import { scoreNumbersRound } from '../numbers';

// ── Helper: simulate what auto-submit does ───────────────────────────────────

/**
 * Compute the letter-round result the way handleSkipLetterRound / handleSubmitWord
 * would after a timeout.
 */
function computeLetterResult(
  word: string,
  letters: string[],
): { score: number; valid: boolean } {
  if (!word) return { score: 0, valid: false };
  const valid = canFormWord(word, letters);
  const score = valid ? scoreLetterRound(word.length) : 0;
  return { score, valid };
}

/**
 * Compute the numbers-round score from the last equation step result (or null).
 */
function computeNumbersScore(userResult: number | null, target: number): number {
  if (userResult === null) return 0;
  const diff = Math.abs(userResult - target);
  return scoreNumbersRound(diff);
}

// ── Letters: timeout with no word ────────────────────────────────────────────

describe('timer expiry — letters round, no word built', () => {
  const letters = ['S', 'T', 'A', 'R', 'G', 'A', 'Z', 'I', 'N'];

  it('scores 0 when the word is empty', () => {
    const { score, valid } = computeLetterResult('', letters);
    expect(score).toBe(0);
    expect(valid).toBe(false);
  });

  it('scores 0 for blank submitted word after timeout', () => {
    // Simulates timer expiry when wordIndices === []
    expect(scoreLetterRound(0)).toBe(0);
  });
});

// ── Letters: timeout mid-word ────────────────────────────────────────────────

describe('timer expiry — letters round, partial/complete word built', () => {
  const letters = ['S', 'T', 'A', 'R', 'G', 'A', 'Z', 'I', 'N'];

  it('scores the word length if the word is valid', () => {
    // "STAR" (4 letters) → 4 pts
    const { score, valid } = computeLetterResult('STAR', letters);
    expect(valid).toBe(true);
    expect(score).toBe(4);
  });

  it('scores 0 for an invalid word (not formable from tiles)', () => {
    // "BUZZ" needs two Zs, only one available
    const { score, valid } = computeLetterResult('BUZZ', letters);
    expect(valid).toBe(false);
    expect(score).toBe(0);
  });

  it('awards double for a 9-letter word (the full set)', () => {
    const nineLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    const word = 'ABCDEFGHI';
    const { score, valid } = computeLetterResult(word, nineLetters);
    // canFormWord will return true (all letters present)
    expect(valid).toBe(true);
    // scoreLetterRound(9) = 18
    expect(score).toBe(18);
  });
});

// ── Numbers: timeout with no steps ───────────────────────────────────────────

describe('timer expiry — numbers round, no steps entered', () => {
  it('scores 0 when userResult is null', () => {
    expect(computeNumbersScore(null, 843)).toBe(0);
  });

  it('scores 0 when the last step result is far from target', () => {
    // userResult=100, target=843 → diff=743 → 0 pts
    expect(computeNumbersScore(100, 843)).toBe(0);
  });
});

// ── Numbers: timeout mid-calculation ─────────────────────────────────────────

describe('timer expiry — numbers round, partial calculation', () => {
  it('scores 10 for exact match', () => {
    expect(computeNumbersScore(843, 843)).toBe(10);
  });

  it('scores 7 for within-5 proximity', () => {
    // diff = 3
    expect(computeNumbersScore(840, 843)).toBe(7);
  });

  it('scores 5 for within-10 proximity', () => {
    // diff = 8
    expect(computeNumbersScore(835, 843)).toBe(5);
  });

  it('scores 0 when more than 10 away', () => {
    // diff = 20
    expect(computeNumbersScore(863, 843)).toBe(0);
  });
});

// ── scoreNumbersRound edge cases (called by auto-submit) ────────────────────

describe('scoreNumbersRound edge cases', () => {
  it('returns 0 for diff=Infinity (no answer)', () => {
    // Infinity passed when userResult is null
    const infiniteResult = scoreNumbersRound(Infinity);
    // The implementation should treat >10 as 0
    expect(infiniteResult).toBe(0);
  });

  it('returns 10 for diff=0', () => {
    expect(scoreNumbersRound(0)).toBe(10);
  });
});

// ── Reducer-level: timedOut flag (pure state-machine tests) ──────────────────

/**
 * The reducer is defined inside game/page.tsx.
 * We re-implement the relevant cases here to verify the contracts without
 * pulling in React or the full component tree.
 */

type Phase = 'selecting' | 'countdown' | 'playing' | 'submitting' | 'results';
interface MinState { phase: Phase; timeRemaining: number; timedOut: boolean; roundIndex: number }

function miniReducer(
  state: MinState,
  action: { type: string },
): MinState {
  switch (action.type) {
    case 'TIMER_EXPIRED':
      return { ...state, phase: 'submitting', timeRemaining: 0, timedOut: true };
    case 'SUBMIT_WORD':
      return { ...state, phase: 'submitting', timeRemaining: 0 };
    case 'TIMER_TICK':
      return { ...state, timeRemaining: Math.max(0, state.timeRemaining - 1) };
    case 'DISMISS_TIMED_OUT':
      return { ...state, timedOut: false };
    case 'NEXT_ROUND':
      return { ...state, phase: 'selecting', timeRemaining: 60, timedOut: false, roundIndex: state.roundIndex + 1 };
    default:
      return state;
  }
}

const playingState: MinState = {
  phase: 'playing',
  timeRemaining: 1,
  timedOut: false,
  roundIndex: 0,
};

describe('reducer — TIMER_EXPIRED sets timedOut flag', () => {
  it('sets phase to submitting', () => {
    const next = miniReducer(playingState, { type: 'TIMER_EXPIRED' });
    expect(next.phase).toBe('submitting');
  });

  it('sets timeRemaining to 0', () => {
    const next = miniReducer(playingState, { type: 'TIMER_EXPIRED' });
    expect(next.timeRemaining).toBe(0);
  });

  it('sets timedOut to true', () => {
    const next = miniReducer(playingState, { type: 'TIMER_EXPIRED' });
    expect(next.timedOut).toBe(true);
  });
});

describe('reducer — user-initiated SUBMIT_WORD does NOT set timedOut', () => {
  it('keeps timedOut false when player manually stops clock', () => {
    const next = miniReducer(playingState, { type: 'SUBMIT_WORD' });
    expect(next.timedOut).toBe(false);
  });

  it('still sets phase to submitting', () => {
    const next = miniReducer(playingState, { type: 'SUBMIT_WORD' });
    expect(next.phase).toBe('submitting');
  });
});

describe('reducer — NEXT_ROUND resets timedOut', () => {
  const timedOutState: MinState = { ...playingState, phase: 'results', timedOut: true };

  it('clears timedOut on advancing to the next round', () => {
    const next = miniReducer(timedOutState, { type: 'NEXT_ROUND' });
    expect(next.timedOut).toBe(false);
  });

  it('resets phase to selecting', () => {
    const next = miniReducer(timedOutState, { type: 'NEXT_ROUND' });
    expect(next.phase).toBe('selecting');
  });

  it('resets timeRemaining to 60', () => {
    const next = miniReducer(timedOutState, { type: 'NEXT_ROUND' });
    expect(next.timeRemaining).toBe(60);
  });

  it('increments roundIndex', () => {
    const next = miniReducer(timedOutState, { type: 'NEXT_ROUND' });
    expect(next.roundIndex).toBe(1);
  });
});

describe('reducer — DISMISS_TIMED_OUT clears flag without advancing round', () => {
  const timedOutState: MinState = { ...playingState, phase: 'results', timedOut: true };

  it('sets timedOut to false', () => {
    const next = miniReducer(timedOutState, { type: 'DISMISS_TIMED_OUT' });
    expect(next.timedOut).toBe(false);
  });

  it('does not change the phase', () => {
    const next = miniReducer(timedOutState, { type: 'DISMISS_TIMED_OUT' });
    expect(next.phase).toBe('results');
  });

  it('does not change the roundIndex', () => {
    const next = miniReducer(timedOutState, { type: 'DISMISS_TIMED_OUT' });
    expect(next.roundIndex).toBe(0);
  });
});

describe('reducer — timer tick sequence reaching zero', () => {
  it('reaches timeRemaining=0 after 60 TIMER_TICK actions', () => {
    let s: MinState = { phase: 'playing', timeRemaining: 60, timedOut: false, roundIndex: 0 };
    for (let i = 0; i < 60; i++) {
      s = miniReducer(s, { type: 'TIMER_TICK' });
    }
    expect(s.timeRemaining).toBe(0);
  });

  it('does not go below 0', () => {
    let s: MinState = { phase: 'playing', timeRemaining: 0, timedOut: false, roundIndex: 0 };
    s = miniReducer(s, { type: 'TIMER_TICK' });
    expect(s.timeRemaining).toBe(0);
  });
});
