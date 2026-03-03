import {
  canFormWord,
  scoreLetterRound,
  generateSeededLetters,
  pickVowel,
  pickConsonant,
  resetDecks,
  isValidWord,
  findBestWords,
} from '../letters';

// ── canFormWord ──────────────────────────────────────────────────────────────

describe('canFormWord', () => {
  it('returns true when word uses available letters exactly', () => {
    expect(canFormWord('CAT', ['C', 'A', 'T', 'S', 'E', 'R', 'N', 'I', 'D'])).toBe(true);
  });

  it('returns true for single-letter', () => {
    expect(canFormWord('A', ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'])).toBe(true);
  });

  it('returns false when a required letter is missing', () => {
    expect(canFormWord('CAT', ['C', 'B', 'T', 'S', 'E', 'R', 'N', 'I', 'D'])).toBe(false);
  });

  it('returns false when a letter is used more times than available', () => {
    // Only one E available, word needs two
    expect(canFormWord('ESSEE', ['S', 'E', 'S', 'A', 'B', 'C', 'D', 'F', 'G'])).toBe(false);
  });

  it('works with lowercase word input', () => {
    expect(canFormWord('cat', ['C', 'A', 'T', 'S', 'E', 'R', 'N', 'I', 'D'])).toBe(true);
  });

  it('returns true for 9-letter word using all tiles', () => {
    expect(canFormWord('ABCDEFGHI', ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'])).toBe(true);
  });

  it('allows duplicate letters when both are available', () => {
    expect(canFormWord('SEEM', ['S', 'E', 'E', 'M', 'A', 'B', 'C', 'D', 'F'])).toBe(true);
  });

  it('rejects duplicate letters when only one is available', () => {
    expect(canFormWord('SEEM', ['S', 'E', 'M', 'A', 'B', 'C', 'D', 'F', 'G'])).toBe(false);
  });

  it('handles empty word', () => {
    expect(canFormWord('', ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'])).toBe(true);
  });
});

// ── scoreLetterRound ─────────────────────────────────────────────────────────

describe('scoreLetterRound', () => {
  it('returns 0 for empty/zero-length word', () => {
    expect(scoreLetterRound(0)).toBe(0);
  });

  it('returns length for words shorter than total', () => {
    expect(scoreLetterRound(5)).toBe(5);
    expect(scoreLetterRound(8)).toBe(8);
    expect(scoreLetterRound(3)).toBe(3);
  });

  it('returns totalLetters * 2 for using all 9 letters', () => {
    expect(scoreLetterRound(9)).toBe(18);
  });

  it('respects custom totalLetters', () => {
    expect(scoreLetterRound(8, 8)).toBe(16); // all 8 letters
    expect(scoreLetterRound(7, 8)).toBe(7);  // 7 of 8
  });

  it('returns 0 for negative length', () => {
    expect(scoreLetterRound(-1)).toBe(0);
  });
});

// ── generateSeededLetters ────────────────────────────────────────────────────

describe('generateSeededLetters', () => {
  it('always produces exactly 9 letters', () => {
    const letters = generateSeededLetters(12345);
    expect(letters).toHaveLength(9);
  });

  it('produces deterministic output for the same seed', () => {
    const a = generateSeededLetters(99999);
    const b = generateSeededLetters(99999);
    expect(a).toEqual(b);
  });

  it('produces different output for different seeds', () => {
    const a = generateSeededLetters(100);
    const b = generateSeededLetters(200);
    expect(a).not.toEqual(b);
  });

  it('respects minimum 3 vowels', () => {
    const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
    for (let seed = 0; seed < 20; seed++) {
      const letters = generateSeededLetters(seed);
      const vowelCount = letters.filter(l => vowels.has(l)).length;
      expect(vowelCount).toBeGreaterThanOrEqual(3);
    }
  });

  it('respects maximum 6 vowels', () => {
    const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
    for (let seed = 0; seed < 20; seed++) {
      const letters = generateSeededLetters(seed, 6);
      const vowelCount = letters.filter(l => vowels.has(l)).length;
      expect(vowelCount).toBeLessThanOrEqual(6);
    }
  });

  it('clamps vowelCount below 3 to 3', () => {
    const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
    const letters = generateSeededLetters(42, 1); // request 1 vowel → should get 3
    const vowelCount = letters.filter(l => vowels.has(l)).length;
    expect(vowelCount).toBe(3);
  });

  it('all letters are uppercase alphabetic', () => {
    const letters = generateSeededLetters(777, 4);
    for (const l of letters) {
      expect(l).toMatch(/^[A-Z]$/);
    }
  });
});

// ── pickVowel / pickConsonant ─────────────────────────────────────────────────

describe('pickVowel', () => {
  it('returns a vowel', () => {
    resetDecks();
    const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
    for (let i = 0; i < 10; i++) {
      expect(vowels.has(pickVowel())).toBe(true);
    }
  });
});

describe('pickConsonant', () => {
  it('returns a consonant', () => {
    resetDecks();
    const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
    for (let i = 0; i < 10; i++) {
      expect(vowels.has(pickConsonant())).toBe(false);
    }
  });
});

// ── isValidWord (mocked fetch) ────────────────────────────────────────────────

describe('isValidWord', () => {
  beforeEach(() => {
    // Reset module-level wordSet by resetting the module (via manual mock of fetch)
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(['CATS', 'CAT', 'ACT', 'STEP', 'NETS', 'SENT', 'TENS', 'NEST', 'STERN']),
    } as unknown as Response);
    // Clear cached wordSet by reimporting - we'll just check canFormWord logic here
  });

  it('returns false for a word shorter than 2 letters', async () => {
    const result = await isValidWord('A', ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);
    expect(result).toBe(false);
  });

  it('returns false when letters cannot form word', async () => {
    // "CATS" but no C in letters
    const result = await isValidWord('CATS', ['A', 'T', 'S', 'E', 'R', 'N', 'I', 'D', 'L']);
    expect(result).toBe(false);
  });
});

// ── findBestWords ────────────────────────────────────────────────────────────

describe('findBestWords', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve([
        'STERN', 'TERNS', 'TERNS', 'RENTS', 'NEST', 'NETS', 'TENS', 'SENT',
        'NET', 'TEN', 'REN', 'SET', 'TES',
      ]),
    } as unknown as Response);
  });

  it('returns words sorted by length descending', async () => {
    const results = await findBestWords(['S', 'T', 'E', 'R', 'N', 'A', 'B', 'C', 'D'], 8);
    if (results.length > 1) {
      for (let i = 1; i < results.length; i++) {
        expect(results[i].length).toBeLessThanOrEqual(results[i - 1].length);
      }
    }
  });

  it('returns at most limit results', async () => {
    const results = await findBestWords(['S', 'T', 'E', 'R', 'N', 'A', 'B', 'C', 'D'], 4);
    expect(results.length).toBeLessThanOrEqual(4);
  });

  it('only returns words formable from the given letters', async () => {
    const letters = ['S', 'T', 'E', 'R', 'N', 'A', 'B', 'C', 'D'];
    const results = await findBestWords(letters, 8);
    for (const r of results) {
      expect(canFormWord(r.word, letters)).toBe(true);
    }
  });
});
