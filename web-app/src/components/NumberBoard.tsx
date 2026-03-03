'use client';

import NumberTile from './NumberTile';

interface Props {
  numbers: number[];
  largeNumbers: Set<number>;
  usedIndices: number[];
  target: number;
  onPickNumber: (index: number) => void;
  phase?: 'playing' | 'results';
}

export default function NumberBoard({ numbers, largeNumbers, usedIndices, target, onPickNumber, phase }: Props) {
  const usedSet = new Set(usedIndices);

  // Determine which are large (25/50/75/100)
  const LARGE = new Set([25, 50, 75, 100]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Target */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Target</p>
        <div className="bg-[#1a3560] border-2 border-[#f6c90e] rounded-2xl px-8 py-3 shadow-[0_0_20px_rgba(246,201,14,0.25)]">
          <span className="font-orbitron font-black text-4xl text-[#f6c90e] tracking-wider">
            {target}
          </span>
        </div>
      </div>

      {/* Available numbers */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Numbers</p>
        <div className="flex gap-2 flex-wrap justify-center">
          {numbers.map((n, i) => (
            <NumberTile
              key={i}
              value={n}
              index={i}
              used={usedSet.has(i)}
              isLarge={LARGE.has(n)}
              onClick={phase === 'playing' ? onPickNumber : undefined}
              size="lg"
              animDelay={i * 80}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
