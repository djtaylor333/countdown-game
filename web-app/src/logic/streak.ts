import type { DailyResult, StreakData } from './types';

const STORAGE_KEY = 'countdown_streak';

function freshDefault(): StreakData {
  return {
    currentPlayStreak: 0,
    currentCompleteStreak: 0,
    bestPlayStreak: 0,
    bestCompleteStreak: 0,
    lastPlayDate: null,
    lastCompleteDate: null,
    totalGamesPlayed: 0,
    totalGamesCompleted: 0,
    history: [],
  };
}

function loadStreak(): StreakData {
  if (typeof window === 'undefined') return freshDefault();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshDefault();
    return JSON.parse(raw) as StreakData;
  } catch {
    return freshDefault();
  }
}

function saveStreak(data: StreakData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round(Math.abs(da - db) / 86400000);
}

export function getStreak(): StreakData {
  return loadStreak();
}

/**
 * Record a daily play. Called when any round is submitted.
 * Updates play streak and stores the daily result.
 */
export function recordDailyPlay(result: DailyResult): StreakData {
  const data = loadStreak();
  const { dateKey } = result;

  // Check if this date already recorded
  const existingIdx = data.history.findIndex(h => h.dateKey === dateKey);
  if (existingIdx >= 0) {
    // Update existing entry
    const existing = data.history[existingIdx];
    const s1 = Math.max(existing.lettersScore1 ?? 0, result.lettersScore1);
    const s2 = Math.max(existing.lettersScore2 ?? 0, result.lettersScore2);
    const m1 = Math.max(existing.lettersMax1 ?? 0, result.lettersMax1);
    const m2 = Math.max(existing.lettersMax2 ?? 0, result.lettersMax2);
    data.history[existingIdx] = {
      ...existing,
      lettersScore1: s1,
      lettersScore2: s2,
      lettersMax1: m1,
      lettersMax2: m2,
      letterWord1: result.letterWord1 ?? existing.letterWord1,
      letterWord2: result.letterWord2 ?? existing.letterWord2,
      lettersScore: s1 + s2,
      lettersMax: m1 + m2,
      numbersScore: Math.max(existing.numbersScore, result.numbersScore),
      totalScore: Math.max(existing.totalScore, result.totalScore),
      completed: existing.completed || result.completed,
    };
  } else {
    data.history.push(result);
    data.totalGamesPlayed++;

    // Update play streak
    if (!data.lastPlayDate) {
      data.currentPlayStreak = 1;
    } else {
      const diff = daysBetween(data.lastPlayDate, dateKey);
      if (diff === 1) {
        data.currentPlayStreak++;
      } else if (diff > 1) {
        data.currentPlayStreak = 1; // streak broken
      }
      // diff === 0 means same day (shouldn't happen since we checked existingIdx)
    }
    data.lastPlayDate = dateKey;
    data.bestPlayStreak = Math.max(data.bestPlayStreak, data.currentPlayStreak);
  }

  // Update completion streak
  if (result.completed) {
    const existingComplete = existingIdx >= 0 && data.history[existingIdx].completed;
    if (!existingComplete) {
      data.totalGamesCompleted++;
    }

    if (!data.lastCompleteDate) {
      data.currentCompleteStreak = 1;
    } else {
      const diff = daysBetween(data.lastCompleteDate, dateKey);
      if (diff === 1) {
        data.currentCompleteStreak++;
      } else if (diff > 1) {
        data.currentCompleteStreak = 1;
      }
    }
    data.lastCompleteDate = dateKey;
    data.bestCompleteStreak = Math.max(data.bestCompleteStreak, data.currentCompleteStreak);
  }

  // Keep history to last 30 days
  data.history = data.history.slice(-30);

  saveStreak(data);
  return data;
}

/**
 * Get today's result if already played.
 */
export function getTodayResult(dateKey: string): DailyResult | null {
  const data = loadStreak();
  return data.history.find(h => h.dateKey === dateKey) ?? null;
}

/**
 * Generate a shareable result text.
 */
export function generateShareText(result: DailyResult): string {
  const percentage = result.lettersMax > 0
    ? Math.round((result.totalScore / (result.lettersMax * 2 + 10)) * 100)
    : 0;

  const lettersBar = scoreToEmoji(result.lettersScore, result.lettersMax);
  const numbersBar = result.numbersScore === 10 ? '🟩🟩🟩' :
    result.numbersScore === 7 ? '🟨🟨🟩' :
    result.numbersScore === 5 ? '🟨🟨⬜' : '⬜⬜⬜';

  return [
    `CountDown Game — ${result.dateKey}`,
    `Letters: ${lettersBar} (${result.lettersScore}/${result.lettersMax} pts)`,
    `Numbers: ${numbersBar} (${result.numbersScore}/10 pts)`,
    `Total: ${result.totalScore} pts (${percentage}%)`,
    '',
    'https://djtaylor333.github.io/countdown-game/',
  ].join('\n');
}

function scoreToEmoji(score: number, max: number): string {
  if (max === 0) return '⬜⬜⬜';
  const pct = score / max;
  if (pct === 1) return '🟩🟩🟩';
  if (pct >= 0.7) return '🟩🟩⬜';
  if (pct >= 0.4) return '🟨🟨⬜';
  return '🟨⬜⬜';
}
