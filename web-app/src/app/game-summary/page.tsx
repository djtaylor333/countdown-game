'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { LetterRoundResult, NumberRoundResult } from '../../logic/types';
import type { RoundDef } from '../../logic/dailyChallenge';
import type { AppMode } from '../game/page';

interface GameResultsData {
  mode: AppMode;
  results: (LetterRoundResult | NumberRoundResult | null)[];
  roundDefs: RoundDef[];
}

function isLetterResult(r: LetterRoundResult | NumberRoundResult | null): r is LetterRoundResult {
  return r !== null && 'userWord' in r;
}

function isNumberResult(r: LetterRoundResult | NumberRoundResult | null): r is NumberRoundResult {
  return r !== null && 'target' in r;
}

function scoreColor(score: number, max: number): string {
  if (max === 0) return 'text-slate-400';
  const pct = score / max;
  if (pct >= 0.8) return 'text-green-400';
  if (pct >= 0.5) return 'text-[#f6c90e]';
  return 'text-red-400';
}

export default function GameSummaryPage() {
  const [data, setData] = useState<GameResultsData | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('gameResults');
      if (raw) setData(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  if (!data) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 gap-6">
        <p className="text-slate-400">No results found.</p>
        <Link href="/" className="px-6 py-3 rounded-2xl bg-[#f6c90e] text-[#070e1c] font-bold font-rajdhani uppercase">
          Go Home
        </Link>
      </main>
    );
  }

  const { mode, results, roundDefs } = data;
  const totalScore = results.reduce((sum, r) => sum + (r?.userScore ?? 0), 0);
  const maxScore = results.reduce((sum, r, i) => {
    const def = roundDefs[i];
    if (def?.type === 'letters') return sum + ((r as LetterRoundResult | null)?.maxPossibleScore ?? 9);
    if (def?.type === 'numbers') return sum + 10;
    return sum;
  }, 0);

  const modeLabel = mode === 'practice' ? 'Practice Game' : 'Full Game';
  const letterResults = results.filter((_, i) => roundDefs[i]?.type === 'letters') as (LetterRoundResult | null)[];
  const numberResults = results.filter((_, i) => roundDefs[i]?.type === 'numbers') as (NumberRoundResult | null)[];
  const lettersScore = letterResults.reduce((s, r) => s + (r?.userScore ?? 0), 0);
  const numbersScore = numberResults.reduce((s, r) => s + (r?.userScore ?? 0), 0);

  function getRoundLabel(def: RoundDef, idx: number): string {
    if (def.type === 'letters') {
      const n = roundDefs.slice(0, idx + 1).filter(d => d.type === 'letters').length;
      return `Letters Round ${n}`;
    }
    const n = roundDefs.slice(0, idx + 1).filter(d => d.type === 'numbers').length;
    return `Numbers Round${n > 1 ? ` ${n}` : ''}`;
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8 max-w-md mx-auto gap-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-1 mt-2">
        <h1 className="font-rajdhani font-black text-3xl text-white">{modeLabel} <span className="text-[#f6c90e]">Complete!</span></h1>
        <p className="text-sm text-slate-400">{mode === 'full' ? '9 rounds finished' : '3 rounds finished'}</p>
      </div>

      {/* Total score */}
      <div className="w-full rounded-2xl bg-[#0f1f38] border border-[#1a3560] p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Total Score</p>
          <p className={`font-rajdhani font-black text-4xl ${scoreColor(totalScore, maxScore)}`}>
            {totalScore}
            <span className="text-base text-slate-500 font-normal ml-1">/ {maxScore} pts</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-sm text-slate-400">Letters: <span className="text-white font-semibold">{lettersScore}</span></p>
          <p className="text-sm text-slate-400">Numbers: <span className="text-white font-semibold">{numbersScore}</span></p>
        </div>
      </div>

      {/* Round-by-round breakdown */}
      <div className="w-full flex flex-col gap-3">
        <h2 className="font-rajdhani font-bold text-lg text-white">Round Breakdown</h2>
        {roundDefs.map((def, i) => {
          const result = results[i];
          const label = getRoundLabel(def, i);
          if (def.type === 'letters') {
            const lr = result as LetterRoundResult | null;
            return (
              <div key={i} className="rounded-xl bg-[#0f1f38] border border-[#1a3560] p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
                  {lr?.userWordValid ? (
                    <p className="font-tile text-lg text-green-400 mt-0.5">{lr.userWord}</p>
                  ) : lr?.userWord ? (
                    <p className="font-tile text-lg text-red-400 mt-0.5 line-through">{lr.userWord}</p>
                  ) : (
                    <p className="text-sm text-slate-500 italic mt-0.5">No word</p>
                  )}
                  {lr?.bestWords?.[0] && (
                    <p className="text-xs text-slate-400 mt-0.5">Best: <span className="font-tile text-[#f6c90e]">{lr.bestWords[0].word}</span></p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`font-rajdhani font-bold text-xl ${scoreColor(lr?.userScore ?? 0, lr?.maxPossibleScore ?? 9)}`}>
                    {lr?.userScore ?? 0}
                  </p>
                  <p className="text-xs text-slate-500">/ {lr?.maxPossibleScore ?? 9} pts</p>
                </div>
              </div>
            );
          } else {
            const nr = result as NumberRoundResult | null;
            const diff = nr?.userResult !== null && nr?.userResult !== undefined
              ? Math.abs(nr.userResult - nr.target)
              : null;
            return (
              <div key={i} className="rounded-xl bg-[#0f1f38] border border-[#1a3560] p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
                  <p className="text-sm text-slate-300 mt-0.5">
                    Target: <span className="font-tile text-[#f6c90e]">{nr?.target ?? '?'}</span>
                    {nr?.userResult !== null && nr?.userResult !== undefined && (
                      <> · Got: <span className={`font-tile ${diff === 0 ? 'text-green-400' : 'text-white'}`}>{nr.userResult}</span></>
                    )}
                  </p>
                  {diff !== null && diff > 0 && (
                    <p className="text-xs text-slate-400">Off by {diff}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`font-rajdhani font-bold text-xl ${scoreColor(nr?.userScore ?? 0, 10)}`}>
                    {nr?.userScore ?? 0}
                  </p>
                  <p className="text-xs text-slate-500">/ 10 pts</p>
                </div>
              </div>
            );
          }
        })}
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-3 mt-2">
        <Link
          href={`/game?mode=${mode}`}
          className="w-full text-center py-3 rounded-2xl bg-[#f6c90e] text-[#070e1c] font-bold font-rajdhani uppercase tracking-wide transition-all active:scale-95 hover:bg-[#fdd835]"
        >
          Play Again
        </Link>
        <Link
          href="/"
          className="w-full text-center py-3 rounded-2xl border border-[#1a3560] text-slate-300 font-semibold transition-all active:scale-95 hover:border-[#f6c90e]/50"
        >
          ← Home
        </Link>
      </div>
    </main>
  );
}
