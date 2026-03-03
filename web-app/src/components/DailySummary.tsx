'use client';

import { useState } from 'react';
import type { DailyResult } from '../logic/types';
import { generateShareText } from '../logic/streak';

interface DailySummaryProps {
  result: DailyResult;
  onPlayAgain?: () => void;
}

export default function DailySummary({ result, onPlayAgain }: DailySummaryProps) {
  const [shared, setShared] = useState(false);

  const totalScore = result.totalScore;
  const maxScore = result.lettersMax + 10;
  const sharePct = Math.round((totalScore / maxScore) * 100);

  const grade = sharePct >= 95 ? 'S' : sharePct >= 80 ? 'A' : sharePct >= 60 ? 'B' : sharePct >= 40 ? 'C' : 'D';
  const gradeColor = grade === 'S' ? 'text-green-400' : grade === 'A' ? 'text-[#f6c90e]' : grade === 'B' ? 'text-blue-400' : 'text-slate-400';

  async function handleShare() {
    const text = generateShareText(result);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'CountDown', text });
        setShared(true);
      } catch {
        // user cancelled or not supported
        await copyToClipboard(text);
      }
    } else {
      await copyToClipboard(text);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      // clipboard not available
    }
  }

  return (
    <div className="flex flex-col gap-5 animate-slide-up max-w-md mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 pt-2">
        <h2 className="font-rajdhani font-black text-2xl tracking-wide text-white">Today&apos;s Results</h2>
        <p className="text-sm text-slate-400">{result.dateKey}</p>
      </div>

      {/* Grade + total score */}
      <div className="flex items-center justify-center gap-6 rounded-2xl bg-[#0f1f38] border border-[#1a3560] p-5">
        <div className="flex flex-col items-center">
          <span className={`font-rajdhani font-black text-6xl leading-none ${gradeColor}`}>{grade}</span>
          <span className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Grade</span>
        </div>
        <div className="w-px h-12 bg-[#1a3560]" />
        <div className="flex flex-col items-center">
          <span className="font-rajdhani font-black text-4xl text-[#f6c90e] leading-none">{totalScore}</span>
          <span className="text-xs text-slate-500 mt-1 uppercase tracking-wide">out of {maxScore}</span>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="flex flex-col gap-2">
        <ScoreRow label="Letters Round 1" score={result.lettersScore1} max={result.lettersMax1} word={result.letterWord1} />
        <ScoreRow label="Letters Round 2" score={result.lettersScore2} max={result.lettersMax2} word={result.letterWord2} />
        <ScoreRow label="Numbers Round" score={result.numbersScore} max={10} />
      </div>

      {/* Share preview */}
      <div className="rounded-2xl bg-[#0a1628] border border-[#1a3560] p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Share Preview</p>
        <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
          {generateShareText(result)}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleShare}
          className="w-full py-3 rounded-2xl bg-[#f6c90e] text-[#070e1c] font-bold font-rajdhani uppercase tracking-wide transition-all active:scale-95 hover:bg-[#fdd835]"
        >
          {shared ? '✓ Copied to clipboard!' : '📤 Share Results'}
        </button>
        {onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className="w-full py-3 rounded-2xl border border-[#1a3560] text-slate-300 font-semibold transition-all active:scale-95 hover:border-[#f6c90e]/50"
          >
            View Today&apos;s Game
          </button>
        )}
      </div>
    </div>
  );
}

function ScoreRow({ label, score, max, word }: { label: string; score: number; max: number; word?: string }) {
  const pct = max > 0 ? score / max : 0;
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#0f1f38] border border-[#1a3560] px-4 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
        {word && <p className="text-sm font-rajdhani tracking-widest text-slate-300 truncate mt-0.5">{word}</p>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-16 h-1.5 rounded-full bg-[#1a3560] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct === 1 ? 'bg-green-400' : pct >= 0.7 ? 'bg-[#f6c90e]' : pct > 0 ? 'bg-blue-400' : 'bg-[#1a3560]'}`}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
        <span className="font-rajdhani font-bold text-sm text-[#f6c90e] w-10 text-right">
          {score}/{max}
        </span>
      </div>
    </div>
  );
}
