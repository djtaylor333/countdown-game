'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTodayKey } from '../logic/dailyChallenge';
import { getStreak, getTodayResult } from '../logic/streak';
import type { StreakData, DailyResult } from '../logic/types';
import StreakBadge from '../components/StreakBadge';

export default function HomePage() {
  const [streaks, setStreaks] = useState<StreakData | null>(null);
  const [todayResult, setTodayResult] = useState<DailyResult | null>(null);
  const [dateKey, setDateKey] = useState('');

  useEffect(() => {
    const key = getTodayKey();
    setDateKey(key);
    setStreaks(getStreak());
    setTodayResult(getTodayResult(key));
  }, []);

  // Format date nicely: "Monday, 3 March 2026"
  const formattedDate = dateKey
    ? new Date(dateKey + 'T12:00:00').toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const alreadyPlayed = todayResult?.completed === true;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8 max-w-md mx-auto">
      {/* Logo header */}
      <div className="flex flex-col items-center gap-1 mb-8 mt-4">
        <h1 className="font-rajdhani font-black text-5xl tracking-tight text-white">
          COUNT<span className="text-[#f6c90e]">DOWN</span>
        </h1>
        <p className="text-sm text-slate-400 tracking-wide">{formattedDate}</p>
      </div>

      {/* Streak section */}
      {streaks && (
        <section className="w-full mb-8">
          <StreakBadge streaks={streaks} />
        </section>
      )}

      {/* Today's game card */}
      <section className="w-full rounded-2xl bg-[#0f1f38] border border-[#1a3560] p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-rajdhani font-bold text-lg text-white">Today&apos;s Game</h2>
            <p className="text-sm text-slate-400 mt-0.5">2 Letters Rounds · 1 Numbers Round</p>
          </div>
          {alreadyPlayed && (
            <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-full font-semibold">
              ✓ Played
            </span>
          )}
        </div>

        {/* Round mini-preview */}
        <div className="flex gap-2">
          <RoundPill icon="🔤" label="Letters I" done={alreadyPlayed} />
          <RoundPill icon="🔤" label="Letters II" done={alreadyPlayed} />
          <RoundPill icon="🔢" label="Numbers" done={alreadyPlayed} />
        </div>

        {/* Score preview if already played */}
        {alreadyPlayed && todayResult && (
          <div className="rounded-xl bg-[#0a1628] px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-slate-400">Today&apos;s Score</span>
            <span className="font-rajdhani font-bold text-xl text-[#f6c90e]">
              {todayResult.totalScore}
              <span className="text-sm text-slate-500 font-normal ml-1">pts</span>
            </span>
          </div>
        )}

        {/* CTA */}
        {alreadyPlayed ? (
          <div className="flex flex-col gap-2">
            <Link
              href="/results"
              className="w-full text-center py-3 rounded-2xl bg-[#f6c90e] text-[#070e1c] font-bold font-rajdhani uppercase tracking-wide transition-all active:scale-95 hover:bg-[#fdd835]"
            >
              View Today&apos;s Results
            </Link>
            <Link
              href="/game"
              className="w-full text-center py-3 rounded-2xl border border-[#1a3560] text-slate-300 font-semibold transition-all active:scale-95 hover:border-[#f6c90e]/50"
            >
              Replay Today&apos;s Game
            </Link>
          </div>
        ) : (
          <Link
            href="/game"
            className="w-full text-center py-3 rounded-2xl bg-[#f6c90e] text-[#070e1c] font-bold font-rajdhani uppercase tracking-wide transition-all active:scale-95 hover:bg-[#fdd835] text-lg"
          >
            Play Today&apos;s Game
          </Link>
        )}
      </section>

      {/* How to play */}
      <section className="w-full mt-6 rounded-2xl bg-[#0f1f38] border border-[#1a3560] p-5">
        <h3 className="font-semibold text-slate-300 mb-3">How to Play</h3>
        <ul className="flex flex-col gap-2 text-sm text-slate-400">
          <li className="flex gap-2">
            <span className="text-[#f6c90e]">🔤</span>
            <span><strong className="text-slate-300">Letters Round:</strong> Pick 9 letters, find the longest word in 60 seconds.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#f6c90e]">🔢</span>
            <span><strong className="text-slate-300">Numbers Round:</strong> Use 6 numbers to reach the target using +, −, ×, ÷.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#f6c90e]">📅</span>
            <span>One new puzzle per day, shared by everyone. Build your streak!</span>
          </li>
        </ul>
      </section>

      {/* Other modes */}
      <section className="w-full mt-4 flex flex-col gap-3">
        <h3 className="font-rajdhani font-bold text-slate-300 text-base uppercase tracking-wide">More Modes</h3>

        {/* Practice mode */}
        <Link
          href="/game?mode=practice"
          className="w-full rounded-2xl bg-[#0f1f38] border border-[#1a3560] p-5 flex items-center justify-between hover:border-[#f6c90e]/40 transition-colors"
        >
          <div>
            <h3 className="font-rajdhani font-bold text-white text-lg">Practice Mode</h3>
            <p className="text-xs text-slate-400 mt-0.5">2 Letters · 1 Numbers · No Timer · Epoch-seeded</p>
          </div>
          <span className="text-2xl">🎯</span>
        </Link>

        {/* Full game mode */}
        <Link
          href="/game?mode=full"
          className="w-full rounded-2xl bg-[#0f1f38] border border-[#1a3560] p-5 flex items-center justify-between hover:border-[#f6c90e]/40 transition-colors"
        >
          <div>
            <h3 className="font-rajdhani font-bold text-white text-lg">Full Game</h3>
            <p className="text-xs text-slate-400 mt-0.5">6 Letters · 3 Numbers · 9 Rounds · Real Countdown Format</p>
          </div>
          <span className="text-2xl">🏆</span>
        </Link>
      </section>

      <footer className="mt-auto pt-8 text-xs text-slate-600 text-center">
        Inspired by the British TV show Countdown
      </footer>
    </main>
  );
}

function RoundPill({ icon, label, done }: { icon: string; label: string; done: boolean }) {
  return (
    <div className={`flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 px-1 border transition-all ${done ? 'border-green-500/30 bg-green-500/10' : 'border-[#1a3560] bg-[#0a1628]'}`}>
      <span className="text-base">{icon}</span>
      <span className="text-xs text-slate-400 text-center leading-tight">{label}</span>
      {done && <span className="text-xs text-green-400">✓</span>}
    </div>
  );
}
