'use client';

import type { StreakData } from '../logic/types';

interface StreakBadgeProps {
  streaks: StreakData;
  mini?: boolean;
}

export default function StreakBadge({ streaks, mini = false }: StreakBadgeProps) {
  if (mini) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0f1f38] border border-[#1a3560]">
        <span className="text-base">🔥</span>
        <span className="font-rajdhani font-bold text-sm text-[#f6c90e]">
          {streaks.currentPlayStreak}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-stretch gap-3">
      <StreakCell icon="🔥" label="Play Streak" value={streaks.currentPlayStreak} best={streaks.bestPlayStreak} />
      <StreakCell icon="⭐" label="Complete Streak" value={streaks.currentCompleteStreak} best={streaks.bestCompleteStreak} />
      <StreakCell icon="🎮" label="Total Games" value={streaks.totalGamesPlayed} />
    </div>
  );
}

function StreakCell({
  icon,
  label,
  value,
  best,
}: {
  icon: string;
  label: string;
  value: number;
  best?: number;
}) {
  return (
    <div className="flex-1 flex flex-col items-center gap-0.5 rounded-2xl bg-[#0f1f38] border border-[#1a3560] p-3">
      <span className="text-2xl leading-none">{icon}</span>
      <span className="font-rajdhani font-black text-2xl text-[#f6c90e] leading-none mt-1">
        {value}
      </span>
      <span className="text-xs text-slate-400 text-center leading-tight mt-0.5">{label}</span>
      {best !== undefined && (
        <span className="text-xs text-slate-600 mt-0.5">best {best}</span>
      )}
    </div>
  );
}
