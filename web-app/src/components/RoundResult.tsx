'use client';

import { useEffect, useState } from 'react';
import type { LetterRoundResult, NumberRoundResult, BestWord } from '../logic/types';
import { fetchDefinition } from '../logic/dictionary';
import { formatSolution } from '../logic/numbers';

export function LetterRoundResultPanel({ result, roundNum }: { result: LetterRoundResult; roundNum: number }) {
  const [bestWords, setBestWords] = useState<BestWord[]>(result.bestWords);

  useEffect(() => {
    // Fetch definitions for best words in background
    let cancelled = false;
    async function loadDefinitions() {
      const updated = await Promise.all(
        result.bestWords.map(async (w) => {
          const entry = await fetchDefinition(w.word);
          return { ...w, definition: entry?.definition ?? 'No definition available.' };
        }),
      );
      if (!cancelled) setBestWords(updated);
    }
    loadDefinitions();
    return () => { cancelled = true; };
  }, [result.bestWords]);

  const pct = result.maxPossibleScore > 0
    ? Math.round((result.userScore / result.maxPossibleScore) * 100)
    : 0;

  return (
    <div className="rounded-2xl bg-[#0f1f38] border border-[#1a3560] p-4 flex flex-col gap-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
          Letters Round {roundNum}
        </h3>
        <span className={`text-sm font-bold font-orbitron ${pct === 100 ? 'text-green-400' : pct >= 70 ? 'text-[#f6c90e]' : 'text-slate-300'}`}>
          {result.userScore}/{result.maxPossibleScore}
        </span>
      </div>

      {/* User's word */}
      <div className="flex flex-col gap-1">
        <p className="text-xs text-slate-500 uppercase tracking-wide">Your word</p>
        <div className={`flex items-center gap-2 rounded-xl px-4 py-2 border ${result.userWordValid ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
          <span className="font-orbitron font-bold text-lg tracking-widest">
            {result.userWord || '—'}
          </span>
          <span className="ml-auto text-lg">
            {result.userWordValid ? '✓' : result.userWord ? '✗' : '—'}
          </span>
        </div>
      </div>

      {/* Best words */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-slate-500 uppercase tracking-wide">Best possible words</p>
        {bestWords.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No long words found</p>
        ) : (
          <div className="flex flex-col gap-2">
            {bestWords.slice(0, 4).map((w, i) => (
              <div key={`${w.word}-${i}`} className={`rounded-xl p-3 border transition-all ${i === 0 ? 'border-[#f6c90e]/50 bg-[#f6c90e]/5' : 'border-[#1a3560] bg-[#0a1628]'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-orbitron font-bold text-base tracking-widest text-[#f6c90e]">
                    {w.word}
                  </span>
                  <span className="text-xs text-slate-500">({w.word.length} pts)</span>
                  {i === 0 && w.word.length === 9 && (
                    <span className="ml-auto text-xs bg-[#f6c90e] text-[#070e1c] px-1.5 py-0.5 rounded font-bold">
                      FULL HOUSE!
                    </span>
                  )}
                </div>
                {w.definition && (
                  <p className="text-xs text-slate-400 italic leading-relaxed">{w.definition}</p>
                )}
                {!w.definition && (
                  <p className="text-xs text-slate-600 italic">Loading definition…</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function NumberRoundResultPanel({ result }: { result: NumberRoundResult }) {
  const diffDisplay = result.userResult !== null
    ? Math.abs(result.userResult - result.target)
    : null;

  return (
    <div className="rounded-2xl bg-[#0f1f38] border border-[#1a3560] p-4 flex flex-col gap-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
          Numbers Round
        </h3>
        <span className={`text-sm font-bold font-orbitron ${result.userScore === 10 ? 'text-green-400' : result.userScore > 0 ? 'text-[#f6c90e]' : 'text-slate-400'}`}>
          {result.userScore}/10
        </span>
      </div>

      {/* Target */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 uppercase tracking-wide">Target:</span>
        <span className="font-orbitron font-black text-2xl text-[#f6c90e]">{result.target}</span>
      </div>

      {/* User result */}
      <div className="flex flex-col gap-1">
        <p className="text-xs text-slate-500 uppercase tracking-wide">Your answer</p>
        {result.userResult !== null && result.userSteps.length > 0 ? (
          <div className={`rounded-xl px-4 py-3 border ${result.userScore === 10 ? 'border-green-500/50 bg-green-500/10' : result.userScore > 0 ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-[#1a3560] bg-[#0a1628]'}`}>
            <p className="text-sm font-orbitron text-slate-300 whitespace-pre-wrap">
              {formatSolution(result.userSteps)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-orbitron font-bold text-lg text-white">{result.userResult}</span>
              {diffDisplay !== null && diffDisplay > 0 && (
                <span className="text-sm text-yellow-400">({diffDisplay} away)</span>
              )}
              {diffDisplay === 0 && <span className="text-green-400 text-sm">✓ Exact!</span>}
            </div>
          </div>
        ) : (
          <div className="rounded-xl px-4 py-2 border border-[#1a3560] bg-[#0a1628]">
            <span className="text-slate-500 text-sm italic">No answer submitted</span>
          </div>
        )}
      </div>

      {/* Solution */}
      {result.solution && result.solution.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Solution</p>
          <div className="rounded-xl px-4 py-3 border border-[#f6c90e]/30 bg-[#f6c90e]/5">
            <p className="text-sm font-orbitron text-slate-200 whitespace-pre-wrap">
              {formatSolution(result.solution)}
            </p>
            <span className="font-orbitron font-bold text-lg text-[#f6c90e] mt-1 block">
              = {result.solution[result.solution.length - 1].result}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
