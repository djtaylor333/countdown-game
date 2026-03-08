'use client';

import { useEffect, useRef } from 'react';
import type { LetterRoundResult, NumberRoundResult } from '../logic/types';
import { formatSolution } from '../logic/numbers';

interface LettersProps {
  type: 'letters';
  result: LetterRoundResult;
  onDismiss: () => void;
}

interface NumbersProps {
  type: 'numbers';
  result: NumberRoundResult;
  onDismiss: () => void;
}

type Props = LettersProps | NumbersProps;

/**
 * Full-screen overlay modal shown when the 60-second countdown reaches zero.
 * Reveals the best available answers and lets the player continue.
 */
export default function TimesUpModal(props: Props) {
  const { onDismiss } = props;
  const btnRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the dismiss button so pressing Enter advances the game
  useEffect(() => {
    btnRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-[#070e1c]/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Time's Up"
      onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}
    >
      <div className="w-full max-w-md rounded-3xl bg-[#0f1f38] border border-[#f6c90e]/40 shadow-2xl shadow-black/60 p-6 flex flex-col gap-5 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-5xl" aria-hidden>⏰</span>
          <h2 className="font-rajdhani font-black text-3xl text-[#f6c90e] tracking-wide">
            Time&apos;s Up!
          </h2>
          <p className="text-sm text-slate-400">
            {props.type === 'letters' ? 'Here are the best words available' : 'Here is the solution'}
          </p>
        </div>

        {/* Content */}
        {props.type === 'letters' && (
          <LettersReveal result={props.result} />
        )}
        {props.type === 'numbers' && (
          <NumbersReveal result={props.result} />
        )}

        {/* Dismiss */}
        <button
          ref={btnRef}
          onClick={onDismiss}
          className="w-full py-3 rounded-2xl bg-[#f6c90e] text-[#070e1c] font-bold font-rajdhani uppercase tracking-wide text-lg transition-all active:scale-95 hover:bg-[#e6ba0e] focus:outline-none focus:ring-2 focus:ring-[#f6c90e]/60"
        >
          See Results
        </button>
      </div>
    </div>
  );
}

// ── Letters content ───────────────────────────────────────────────────────────

function LettersReveal({ result }: { result: LetterRoundResult }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Player's word */}
      <div className="rounded-xl bg-[#0a1628] border border-[#1a3560] px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Your word</p>
          <span className="font-rajdhani font-bold text-xl tracking-widest text-white">
            {result.userWord || '—'}
          </span>
        </div>
        <div className="text-right">
          {result.userWordValid ? (
            <span className="text-green-400 font-bold text-sm">✓ +{result.userScore} pts</span>
          ) : result.userWord ? (
            <span className="text-red-400 text-sm">✗ Invalid</span>
          ) : (
            <span className="text-slate-500 text-sm">No word</span>
          )}
        </div>
      </div>

      {/* Best words */}
      {result.bestWords.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Best available</p>
          <div className="flex flex-col gap-2">
            {result.bestWords.slice(0, 3).map((w, i) => (
              <div
                key={`${w.word}-${i}`}
                className={`rounded-xl px-4 py-2.5 border flex items-center justify-between ${
                  i === 0
                    ? 'border-[#f6c90e]/50 bg-[#f6c90e]/5'
                    : 'border-[#1a3560] bg-[#0a1628]'
                }`}
              >
                <span className="font-rajdhani font-bold text-lg tracking-widest text-[#f6c90e]">
                  {w.word}
                </span>
                <span className="text-sm text-slate-400">
                  {w.word.length === 9 ? (
                    <span className="bg-[#f6c90e] text-[#070e1c] px-1.5 py-0.5 rounded text-xs font-bold">FULL</span>
                  ) : (
                    <span>{w.word.length} pts</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Numbers content ───────────────────────────────────────────────────────────

function NumbersReveal({ result }: { result: NumberRoundResult }) {
  const diff = result.userResult !== null
    ? Math.abs(result.userResult - result.target)
    : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Target */}
      <div className="flex items-center justify-center gap-3">
        <span className="text-xs text-slate-500 uppercase tracking-wide">Target:</span>
        <span className="font-rajdhani font-black text-3xl text-[#f6c90e]">{result.target}</span>
      </div>

      {/* Player's answer */}
      <div className="rounded-xl bg-[#0a1628] border border-[#1a3560] px-4 py-3">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Your answer</p>
        {result.userResult !== null ? (
          <div className="flex items-center gap-2">
            <span className={`font-rajdhani font-bold text-xl ${diff === 0 ? 'text-green-400' : diff !== null && diff <= 10 ? 'text-yellow-400' : 'text-white'}`}>
              {result.userResult}
            </span>
            {diff !== null && diff > 0 && (
              <span className="text-sm text-yellow-400">({diff} away)</span>
            )}
            {diff === 0 && <span className="text-green-400 text-sm">✓ Exact!</span>}
          </div>
        ) : (
          <span className="text-slate-500 text-sm italic">No answer submitted</span>
        )}
      </div>

      {/* Solution */}
      {result.solution && result.solution.length > 0 && (
        <div className="rounded-xl border border-[#f6c90e]/30 bg-[#f6c90e]/5 px-4 py-3">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Solution</p>
          <p className="text-sm font-rajdhani text-slate-200 whitespace-pre-wrap leading-relaxed">
            {formatSolution(result.solution)}
          </p>
          <span className="font-rajdhani font-bold text-lg text-[#f6c90e] mt-1 block">
            = {result.solution[result.solution.length - 1].result}
          </span>
        </div>
      )}
    </div>
  );
}
