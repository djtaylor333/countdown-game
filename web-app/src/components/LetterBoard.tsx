'use client';

import LetterTile from './LetterTile';

interface Props {
  letters: string[];
  usedIndices: number[];
  onPickLetter: (index: number) => void;
  phase?: 'selecting' | 'playing' | 'results';
}

export default function LetterBoard({ letters, usedIndices, onPickLetter, phase }: Props) {
  const usedSet = new Set(usedIndices);
  const slots = Array(9).fill('');

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Board title */}
      <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">
        Letters
      </p>

      {/* 9-tile grid — 5 on top row, 4 on bottom (or 3+3+3) */}
      <div className="grid grid-cols-9 gap-1 sm:gap-1.5 w-full py-1">
        {slots.map((_, i) => (
          <LetterTile
            key={i}
            letter={letters[i] ?? ''}
            index={i}
            used={usedSet.has(i)}
            size="lg"
            onClick={phase === 'playing' ? onPickLetter : undefined}
            animDelay={letters[i] ? i * 60 : 0}
          />
        ))}
      </div>
    </div>
  );
}
