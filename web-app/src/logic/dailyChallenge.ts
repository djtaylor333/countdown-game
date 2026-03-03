import type { DailyChallenge } from './types';
import { generateSeededLetters } from './letters';
import { generateNumbers, generateTarget } from './numbers';

/**
 * Deterministic seed from a date string "YYYY-MM-DD".
 * Uses a simple hash so the same date always produces the same puzzle.
 */
function dateToSeed(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    const ch = dateKey.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return (hash >>> 0); // unsigned 32-bit
}

/**
 * Get today's date key in "YYYY-MM-DD" format (local time).
 */
export function getTodayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Generate the full daily challenge for a given date key.
 * All users on the same day get the same puzzle.
 */
export function getDailyChallenge(dateKey: string): DailyChallenge {
  const seed = dateToSeed(dateKey);

  // Round 1 letters (4 vowels, 5 consonants)
  const letterRound1 = generateSeededLetters(seed, 4);

  // Round 2 letters (3 vowels, 6 consonants — more consonant heavy)
  const letterRound2 = generateSeededLetters(seed + 100, 3);

  // Numbers: seeded large count (0-4) and arrangement
  function seededInt(s: number, min: number, max: number): number {
    const rng = ((s * 1664525 + 1013904223) >>> 0) / 0x100000000;
    return min + Math.floor(rng * (max - min + 1));
  }
  const largeCount = seededInt(seed + 200, 0, 4);
  const numbers = generateNumbers(largeCount, seed + 300);
  const target = generateTarget(seed + 400);

  return { dateKey, letterRound1, letterRound2, numbers, largeCount, target };
}

/**
 * Get today's daily challenge.
 */
export function getTodaysChallenge(): DailyChallenge {
  return getDailyChallenge(getTodayKey());
}

// ── Round definitions for Practice and Full Game modes ───────────────────────

export interface RoundDef {
  type: 'letters' | 'numbers';
  /** Epoch-based seed for letter deck shuffling (letters rounds only) */
  deckSeed: number;
  /** Generated target number (numbers rounds only) */
  target: number;
  /** Seed for shuffling the number pools (numbers rounds only) */
  numsSeed: number;
  /** How many large numbers (25-100) to include (numbers rounds only) */
  largeCount: number;
}

function seededInt(s: number, min: number, max: number): number {
  const rng = ((s * 1664525 + 1013904223) >>> 0) / 0x100000000;
  return min + Math.floor(rng * (max - min + 1));
}

/**
 * Build a single numbers RoundDef seeded from the given seed offset.
 */
function makeNumbersRoundDef(seedBase: number): RoundDef {
  return {
    type: 'numbers',
    deckSeed: 0,
    target: generateTarget(seedBase),
    numsSeed: seedBase + 500,
    largeCount: seededInt(seedBase + 700, 0, 4),
  };
}

/**
 * Generate round definitions for Practice Mode: 2 letters + 1 numbers.
 * Uses epoch timestamp as seed so every practice game is unique.
 */
export function generatePracticeRoundDefs(seed?: number): RoundDef[] {
  const s = seed ?? Date.now();
  return [
    { type: 'letters', deckSeed: s,        target: 0, numsSeed: 0, largeCount: 0 },
    { type: 'letters', deckSeed: s + 1000, target: 0, numsSeed: 0, largeCount: 0 },
    makeNumbersRoundDef(s + 2000),
  ];
}

/**
 * Generate round definitions for Full Game Mode: 6 letters + 3 numbers (9 rounds).
 * Modelled on the real Countdown show format.
 * Uses epoch timestamp as seed so every full game is unique.
 */
export function generateFullGameRoundDefs(seed?: number): RoundDef[] {
  const s = seed ?? Date.now();
  return [
    { type: 'letters', deckSeed: s,        target: 0, numsSeed: 0, largeCount: 0 },
    { type: 'letters', deckSeed: s + 1000, target: 0, numsSeed: 0, largeCount: 0 },
    { type: 'letters', deckSeed: s + 2000, target: 0, numsSeed: 0, largeCount: 0 },
    { type: 'letters', deckSeed: s + 3000, target: 0, numsSeed: 0, largeCount: 0 },
    { type: 'letters', deckSeed: s + 4000, target: 0, numsSeed: 0, largeCount: 0 },
    { type: 'letters', deckSeed: s + 5000, target: 0, numsSeed: 0, largeCount: 0 },
    makeNumbersRoundDef(s + 6000),
    makeNumbersRoundDef(s + 8000),
    makeNumbersRoundDef(s + 10000),
  ];
}

/**
 * Build daily mode round defs from an existing DailyChallenge.
 */
export function dailyToRoundDefs(challenge: DailyChallenge): RoundDef[] {
  const seed = dateToSeed(challenge.dateKey);
  return [
    { type: 'letters', deckSeed: seed,       target: 0, numsSeed: 0,      largeCount: 0 },
    { type: 'letters', deckSeed: seed + 100, target: 0, numsSeed: 0,      largeCount: 0 },
    { type: 'numbers', deckSeed: 0,          target: challenge.target, numsSeed: seed + 300, largeCount: challenge.largeCount },
  ];
}
