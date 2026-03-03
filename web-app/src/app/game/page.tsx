'use client';

import { useEffect, useCallback, useReducer, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTodaysChallenge, getTodayKey } from '../../logic/dailyChallenge';
import { isValidWord, findBestWords, scoreLetterRound } from '../../logic/letters';
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

type RoundPhase = 'selecting' | 'countdown' | 'playing' | 'submitting' | 'results';
type Round = 0 | 1 | 2; // 0=letters1, 1=letters2, 2=numbers

interface GameState {
  challenge: DailyChallenge;
  round: Round;
  phase: RoundPhase;
  countdownVal: number;
  timeRemaining: number;
  // Letters
  revealedLetters: string[];
  vowelCount: number;
  consonantCount: number;
  wordIndices: number[];      // indices into revealedLetters for current word
  submittedWord: string;
  // Numbers
  steps: EquationStep[];
  availableNumbers: number[];  // changes as steps complete
  currentLeft: number | null;
  currentOp: Operation | null;
  // Results
  letterResult1: LetterRoundResult | null;
  letterResult2: LetterRoundResult | null;
  numberResult: NumberRoundResult | null;
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
  | { type: 'SUBMIT_NUMBERS' }
  | { type: 'SET_NUMBER_RESULT'; result: NumberRoundResult }
  | { type: 'NEXT_ROUND' };

function initState(challenge: DailyChallenge): GameState {
  return {
    challenge,
    round: 0,
    phase: 'selecting',
    countdownVal: 3,
    timeRemaining: 30,
    revealedLetters: [],
    vowelCount: 0,
    consonantCount: 0,
    wordIndices: [],
    submittedWord: '',
    steps: [],
    availableNumbers: [...challenge.numbers],
    currentLeft: null,
    currentOp: null,
    letterResult1: null,
    letterResult2: null,
    numberResult: null,
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

    case 'START_PLAYING':
      return { ...state, phase: 'playing', timeRemaining: 30 };

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

    case 'SET_LETTER_RESULT':
      return {
        ...state,
        phase: 'results',
        letterResult1: state.round === 0 ? action.result : state.letterResult1,
        letterResult2: state.round === 1 ? action.result : state.letterResult2,
      };

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
        availableNumbers: [...state.challenge.numbers],
        currentLeft: null,
        currentOp: null,
      };

    case 'SUBMIT_NUMBERS':
      return { ...state, phase: 'submitting', timeRemaining: 0 };

    case 'SET_NUMBER_RESULT':
      return { ...state, phase: 'results', numberResult: action.result };

    case 'NEXT_ROUND': {
      const nextRound = (state.round < 2 ? state.round + 1 : state.round) as Round;
      return {
        ...state,
        round: nextRound,
        phase: 'selecting',
        countdownVal: 3,
        timeRemaining: 30,
        revealedLetters: [],
        vowelCount: 0,
        consonantCount: 0,
        wordIndices: [],
        submittedWord: '',
        // Re-init numbers if going to numbers round
        steps: [],
        availableNumbers: [...state.challenge.numbers],
        currentLeft: null,
        currentOp: null,
      };
    }

    default:
      return state;
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function GamePage() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const [state, dispatch] = useReducer(reducer, null, () => {
    const challenge = getTodaysChallenge();
    return initState(challenge);
  });

  const { challenge, round, phase, countdownVal, timeRemaining } = state;

  const LARGE_SET = new Set(challenge.numbers.filter(n => [25, 50, 75, 100].includes(n)));

  // ── Countdown (3-2-1) timer ───────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'countdown') return;
    timerRef.current = setInterval(() => dispatch({ type: 'TICK_COUNTDOWN' }), 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  useEffect(() => {
    if (phase === 'countdown' && countdownVal === 0) {
      clearInterval(timerRef.current!);
      // Brief pause so 'GO!' shows before timer starts
      setTimeout(() => dispatch({ type: 'START_PLAYING' }), 800);
    }
  }, [countdownVal, phase]);

  // ── Play timer ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => dispatch({ type: 'TICK_TIMER' }), 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  useEffect(() => {
    if (phase === 'playing' && timeRemaining === 0) {
      clearInterval(timerRef.current!);
      dispatch({ type: 'TIMER_EXPIRED' });
    }
  }, [phase, timeRemaining]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleRevealLetter(type: 'consonant' | 'vowel') {
    const pool = round === 0 ? challenge.letterRound1 : challenge.letterRound2;
    const idx = state.revealedLetters.length;
    if (idx >= 9) return;
    const letter = pool[idx];
    const isVowel = type === 'vowel';
    dispatch({ type: 'REVEAL_LETTER', letter, isVowel });
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

  // Submit empty word (skip)
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
    const { steps, challenge: c } = state;
    const lastStep = steps[steps.length - 1];
    const userResult = lastStep?.result ?? null;
    const diff = userResult !== null ? Math.abs(userResult - c.target) : Infinity;
    const userScore = isFinite(diff) ? scoreNumbersRound(diff) : 0;

    const solutionResult = solveNumbers(c.numbers, c.target);

    const result: NumberRoundResult = {
      userResult,
      userSteps: steps,
      userScore,
      solution: solutionResult.steps.length > 0 ? solutionResult.steps : null,
      target: c.target,
    };
    dispatch({ type: 'SET_NUMBER_RESULT', result });
  }

  function handleNextOrFinish() {
    if (round < 2) {
      dispatch({ type: 'NEXT_ROUND' });
    } else {
      // Save and go to results
      const { letterResult1, letterResult2, numberResult } = state;
      const s1 = letterResult1?.userScore ?? 0;
      const m1 = letterResult1?.maxPossibleScore ?? 9;
      const s2 = letterResult2?.userScore ?? 0;
      const m2 = letterResult2?.maxPossibleScore ?? 9;
      const ns = numberResult?.userScore ?? 0;

      recordDailyPlay({
        dateKey: getTodayKey(),
        lettersScore1: s1,
        lettersMax1: m1,
        letterWord1: letterResult1?.userWordValid ? letterResult1.userWord : undefined,
        lettersScore2: s2,
        lettersMax2: m2,
        letterWord2: letterResult2?.userWordValid ? letterResult2.userWord : undefined,
        numbersScore: ns,
        numbersMax: 10,
        lettersScore: s1 + s2,
        lettersMax: m1 + m2,
        totalScore: s1 + s2 + ns,
        completed: true,
      });
      router.push('/results');
    }
  }

  // ── Current word derived values ───────────────────────────────────────────

  const wordLetters = state.wordIndices.map(i => state.revealedLetters[i]);
  const usedLetterIndices = state.wordIndices;

  // ── usedOriginalIndices for NumberBoard ──────────────────────────────────
  // Rough: compare original numbers count with available numbers count
  const usedNumberIndices = new Set<number>();
  // Track by rebuilding from steps
  {
    const pool = [...challenge.numbers];
    for (const step of state.steps) {
      const li = pool.indexOf(step.left);
      if (li !== -1) { usedNumberIndices.add(li); pool.splice(li, 1); }
      const ri = pool.indexOf(step.right);
      if (ri !== -1) { usedNumberIndices.add(ri); pool.splice(ri, 1); }
      pool.push(step.result);
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  const roundLabel = round === 2 ? 'Numbers Round' : `Letters Round ${round + 1}`;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-4 max-w-md mx-auto gap-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">← Home</Link>
        <span className="font-orbitron text-sm text-slate-300">{roundLabel}</span>
        <span className="text-xs text-slate-500">{round + 1}/3</span>
      </div>

      {/* ── SELECTING ── */}
      {phase === 'selecting' && round < 2 && (
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

      {phase === 'selecting' && round === 2 && (
        <div className="w-full flex flex-col gap-6 items-center">
          <p className="text-slate-400 text-sm">Today&apos;s Numbers Round</p>
          <NumberBoard
            numbers={challenge.numbers}
            largeNumbers={LARGE_SET}
            usedIndices={[]}
            target={challenge.target}
            onPickNumber={() => {}}
            phase="playing"
          />
          <button
            onClick={() => dispatch({ type: 'START_COUNTDOWN' })}
            className="w-full py-3 rounded-2xl bg-[#f6c90e] text-[#070e1c] font-bold font-orbitron uppercase tracking-wide transition-all active:scale-95"
          >
            Start Round
          </button>
        </div>
      )}

      {/* ── COUNTDOWN ── */}
      {phase === 'countdown' && (
        <div className="flex-1 flex items-center justify-center">
          <span className="font-orbitron font-black text-9xl text-[#f6c90e] animate-bounce-in">
            {countdownVal === 0 ? 'GO!' : countdownVal}
          </span>
        </div>
      )}

      {/* ── PLAYING — Letters ── */}
      {phase === 'playing' && round < 2 && (
        <div className="w-full flex flex-col gap-4">
          <CountdownClock totalSeconds={30} remaining={timeRemaining} />
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
        </div>
      )}

      {/* ── PLAYING — Numbers ── */}
      {phase === 'playing' && round === 2 && (
        <div className="w-full flex flex-col gap-4">
          <CountdownClock totalSeconds={30} remaining={timeRemaining} />
          <NumberBoard
            numbers={challenge.numbers}
            largeNumbers={LARGE_SET}
            usedIndices={[...usedNumberIndices]}
            target={challenge.target}
            onPickNumber={() => {}}
            phase="playing"
          />
          <NumberBuilder
            numbers={challenge.numbers}
            usedIndices={[...usedNumberIndices]}
            availableNumbers={state.availableNumbers}
            currentLeft={state.currentLeft}
            currentOp={state.currentOp}
            steps={state.steps}
            target={challenge.target}
            onPickLeft={(n) => dispatch({ type: 'PICK_LEFT', value: n })}
            onPickOp={(op) => dispatch({ type: 'PICK_OP', op })}
            onPickRight={(n) => dispatch({ type: 'PICK_RIGHT', value: n })}
            onUndo={() => dispatch({ type: 'UNDO_STEP' })}
            onClear={() => dispatch({ type: 'CLEAR_NUMBERS' })}
          />
          <button
            onClick={() => dispatch({ type: 'SUBMIT_NUMBERS' })}
            className="w-full py-3 rounded-2xl bg-[#f6c90e] text-[#070e1c] font-bold font-orbitron uppercase tracking-wide transition-all active:scale-95"
          >
            Lock In Answer
          </button>
        </div>
      )}

      {/* ── SUBMITTING — Letters ── */}
      {phase === 'submitting' && round < 2 && (
        <div className="w-full flex flex-col gap-4">
          <p className="text-center text-slate-400">
            {timeRemaining === 0 ? "Time's up!" : 'Confirm your word'}
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
            <p className="text-center text-[#f6c90e] font-orbitron animate-pulse">Checking word…</p>
          )}
        </div>
      )}

      {/* ── SUBMITTING — Numbers ── */}
      {phase === 'submitting' && round === 2 && (
        <div className="w-full flex flex-col gap-4">
          <p className="text-center text-slate-400">Confirm your answer</p>
          <NumberBoard
            numbers={challenge.numbers}
            largeNumbers={LARGE_SET}
            usedIndices={[...usedNumberIndices]}
            target={challenge.target}
            onPickNumber={() => {}}
            phase="playing"
          />
          {state.steps.length > 0 && (
            <div className="rounded-xl bg-[#0a1628] border border-[#1a3560] p-3">
              {state.steps.map((s, i) => (
                <p key={i} className="text-sm font-orbitron text-slate-300">
                  {s.left} {s.op} {s.right} = <span className={s.result === challenge.target ? 'text-green-400 font-bold' : 'text-white'}>{s.result}</span>
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
              className="flex-1 py-3 rounded-2xl bg-[#f6c90e] text-[#070e1c] font-bold font-orbitron uppercase tracking-wide transition-all active:scale-95"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {/* ── RESULTS ── */}
      {phase === 'results' && round < 2 && (
        <div className="w-full flex flex-col gap-4">
          <LetterRoundResultPanel
            result={round === 0 ? state.letterResult1! : state.letterResult2!}
            roundNum={round + 1}
          />
          <button
            onClick={handleNextOrFinish}
            className="w-full py-3 rounded-2xl bg-[#f6c90e] text-[#070e1c] font-bold font-orbitron uppercase tracking-wide transition-all active:scale-95"
          >
            {round === 0 ? 'Next: Letters Round 2 →' : 'Next: Numbers Round →'}
          </button>
        </div>
      )}

      {phase === 'results' && round === 2 && (
        <div className="w-full flex flex-col gap-4">
          <NumberRoundResultPanel result={state.numberResult!} />
          <button
            onClick={handleNextOrFinish}
            className="w-full py-3 rounded-2xl bg-[#f6c90e] text-[#070e1c] font-bold font-orbitron uppercase tracking-wide transition-all active:scale-95"
          >
            See Final Results →
          </button>
        </div>
      )}
    </main>
  );
}

