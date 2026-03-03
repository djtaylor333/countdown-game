/**
 * Letters pool based on authentic Countdown/SOWPODS frequencies.
 * Vowels: A×15, E×21, I×13, O×13, U×5  = 67 total
 * Consonants: closely matching Countdown's weighted stacks.
 */

// ── Letter pools ─────────────────────────────────────────────────────────────

const VOWEL_POOL: string[] = [
  ...Array(15).fill('A'),
  ...Array(21).fill('E'),
  ...Array(13).fill('I'),
  ...Array(13).fill('O'),
  ...Array(5).fill('U'),
];

const CONSONANT_POOL: string[] = [
  ...Array(6).fill('B'),
  ...Array(4).fill('C'),
  ...Array(8).fill('D'),
  ...Array(2).fill('F'),
  ...Array(4).fill('G'),
  ...Array(3).fill('H'),
  ...Array(2).fill('J'),
  ...Array(2).fill('K'),
  ...Array(5).fill('L'),
  ...Array(4).fill('M'),
  ...Array(8).fill('N'),
  ...Array(4).fill('P'),
  ...Array(1).fill('Q'),
  ...Array(9).fill('R'),
  ...Array(9).fill('S'),
  ...Array(7).fill('T'),
  ...Array(4).fill('V'),
  ...Array(3).fill('W'),
  ...Array(1).fill('X'),
  ...Array(2).fill('Y'),
  ...Array(1).fill('Z'),
];

// Mutable working copies (replenished between daily challenges)
let vowelDeck = [...VOWEL_POOL];
let consonantDeck = [...CONSONANT_POOL];

function shuffle<T>(arr: T[], seed?: number): T[] {
  const a = [...arr];
  if (seed !== undefined) {
    // Seeded Fisher-Yates (LCG)
    let s = seed >>> 0;
    for (let i = a.length - 1; i > 0; i--) {
      s = (Math.imul(1664525, s) + 1013904223) >>> 0;
      const j = Math.floor((s / 0x100000000) * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  } else {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }
  return a;
}

export function resetDecks(seed?: number): void {
  const s = seed ?? Date.now();
  vowelDeck = shuffle([...VOWEL_POOL], s);
  consonantDeck = shuffle([...CONSONANT_POOL], s + 1);
}

export function pickVowel(): string {
  if (vowelDeck.length === 0) vowelDeck = shuffle([...VOWEL_POOL], Date.now());
  return vowelDeck.pop()!;
}

export function pickConsonant(): string {
  if (consonantDeck.length === 0) consonantDeck = shuffle([...CONSONANT_POOL], Date.now() + 1);
  return consonantDeck.pop()!;
}

// ── Seeded letter generation for daily challenges ────────────────────────────

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  function next(): number {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generate 9 letters seeded by a date key + round index.
 * Always produces min 3 vowels and min 4 consonants.
 * Default breakdown: 3 vowels + 6 consonants (most common Countdown selection).
 */
export function generateSeededLetters(seed: number, vowelCount = 4): string[] {
  // Clamp: min 3 vowels, max 6 vowels
  const vCount = Math.max(3, Math.min(6, vowelCount));
  const cCount = 9 - vCount;

  const vowels = seededShuffle([...VOWEL_POOL], seed);
  const consonants = seededShuffle([...CONSONANT_POOL], seed + 1);

  const result: string[] = [
    ...vowels.slice(0, vCount),
    ...consonants.slice(0, cCount),
  ];

  // Final shuffle so vowels / consonants aren't all grouped
  return seededShuffle(result, seed + 2);
}

// ── Word validation ──────────────────────────────────────────────────────────

const BASE_PATH = process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true' ? '/countdown-game' : '';

let wordSet: Set<string> | null = null;
let wordListPromise: Promise<Set<string>> | null = null;

export async function loadWordList(): Promise<Set<string>> {
  if (wordSet) return wordSet;
  if (wordListPromise) return wordListPromise;

  wordListPromise = fetch(`${BASE_PATH}/data/wordlist.json`)
    .then(r => r.json() as Promise<string[]>)
    .then(words => {
      wordSet = new Set(words.map((w: string) => w.toUpperCase()));
      return wordSet;
    });

  return wordListPromise;
}

/**
 * Check whether a word can be formed from the given letters.
 * Letters is an array of the 9 available letters (uppercase).
 * Word must use each letter no more times than it appears.
 */
export function canFormWord(word: string, letters: string[]): boolean {
  const available: Record<string, number> = {};
  for (const l of letters) {
    available[l] = (available[l] ?? 0) + 1;
  }
  for (const ch of word.toUpperCase()) {
    if (!available[ch] || available[ch] === 0) return false;
    available[ch]--;
  }
  return true;
}

export async function isValidWord(word: string, letters: string[]): Promise<boolean> {
  if (word.length < 2) return false;
  if (!canFormWord(word, letters)) return false;
  const set = await loadWordList();
  return set.has(word.toUpperCase());
}

// ── Anagram solver ───────────────────────────────────────────────────────────

export interface SolverWord {
  word: string;
  length: number;
}

/**
 * Find the best words possible from the selected letters.
 * Returns up to `limit` words, grouped starting from the longest.
 */
export async function findBestWords(
  letters: string[],
  limit = 8,
): Promise<SolverWord[]> {
  const set = await loadWordList();
  const uppercaseLetters = letters.map(l => l.toUpperCase());

  const results: SolverWord[] = [];

  // Iterate over all words in the set and check if they can be formed
  for (const word of set) {
    if (word.length < 2 || word.length > 9) continue;
    if (canFormWord(word, uppercaseLetters)) {
      results.push({ word, length: word.length });
    }
  }

  // Sort by length desc, then alphabetically
  results.sort((a, b) => b.length - a.length || a.word.localeCompare(b.word));

  // Return diverse set: best length + up to 2 each of shorter lengths
  const seen: Record<number, number> = {};
  const filtered: SolverWord[] = [];
  const maxLength = results[0]?.length ?? 0;

  for (const w of results) {
    if (w.length === maxLength) {
      filtered.push(w);
      seen[w.length] = (seen[w.length] ?? 0) + 1;
      if (filtered.length >= limit) break;
    } else {
      if ((seen[w.length] ?? 0) < 2) {
        filtered.push(w);
        seen[w.length] = (seen[w.length] ?? 0) + 1;
      }
      if (filtered.length >= limit) break;
    }
  }

  return filtered;
}

// ── Scoring ──────────────────────────────────────────────────────────────────

export function scoreLetterRound(wordLength: number, totalLetters = 9): number {
  if (wordLength <= 0) return 0;
  if (wordLength === totalLetters) return totalLetters * 2; // bonus for all letters
  return wordLength;
}
