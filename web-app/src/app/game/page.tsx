'use client';

import { useEffect, useCallback, useReducer, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  getTodaysChallenge,
  getTodayKey,
  generatePracticeRoundDefs,
  generateFullGameRoundDefs,
  dailyToRoundDefs,
  type RoundDef,
} from '../../logic/dailyChallenge';
import { isValidWord, findBestWords, scoreLetterRound, pickVowel, pickConsonant, resetDecks } from '../../logic/letters';
import { solveNumbers, scoreNumbersRound } from '../../logic/numbers';
import { recordDailyPlay } from '../../logic/streak';
import type {
  DailyChallenge,
  LetterRoundResult,
  NumberRoundResult,
  EquationStep,
  Operation,
} from '../../logic/types';
import CountdownClock from '../../components/CountdownClock';
import LetterBoard from '../../components/LetterBoard';
import LetterSelector from '../../components/LetterSelector';
import WordBuilder from '../../components/WordBuilder';
import NumberBoard from '../../components/NumberBoard';
import NumberBuilder from '../../components/NumberBuilder';
import { LetterRoundResultPanel, NumberRoundResultPanel } from '../../components/RoundResult';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AppMode = 'daily' | 'practice' | 'full';

const LARGE_POOL_SRC = [25, 50, 75, 100];
const SMALL_POOL_SRC = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];

