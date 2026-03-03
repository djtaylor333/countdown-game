// ── Core game types ──────────────────────────────────────────────────────────

export type GameMode = 'letters' | 'numbers';

export type GamePhase =
  | 'selecting'       // user is picking letters / number category
  | 'countdown'       // 3-2-1 countdown before timer starts
  | 'playing'         // 30-second timer running
  | 'submitting'      // user selects their best answer
  | 'results'         // displaying round results
  | 'daily-complete'; // all rounds done for the day

// ── Letters types ────────────────────────────────────────────────────────────

export type LetterType = 'consonant' | 'vowel';

export interface LetterTile {
  letter: string;
  index: number;   // position in the 9-tile row
  used: boolean;   // has this tile been placed in the current word?
}

export interface LetterRoundState {
  selectedLetters: string[];          // the 9 chosen letters
  currentWord: string[];              // indices of tiles placed in word builder
  currentWordIndices: number[];       // indices into selectedLetters
  timeRemaining: number;              // seconds left
  phase: GamePhase;
  vowelCount: number;
  consonantCount: number;
}

export interface WordResult {
  word: string;
  valid: boolean;
  definition?: string;
  length: number;
}

export interface LetterRoundResult {
  userWord: string;
  userWordValid: boolean;
  userScore: number;
  bestWords: BestWord[];   // top words possible, length descending
  maxPossibleScore: number;
}

export interface BestWord {
  word: string;
  definition?: string;
  loading?: boolean;
}

// ── Numbers types ────────────────────────────────────────────────────────────

export type Operation = '+' | '-' | '×' | '÷';

export interface NumberTile {
  value: number;
  index: number;
  used: boolean;
  isLarge: boolean;
}

export interface EquationStep {
  left: number;
  right: number;
  op: Operation;
  result: number;
}

export interface NumberRoundState {
  numbers: number[];          // 6 chosen numbers
  target: number;             // 3-digit target
  largeCount: number;         // how many large numbers chosen
  phase: GamePhase;
  timeRemaining: number;
  steps: EquationStep[];           // user's built equation steps
  availableNumbers: number[];      // numbers still available
  currentLeft: number | null;
  currentOp: Operation | null;
}

export interface NumberRoundResult {
  userResult: number | null;       // closest the user got
  userSteps: EquationStep[];
  userScore: number;               // 10/7/5/0
  solution: EquationStep[] | null; // optimal solution
  target: number;
}

// ── Daily challenge ──────────────────────────────────────────────────────────

export interface DailyChallenge {
  dateKey: string;             // "2026-03-03"
  letterRound1: string[];      // 9 letters
  letterRound2: string[];      // 9 letters
  numbers: number[];           // 6 numbers
  largeCount: number;
  target: number;
}

// ── Streak & progress ────────────────────────────────────────────────────────

export interface DailyResult {
  dateKey: string;
  // Per-round breakdown
  lettersScore1: number;
  lettersMax1: number;
  letterWord1?: string;          // best word user found in round 1
  lettersScore2: number;
  lettersMax2: number;
  letterWord2?: string;          // best word user found in round 2
  numbersScore: number;
  numbersMax: 10;
  // Combined totals (derived)
  lettersScore: number;          // lettersScore1 + lettersScore2
  lettersMax: number;            // lettersMax1 + lettersMax2
  totalScore: number;
  completed: boolean;            // all 3 rounds submitted
}

export interface StreakData {
  currentPlayStreak: number;   // days in a row any round played
  currentCompleteStreak: number; // days in a row all rounds completed
  bestPlayStreak: number;
  bestCompleteStreak: number;
  lastPlayDate: string | null;
  lastCompleteDate: string | null;
  totalGamesPlayed: number;
  totalGamesCompleted: number;
  history: DailyResult[];
}

// ── Full game session ────────────────────────────────────────────────────────

export interface GameSession {
  challenge: DailyChallenge;
  currentRound: 0 | 1 | 2;    // 0=letters1, 1=letters2, 2=numbers
  letterResult1: LetterRoundResult | null;
  letterResult2: LetterRoundResult | null;
  numberResult: NumberRoundResult | null;
}
