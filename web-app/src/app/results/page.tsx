'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTodayKey } from '../../logic/dailyChallenge';
import { getTodayResult } from '../../logic/streak';
import type { DailyResult } from '../../logic/types';
import DailySummary from '../../components/DailySummary';

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<DailyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = getTodayKey();
    const saved = getTodayResult(key);
    if (!saved) {
      // No result yet — send back home
      router.replace('/');
    } else {
      setResult(saved);
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="font-rajdhani text-[#f6c90e] text-xl animate-pulse">Loading…</span>
      </main>
    );
  }

  if (!result) return null;

  return (
    <main className="min-h-screen flex flex-col px-4 py-8 max-w-md mx-auto">
      <div className="w-full flex items-center justify-between mb-6">
        <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">← Home</Link>
        <span className="font-rajdhani text-sm text-slate-500">Results</span>
        <span className="w-12" />
      </div>

      <DailySummary
        result={result}
        onPlayAgain={() => router.push('/game')}
      />
    </main>
  );
}