/** Seeded Fisher-Yates — pass seed for deterministic results, omit for epoch-random */
function shuffleArray<T>(arr: T[], seed?: number): T[] {
  const a = [...arr];
  if (seed !== undefined) {
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

type RoundPhase = 'selecting' | 'countdown' | 'playing' | 'submitting' | 'results';

interface GameState {
  mode: AppMode;
  timerEnabled: boolean;
  dailyChallenge: DailyChallenge | null;
  roundDefs: RoundDef[];
  roundIndex: number;
  phase: RoundPhase;
  countdownVal: number;
  timeRemaining: number;
  // Letters
  revealedLetters: string[];
  vowelCount: number;
  consonantCount: number;
  wordIndices: number[];
  submittedWord: string;
  // Numbers
  steps: EquationStep[];
  availableNumbers: number[];
  currentLeft: number | null;
  currentOp: Operation | null;
  // Numbers picker (selecting phase)
  pickedNumbers: number[];
  numLargePool: number[];
  numSmallPool: number[];
  // Results — one entry per round
  results: (LetterRoundResult | NumberRoundResult | null)[];
}

type GameAction =
  | { type: 'REVEAL_LETTER'; letter: string; isVowel: boolean }
  | { type: 'START_COUNTDOWN' }
  | { type: 'TICK_COUNTDOWN' }
  | { type: 'START_PLAYING' }
  | { type: 'TICK_TIMER' }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'PICK_LETTER'; index: number }
  | { type: 'REMOVE_LAST_LETTER' }
  | { type: 'CLEAR_WORD' }
  | { type: 'SUBMIT_WORD' }
  | { type: 'SET_LETTER_RESULT'; result: LetterRoundResult }
  | { type: 'PICK_LEFT'; value: number }
  | { type: 'PICK_OP'; op: Operation }
  | { type: 'PICK_RIGHT'; value: number }
  | { type: 'UNDO_STEP' }
  | { type: 'CLEAR_NUMBERS' }
  | { type: 'PICK_LARGE_NUMBER' }
  | { type: 'PICK_SMALL_NUMBER' }
  | { type: 'SUBMIT_NUMBERS' }
  | { type: 'SET_NUMBER_RESULT'; result: NumberRoundResult }
  | { type: 'NEXT_ROUND' };

function makeInitialNumberPools(def: RoundDef | undefined): { large: number[]; small: number[] } {
  if (def?.type === 'numbers') {
    return {
      large: shuffleArray(LARGE_POOL_SRC, def.numsSeed),
      small: shuffleArray(SMALL_POOL_SRC, def.numsSeed + 1),
    };
  }
  return {
    large: shuffleArray(LARGE_POOL_SRC, Date.now()),
    small: shuffleArray(SMALL_POOL_SRC, Date.now() + 1),
  };
}

function initState(mode: AppMode): GameState {
  const seed = Date.now();
  let roundDefs: RoundDef[];
  let dailyChallenge: DailyChallenge | null = null;

  if (mode === 'daily') {
    dailyChallenge = getTodaysChallenge();
    roundDefs = dailyToRoundDefs(dailyChallenge);
  } else if (mode === 'practice') {
    roundDefs = generatePracticeRoundDefs(seed);
  } else {
    roundDefs = generateFullGameRoundDefs(seed);
  }

  const { large, small } = makeInitialNumberPools(roundDefs[0]);

  return {
    mode,
    timerEnabled: mode !== 'practice',
    dailyChallenge,
    roundDefs,
    roundIndex: 0,
    phase: 'selecting',
    countdownVal: 3,
    timeRemaining: 60,
    revealedLetters: [],
    vowelCount: 0,
    consonantCount: 0,
    wordIndices: [],
    submittedWord: '',
    steps: [],
    availableNumbers: [],
    currentLeft: null,
    currentOp: null,
    pickedNumbers: [],
    numLargePool: large,
    numSmallPool: small,
    results: Array(roundDefs.length).fill(null) as null[],
  };
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'REVEAL_LETTER':
      return {
        ...state,
        revealedLetters: [...state.revealedLetters, action.letter],
        vowelCount: state.vowelCount + (action.isVowel ? 1 : 0),
        consonantCount: state.consonantCount + (action.isVowel ? 0 : 1),
      };

    case 'START_COUNTDOWN':
      return { ...state, phase: 'countdown', countdownVal: 3 };

    case 'TICK_COUNTDOWN':
      return { ...state, countdownVal: Math.max(0, state.countdownVal - 1) };

    case 'START_PLAYING': {
      const isNumbers = state.roundDefs[state.roundIndex]?.type === 'numbers';
      return {
        ...state,
        phase: 'playing',
        timeRemaining: 60,
        availableNumbers: isNumbers ? [...state.pickedNumbers] : state.availableNumbers,
      };
    }

    case 'TICK_TIMER':
      return { ...state, timeRemaining: Math.max(0, state.timeRemaining - 1) };

    case 'TIMER_EXPIRED':
      return { ...state, phase: 'submitting', timeRemaining: 0 };

    case 'PICK_LETTER': {
      const idx = action.index;
      if (state.wordIndices.includes(idx)) return state; // already used
      return { ...state, wordIndices: [...state.wordIndices, idx] };
    }

    case 'REMOVE_LAST_LETTER':
      return { ...state, wordIndices: state.wordIndices.slice(0, -1) };

    case 'CLEAR_WORD':
      return { ...state, wordIndices: [] };

    case 'SUBMIT_WORD':
      return {
        ...state,
        phase: 'submitting',
        submittedWord: state.wordIndices.map(i => state.revealedLetters[i]).join(''),
        timeRemaining: 0,
      };

    case 'SET_LETTER_RESULT': {
      const newResults = [...state.results];
      newResults[state.roundIndex] = action.result;
      return { ...state, phase: 'results', results: newResults };
    }

    case 'PICK_LEFT':
      return { ...state, currentLeft: action.value, currentOp: null };

    case 'PICK_OP':
      return { ...state, currentOp: action.op };

    case 'PICK_RIGHT': {
      if (state.currentLeft === null || state.currentOp === null) return state;
      const { currentLeft: left, currentOp: op } = state;
      const right = action.value;

      // Validate
      if (op === '÷' && (right === 0 || left % right !== 0)) return state;
      if (op === '-' && left < right) return state;

      const result =
        op === '+' ? left + right :
        op === '-' ? left - right :
        op === '×' ? left * right :
        left / right;

      const step: EquationStep = { left, op, right, result };
      // Remove left and right from available, add result
      const available = [...state.availableNumbers];
      const leftIdx = available.indexOf(left);
      if (leftIdx !== -1) available.splice(leftIdx, 1);
      const rightIdx = available.indexOf(right);
      if (rightIdx !== -1) available.splice(rightIdx, 1);
      available.push(result);

      return {
        ...state,
        steps: [...state.steps, step],
        availableNumbers: available,
        currentLeft: null,
        currentOp: null,
      };
    }

    case 'UNDO_STEP': {
      if (state.currentLeft !== null || state.currentOp !== null) {
        // Just clear current partial step
        return { ...state, currentLeft: null, currentOp: null };
      }
      if (state.steps.length === 0) return state;
      const steps = state.steps.slice(0, -1);
      const last = state.steps[state.steps.length - 1];
      // Restore available numbers
      const available = [...state.availableNumbers];
      const resultIdx = available.indexOf(last.result);
      if (resultIdx !== -1) available.splice(resultIdx, 1);
      available.push(last.left);
      available.push(last.right);
      return { ...state, steps, availableNumbers: available, currentLeft: null, currentOp: null };
    }

    case 'CLEAR_NUMBERS':
      return {
        ...state,
        steps: [],
        availableNumbers: [...state.pickedNumbers],
        currentLeft: null,
        currentOp: null,
      };

    case 'PICK_LARGE_NUMBER': {
      if (state.pickedNumbers.length >= 6 || state.numLargePool.length === 0) return state;
      const [n, ...rest] = state.numLargePool;
      return { ...state, numLargePool: rest, pickedNumbers: [...state.pickedNumbers, n] };
    }

    case 'PICK_SMALL_NUMBER': {
      if (state.pickedNumbers.length >= 6 || state.numSmallPool.length === 0) return state;
      const [n, ...rest] = state.numSmallPool;
      return { ...state, numSmallPool: rest, pickedNumbers: [...state.pickedNumbers, n] };
    }

    case 'SUBMIT_NUMBERS':
      return { ...state, phase: 'submitting', timeRemaining: 0 };

    case 'SET_NUMBER_RESULT': {
      const newResults = [...state.results];
      newResults[state.roundIndex] = action.result;
      return { ...state, phase: 'results', results: newResults };
    }

    case 'NEXT_ROUND': {
      const nextIdx = state.roundIndex + 1;
      const nextDef = state.roundDefs[nextIdx];
      const { large, small } = makeInitialNumberPools(nextDef);
      return {
        ...state,
        roundIndex: nextIdx,
        phase: 'selecting',
        countdownVal: 3,
        timeRemaining: 60,
        revealedLetters: [],
        vowelCount: 0,
        consonantCount: 0,
        wordIndices: [],
        submittedWord: '',
        steps: [],
        availableNumbers: [],
        currentLeft: null,
        currentOp: null,
        pickedNumbers: [],
        numLargePool: large,
        numSmallPool: small,
      };
    }

    default:
      return state;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getRoundLabel(defs: RoundDef[], idx: number): string {
  const def = defs[idx];
  if (!def) return '';
  if (def.type === 'letters') {
    const n = defs.slice(0, idx + 1).filter(d => d.type === 'letters').length;
    return `Letters Round ${n}`;
  }
  const n = defs.slice(0, idx + 1).filter(d => d.type === 'numbers').length;
  return `Numbers Round${n > 1 ? ` ${n}` : ''}`;
}

function getNextButtonLabel(defs: RoundDef[], idx: number): string {
  const next = defs[idx + 1];
  if (!next) return 'See Results →';
  if (next.type === 'letters') {
    const n = defs.slice(0, idx + 2).filter(d => d.type === 'letters').length;
    return `Next: Letters Round ${n} →`;
  }
  const n = defs.slice(0, idx + 2).filter(d => d.type === 'numbers').length;
  return `Next: Numbers Round ${n > 1 ? n + ' ' : ''}→`;
}

// ── Main component (inner — uses useSearchParams) ──────────────────────────────

function GamePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') ?? 'daily') as AppMode;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const [state, dispatch] = useReducer(reducer, mode, initState);

  const { phase, countdownVal, timeRemaining } = state;
  const currentDef = state.roundDefs[state.roundIndex];
  const isLettersRound = currentDef?.type === 'letters';
  const isNumbersRound = currentDef?.type === 'numbers';
  const isLastRound = state.roundIndex >= state.roundDefs.length - 1;
  const currentTarget = isNumbersRound ? (currentDef?.target ?? 999) : 999;

  const LARGE_SET = new Set(state.pickedNumbers.filter(n => [25, 50, 75, 100].includes(n)));

  // ── Reset letter decks at the start of each letters round ───────────────
  useEffect(() => {
    if (isLettersRound && phase === 'selecting') {
      resetDecks(currentDef?.deckSeed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.roundIndex, phase]);

  // ── Countdown (3-2-1) timer ───────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'countdown') return;
    timerRef.current = setInterval(() => dispatch({ type: 'TICK_COUNTDOWN' }), 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  useEffect(() => {
    if (phase === 'countdown' && countdownVal === 0) {
      clearInterval(timerRef.current!);
      setTimeout(() => dispatch({ type: 'START_PLAYING' }), 800);
    }
  }, [countdownVal, phase]);

  // ── Play timer (only when timer enabled) ─────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing' || !state.timerEnabled) return;
    timerRef.current = setInterval(() => dispatch({ type: 'TICK_TIMER' }), 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase, state.timerEnabled]);

  useEffect(() => {
    if (phase === 'playing' && timeRemaining === 0 && state.timerEnabled) {
      clearInterval(timerRef.current!);
      dispatch({ type: 'TIMER_EXPIRED' });
    }
  }, [phase, timeRemaining, state.timerEnabled]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleRevealLetter(type: 'consonant' | 'vowel') {
    const idx = state.revealedLetters.length;
    if (idx >= 9) return;
    const letter = type === 'vowel' ? pickVowel() : pickConsonant();
    dispatch({ type: 'REVEAL_LETTER', letter, isVowel: type === 'vowel' });
    if (idx + 1 === 9) {
      setTimeout(() => dispatch({ type: 'START_COUNTDOWN' }), 300);
    }
  }

  const handleSubmitWord = useCallback(async () => {
    const word = state.wordIndices.map(i => state.revealedLetters[i]).join('');
    setIsValidating(true);

    let valid = false;
    if (word.length >= 2) {
      valid = await isValidWord(word, state.revealedLetters);
    }
    const bestWords = await findBestWords(state.revealedLetters, 4);
    const bestLength = bestWords[0]?.word.length ?? 0;
    const userScore = valid ? scoreLetterRound(word.length) : 0;
    const maxScore = scoreLetterRound(bestLength);

    const result: LetterRoundResult = {
      userWord: word,
      userWordValid: valid,
      userScore,
      bestWords: bestWords.map(w => ({ word: w.word })),
      maxPossibleScore: maxScore,
    };
    dispatch({ type: 'SET_LETTER_RESULT', result });
    setIsValidating(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.wordIndices, state.revealedLetters]);

  const handleSkipLetterRound = useCallback(async () => {
    const bestWords = await findBestWords(state.revealedLetters, 4);
    const bestLength = bestWords[0]?.word.length ?? 0;
    const result: LetterRoundResult = {
      userWord: '',
      userWordValid: false,
      userScore: 0,
      bestWords: bestWords.map(w => ({ word: w.word })),
      maxPossibleScore: scoreLetterRound(bestLength),
    };
    dispatch({ type: 'SET_LETTER_RESULT', result });
  }, [state.revealedLetters]);

  function handleSubmitNumbers() {
    const { steps } = state;
    const lastStep = steps[steps.length - 1];
    const userResult = lastStep?.result ?? null;
    const diff = userResult !== null ? Math.abs(userResult - currentTarget) : Infinity;
    const userScore = isFinite(diff) ? scoreNumbersRound(diff) : 0;

    const solutionResult = solveNumbers(state.pickedNumbers, currentTarget);

    const result: NumberRoundResult = {
      userResult,
      userSteps: steps,
      userScore,
      solution: solutionResult.steps.length > 0 ? solutionResult.steps : null,
      target: currentTarget,
    };
    dispatch({ type: 'SET_NUMBER_RESULT', result });
  }

  function handleNextOrFinish() {
    if (!isLastRound) {
      dispatch({ type: 'NEXT_ROUND' });
      return;
    }

    if (state.mode === 'daily') {
      const letterResults = state.results.filter((_, i) => state.roundDefs[i].type === 'letters') as LetterRoundResult[];
      const numberResults = state.results.filter((_, i) => state.roundDefs[i].type === 'numbers') as NumberRoundResult[];
      const lr1 = letterResults[0]; const lr2 = letterResults[1];
      const nr = numberResults[0];
      const s1 = lr1?.userScore ?? 0; const m1 = lr1?.maxPossibleScore ?? 9;
      const s2 = lr2?.userScore ?? 0; const m2 = lr2?.maxPossibleScore ?? 9;
      const ns = nr?.userScore ?? 0;
      recordDailyPlay({
        dateKey: getTodayKey(),
        lettersScore1: s1, lettersMax1: m1, letterWord1: lr1?.userWordValid ? lr1.userWord : undefined,
        lettersScore2: s2, lettersMax2: m2, letterWord2: lr2?.userWordValid ? lr2.userWord : undefined,
        numbersScore: ns, numbersMax: 10,
        lettersScore: s1 + s2, lettersMax: m1 + m2,
        totalScore: s1 + s2 + ns, completed: true,
      });
      router.push('/results');
    } else {
      sessionStorage.setItem('gameResults', JSON.stringify({
        mode: state.mode,
        results: state.results,
        roundDefs: state.roundDefs,
      }));
      router.push('/game-summary');
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const wordLetters = state.wordIndices.map(i => state.revealedLetters[i]);
  const usedLetterIndices = state.wordIndices;

  const usedNumberIndices = new Set<number>();
  {
    const pool = [...state.pickedNumbers];
    for (const step of state.steps) {
      const li = pool.indexOf(step.left);
      if (li !== -1) { usedNumberIndices.add(li); pool.splice(li, 1); }
      const ri = pool.indexOf(step.right);
      if (ri !== -1) { usedNumberIndices.add(ri); pool.splice(ri, 1); }
      pool.push(step.result);
    }
  }

  const roundLabel = getRoundLabel(state.roundDefs, state.roundIndex);
  const modeBadge = state.mode === 'practice' ? 'Practice' : state.mode === 'full' ? 'Full Game' : '';

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-4 max-w-md mx-auto gap-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">← Home</Link>
        <div className="flex flex-col items-center">
          <span className="font-rajdhani text-sm text-slate-300">{roundLabel}</span>
          {modeBadge && <span className="text-[10px] text-[#f6c90e] uppercase tracking-widest">{modeBadge}</span>}
        </div>
        <span className="text-xs text-slate-500">{state.roundIndex + 1}/{state.roundDefs.length}</span>
      </div>

      {/* ── SELECTING — Letters ── */}
      {phase === 'selecting' && isLettersRound && (
        <div className="w-full flex flex-col gap-6 items-center">
          <p className="text-slate-400 text-sm">Choose your 9 letters</p>
          <LetterBoard
            letters={state.revealedLetters}
            usedIndices={[]}
            onPickLetter={() => {}}
            phase="selecting"
          />
          {state.revealedLetters.length < 9 && (
            <LetterSelector
              onPick={handleRevealLetter}
              letterCount={state.revealedLetters.length}
              vowelCount={state.vowelCount}
              consonantCount={state.consonantCount}
            />
          )}
        </div>
      )}

      {phase === 'selecting' && isNumbersRound && (
        <div className="w-full flex flex-col gap-5 items-center">
          <div className="text-center">
            <p className="text-slate-300 text-sm font-semibold">Pick your 6 numbers</p>
            <p className="text-xs text-slate-500 mt-1">
              {state.pickedNumbers.length}/6 chosen &bull; up to 4 large (25–100)
            </p>
          </div>

          {/* Target */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-slate-400 uppercase tracking-widest">Target</p>
            <div className="bg-[#1a3560] border-2 border-[#f6c90e] rounded-2xl px-8 py-3 shadow-[0_0_20px_rgba(246,201,14,0.25)]">
              <span className="font-rajdhani font-black text-4xl text-[#f6c90e] tracking-wider">
                {currentTarget}
              </span>
            </div>
          </div>

          {/* Picked number slots */}
          <div className="flex gap-2 flex-wrap justify-center min-h-[3.5rem]">
            {state.pickedNumbers.map((n, i) => {
              const isLarge = [25, 50, 75, 100].includes(n);
              return (
                <div key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base border-2 ${isLarge ? 'bg-[#2c1e00] border-[#f6c90e] text-[#f6c90e]' : 'bg-[#1a3560] border-[#2c5fa8] text-white'}`}>
                  {n}
                </div>
              );
            })}
            {Array.from({ length: 6 - state.pickedNumbers.length }).map((_, i) => (
              <div key={`empty-${i}`} className="w-12 h-12 rounded-xl border-2 border-dashed border-[#1a3560]" />
            ))}
          </div>

          {/* Large / Small buttons */}
          <div className="flex gap-3">
            {(() => {
              const largeUsed = state.pickedNumbers.filter(n => [25, 50, 75, 100].includes(n)).length;
              const canLarge = state.pickedNumbers.length < 6 && state.numLargePool.length > 0 && largeUsed < 4;
              return (
                <button
                  onClick={() => dispatch({ type: 'PICK_LARGE_NUMBER' })}
                  disabled={!canLarge}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-150 ${
                    canLarge
                      ? 'bg-[#2c1e00] border-2 border-[#f6c90e] text-[#f6c90e] hover:bg-[#3e2b00] active:scale-95'
                      : 'bg-[#0f1f38] border-2 border-[#1a2f4e] text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <span className="block text-lg font-bold">25–100</span>
                  Large
                </button>
              );
            })()}
            {(() => {
              const canSmall = state.pickedNumbers.length < 6 && state.numSmallPool.length > 0;
              return (
                <button
                  onClick={() => dispatch({ type: 'PICK_SMALL_NUMBER' })}
                  disabled={!canSmall}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-150 ${
                    canSmall
                      ? 'bg-[#1e4176] border-2 border-[#2c5fa8] text-white hover:border-[#f6c90e] hover:bg-[#2c5fa8] active:scale-95'
                      : 'bg-[#0f1f38] border-2 border-[#1a2f4e] text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <span className="block text-lg font-bold">1–10</span>
                  Small
                </button>
              );
            })()}
          </div>

          <button
            onClick={() => dispatch({ type: 'START_COUNTDOWN' })}
            disabled={state.pickedNumbers.length < 6}
            className={`w-full py-3 rounded-2xl font-bold font-rajdhani uppercase tracking-wide transition-all active:scale-95 ${
              state.pickedNumbers.length === 6
                ? 'bg-[#f6c90e] text-[#070e1c]'
                : 'bg-[#0f1f38] text-slate-600 cursor-not-allowed border border-[#1a2f4e]'
            }`}
          >
            Start Round
          </button>
        </div>
      )}

      {/* ── COUNTDOWN ── */}
      {phase === 'countdown' && (
        <div className="flex-1 flex items-center justify-center">
          <span className="font-rajdhani font-black text-9xl text-[#f6c90e] animate-bounce-in">
            {countdownVal === 0 ? 'GO!' : countdownVal}
          </span>
        </div>
      )}

      {/* ── PLAYING — Letters ── */}
      {phase === 'playing' && isLettersRound && (
        <div className="w-full flex flex-col gap-4">
          {state.timerEnabled ? (
            <CountdownClock totalSeconds={60} remaining={timeRemaining} />
          ) : (
            <div className="text-center text-sm text-[#f6c90e] bg-[#1a3560]/40 rounded-xl py-2">Practice Mode — No Time Limit</div>
          )}
          <LetterBoard
            letters={state.revealedLetters}
            usedIndices={usedLetterIndices}
            onPickLetter={(idx) => dispatch({ type: 'PICK_LETTER', index: idx })}
            phase="playing"
          />
          <WordBuilder
            wordLetters={wordLetters}
            wordIndices={usedLetterIndices}
            onRemoveLast={() => dispatch({ type: 'REMOVE_LAST_LETTER' })}
            onClear={() => dispatch({ type: 'CLEAR_WORD' })}
            onSubmit={() => dispatch({ type: 'SUBMIT_WORD' })}
          />
          {!state.timerEnabled && (
            <button
              onClick={() => dispatch({ type: 'TIMER_EXPIRED' })}
              className="w-full py-3 rounded-2xl border border-[#f6c90e]/30 text-[#f6c90e] font-semibold font-rajdhani transition-all active:scale-95 hover:bg-[#f6c90e]/10"
            >
              Done — Submit Word
            </button>
          )}
        </div>
      )}

      {/* ── PLAYING — Numbers ── */}
      {phase === 'playing' && isNumbersRound && (
        <div className="w-full flex flex-col gap-4">
          {state.timerEnabled ? (
            <CountdownClock totalSeconds={60} remaining={timeRemaining} />
          ) : (
            <div className="text-center text-sm text-[#f6c90e] bg-[#1a3560]/40 rounded-xl py-2">Practice Mode — No Time Limit</div>
          )}
          <NumberBoard
            numbers={state.pickedNumbers}
            largeNumbers={LARGE_SET}
            usedIndices={[...usedNumberIndices]}
            target={currentTarget}
            onPickNumber={() => {}}
            phase="playing"
          />
          <NumberBuilder
            numbers={state.pickedNumbers}
            usedIndices={[...usedNumberIndices]}
            availableNumbers={state.availableNumbers}
            currentLeft={state.currentLeft}
            currentOp={state.currentOp}
            steps={state.steps}
            target={currentTarget}
            onPickLeft={(n) => dispatch({ type: 'PICK_LEFT', value: n })}
            onPickOp={(op) => dispatch({ type: 'PICK_OP', op })}
            onPickRight={(n) => dispatch({ type: 'PICK_RIGHT', value: n })}
            onUndo={() => dispatch({ type: 'UNDO_STEP' })}
            onClear={() => dispatch({ type: 'CLEAR_NUMBERS' })}
          />
          <button
            onClick={() => dispatch({ type: 'SUBMIT_NUMBERS' })}
            className="w-full py-3 rounded-2xl bg-[#f6c90e] text-[#070e1c] font-bold font-rajdhani uppercase tracking-wide transition-all active:scale-95"
          >
            Lock In Answer
          </button>
        </div>
      )}

      {/* ── SUBMITTING — Letters ── */}
      {phase === 'submitting' && isLettersRound && (
        <div className="w-full flex flex-col gap-4">
          <p className="text-center text-slate-400">
            {!state.timerEnabled ? 'Confirm your word' : timeRemaining === 0 ? "Time's up!" : 'Confirm your word'}
          </p>
          <LetterBoard
            letters={state.revealedLetters}
            usedIndices={usedLetterIndices}
            onPickLetter={(idx) => dispatch({ type: 'PICK_LETTER', index: idx })}
            phase="playing"
          />
          <WordBuilder
            wordLetters={wordLetters}
            wordIndices={usedLetterIndices}
            onRemoveLast={() => dispatch({ type: 'REMOVE_LAST_LETTER' })}
            onClear={() => dispatch({ type: 'CLEAR_WORD' })}
            onSubmit={handleSubmitWord}
          />
          {wordLetters.length === 0 && (
            <button
              onClick={handleSkipLetterRound}
              className="w-full py-3 rounded-2xl border border-[#1a3560] text-slate-400 font-semibold transition-all active:scale-95"
            >
              Skip (no word found)
            </button>
          )}
          {isValidating && (
            <p className="text-center text-[#f6c90e] font-rajdhani animate-pulse">Checking word…</p>
          )}
        </div>
      )}

      {/* ── SUBMITTING — Numbers ── */}
      {phase === 'submitting' && isNumbersRound && (
        <div className="w-full flex flex-col gap-4">
          <p className="text-center text-slate-400">Confirm your answer</p>
          <NumberBoard
            numbers={state.pickedNumbers}
            largeNumbers={LARGE_SET}
            usedIndices={[...usedNumberIndices]}
            target={currentTarget}
            onPickNumber={() => {}}
            phase="playing"
          />
          {state.steps.length > 0 && (
            <div className="rounded-xl bg-[#0a1628] border border-[#1a3560] p-3">
              {state.steps.map((s, i) => (
                <p key={i} className="text-sm font-rajdhani text-slate-300">
                  {s.left} {s.op} {s.right} = <span className={s.result === currentTarget ? 'text-green-400 font-bold' : 'text-white'}>{s.result}</span>
                </p>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => dispatch({ type: 'CLEAR_NUMBERS' })}
              className="flex-1 py-3 rounded-2xl border border-[#1a3560] text-slate-300 font-semibold transition-all active:scale-95"
            >
              Clear
            </button>
            <button
              onClick={handleSubmitNumbers}
              className="flex-1 py-3 rounded-2xl bg-[#f6c90e] text-[#070e1c] font-bold font-rajdhani uppercase tracking-wide transition-all active:scale-95"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {/* ── RESULTS ── */}
      {phase === 'results' && isLettersRound && (
        <div className="w-full flex flex-col gap-4">
          <LetterRoundResultPanel
            result={state.results[state.roundIndex] as LetterRoundResult}
            roundNum={state.roundDefs.slice(0, state.roundIndex + 1).filter(d => d.type === 'letters').length}
          />
          <button
            onClick={handleNextOrFinish}
            className="w-full py-3 rounded-2xl bg-[#f6c90e] text-[#070e1c] font-bold font-rajdhani uppercase tracking-wide transition-all active:scale-95"
          >
            {getNextButtonLabel(state.roundDefs, state.roundIndex)}
          </button>
        </div>
      )}

      {phase === 'results' && isNumbersRound && (
        <div className="w-full flex flex-col gap-4">
          <NumberRoundResultPanel result={state.results[state.roundIndex] as NumberRoundResult} />
          <button
            onClick={handleNextOrFinish}
            className="w-full py-3 rounded-2xl bg-[#f6c90e] text-[#070e1c] font-bold font-rajdhani uppercase tracking-wide transition-all active:scale-95"
          >
            {getNextButtonLabel(state.roundDefs, state.roundIndex)}
          </button>
        </div>
      )}
    </main>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070e1c] flex items-center justify-center">
        <span className="text-slate-400 font-rajdhani">Loading…</span>
      </div>
    }>
      <GamePageContent />
    </Suspense>
  );
}