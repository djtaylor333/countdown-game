import {
  generatePracticeRoundDefs,
  generateFullGameRoundDefs,
  dailyToRoundDefs,
  getDailyChallenge,
} from '../dailyChallenge';
import { resetDecks, pickVowel, pickConsonant } from '../letters';

// ── generatePracticeRoundDefs ────────────────────────────────────────────────

describe('generatePracticeRoundDefs', () => {
  it('returns exactly 3 rounds', () => {
    const defs = generatePracticeRoundDefs(12345);
    expect(defs).toHaveLength(3);
  });

  it('produces 2 letters rounds and 1 numbers round', () => {
    const defs = generatePracticeRoundDefs(12345);
    const letters = defs.filter(d => d.type === 'letters');
    const numbers = defs.filter(d => d.type === 'numbers');
    expect(letters).toHaveLength(2);
    expect(numbers).toHaveLength(1);
  });

  it('orders letters rounds before numbers round', () => {
    const defs = generatePracticeRoundDefs(99999);
    expect(defs[0].type).toBe('letters');
    expect(defs[1].type).toBe('letters');
    expect(defs[2].type).toBe('numbers');
  });

  it('letters rounds have distinct deck seeds', () => {
    const defs = generatePracticeRoundDefs(5000);
    expect(defs[0].deckSeed).not.toBe(defs[1].deckSeed);
  });

  it('numbers round has a valid target (100–999)', () => {
    const defs = generatePracticeRoundDefs(7777);
    const numRound = defs.find(d => d.type === 'numbers')!;
    expect(numRound.target).toBeGreaterThanOrEqual(100);
    expect(numRound.target).toBeLessThanOrEqual(999);
  });

  it('produces deterministic results for the same seed', () => {
    const d1 = generatePracticeRoundDefs(42);
    const d2 = generatePracticeRoundDefs(42);
    expect(d1[2].target).toBe(d2[2].target);
    expect(d1[0].deckSeed).toBe(d2[0].deckSeed);
  });

  it('produces different results for different seeds', () => {
    const d1 = generatePracticeRoundDefs(1);
    const d2 = generatePracticeRoundDefs(9999999);
    expect(d1[2].target).not.toBe(d2[2].target);
  });

  it('uses Date.now() when no seed provided (smoke test — just check structure)', () => {
    const defs = generatePracticeRoundDefs();
    expect(defs).toHaveLength(3);
    expect(defs[2].type).toBe('numbers');
  });
});

// ── generateFullGameRoundDefs ────────────────────────────────────────────────

describe('generateFullGameRoundDefs', () => {
  it('returns exactly 9 rounds', () => {
    const defs = generateFullGameRoundDefs(12345);
    expect(defs).toHaveLength(9);
  });

  it('produces 6 letters rounds and 3 numbers rounds', () => {
    const defs = generateFullGameRoundDefs(12345);
    const letters = defs.filter(d => d.type === 'letters');
    const numbers = defs.filter(d => d.type === 'numbers');
    expect(letters).toHaveLength(6);
    expect(numbers).toHaveLength(3);
  });

  it('letters rounds come first, then numbers', () => {
    const defs = generateFullGameRoundDefs(54321);
    for (let i = 0; i < 6; i++) expect(defs[i].type).toBe('letters');
    for (let i = 6; i < 9; i++) expect(defs[i].type).toBe('numbers');
  });

  it('each letters round has a unique deck seed', () => {
    const defs = generateFullGameRoundDefs(11111);
    const seeds = defs.slice(0, 6).map(d => d.deckSeed);
    const uniqueSeeds = new Set(seeds);
    expect(uniqueSeeds.size).toBe(6);
  });

  it('each numbers round has a valid target (100–999)', () => {
    const defs = generateFullGameRoundDefs(22222);
    const numRounds = defs.filter(d => d.type === 'numbers');
    numRounds.forEach(nr => {
      expect(nr.target).toBeGreaterThanOrEqual(100);
      expect(nr.target).toBeLessThanOrEqual(999);
    });
  });

  it('each numbers round has a distinct target', () => {
    const defs = generateFullGameRoundDefs(33333);
    const targets = defs.filter(d => d.type === 'numbers').map(d => d.target);
    // targets should mostly differ (3 from different seeds)
    expect(targets[0]).not.toBe(targets[1]);
  });

  it('is deterministic for the same seed', () => {
    const d1 = generateFullGameRoundDefs(777);
    const d2 = generateFullGameRoundDefs(777);
    expect(d1.map(d => d.type)).toEqual(d2.map(d => d.type));
    expect(d1[0].deckSeed).toBe(d2[0].deckSeed);
    expect(d1[6].target).toBe(d2[6].target);
  });
});

// ── dailyToRoundDefs ─────────────────────────────────────────────────────────

describe('dailyToRoundDefs', () => {
  const challenge = getDailyChallenge('2026-03-15');

  it('returns exactly 3 round defs', () => {
    const defs = dailyToRoundDefs(challenge);
    expect(defs).toHaveLength(3);
  });

  it('has 2 letters rounds and 1 numbers round', () => {
    const defs = dailyToRoundDefs(challenge);
    expect(defs[0].type).toBe('letters');
    expect(defs[1].type).toBe('letters');
    expect(defs[2].type).toBe('numbers');
  });

  it('numbers round target matches the challenge target', () => {
    const defs = dailyToRoundDefs(challenge);
    expect(defs[2].target).toBe(challenge.target);
  });

  it('letters rounds have different deck seeds', () => {
    const defs = dailyToRoundDefs(challenge);
    expect(defs[0].deckSeed).not.toBe(defs[1].deckSeed);
  });

  it('is deterministic for the same date', () => {
    const c2 = getDailyChallenge('2026-03-15');
    const d1 = dailyToRoundDefs(challenge);
    const d2 = dailyToRoundDefs(c2);
    expect(d1[0].deckSeed).toBe(d2[0].deckSeed);
    expect(d1[2].target).toBe(d2[2].target);
  });
});

// ── resetDecks epoch seeding ─────────────────────────────────────────────────

describe('resetDecks with epoch seed', () => {
  it('produces the same deck order for the same seed', () => {
    resetDecks(987654);
    const v1 = pickVowel();
    const c1 = pickConsonant();

    resetDecks(987654);
    const v2 = pickVowel();
    const c2 = pickConsonant();

    expect(v1).toBe(v2);
    expect(c1).toBe(c2);
  });

  it('produces different decks for different seeds', () => {
    // Collect first 5 vowels for 3 very different seeds
    const collect = (seed: number) => {
      resetDecks(seed);
      return Array.from({ length: 5 }, () => pickVowel()).join('');
    };
    const r1 = collect(1);
    const r2 = collect(5_000_000);
    const r3 = collect(9_999_999);
    // At least one sequence should differ
    expect(r1 === r2 && r2 === r3).toBe(false);
  });

  it('produces only valid vowels from vowel deck', () => {
    const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
    resetDecks(555);
    for (let i = 0; i < 10; i++) {
      expect(VOWELS.has(pickVowel())).toBe(true);
    }
  });

  it('produces only consonants from consonant deck', () => {
    const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
    resetDecks(666);
    for (let i = 0; i < 10; i++) {
      expect(VOWELS.has(pickConsonant())).toBe(false);
    }
  });

  it('without seed uses epoch time (smoke test)', () => {
    // Just ensure it does not throw
    expect(() => resetDecks()).not.toThrow();
    const v = pickVowel();
    expect(typeof v).toBe('string');
    expect(v).toHaveLength(1);
  });
});
