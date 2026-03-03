'use client';

interface Props {
  wordLetters: string[];           // Current word as letters
  wordIndices: number[];           // Which indices in the source are used
  onRemoveLast: () => void;
  onClear: () => void;
  onSubmit: () => void;
  isValid?: boolean | null;        // null = unchecked, true = valid, false = invalid
}

export default function WordBuilder({ wordLetters, wordIndices, onRemoveLast, onClear, onSubmit, isValid }: Props) {
  const word = wordLetters.join('');
  const hasLetters = wordLetters.length > 0;

  const validClass = isValid === true ? 'border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
    : isValid === false ? 'border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
    : 'border-[#2c5fa8]';

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Word display */}
      <div className={`
        w-full min-h-[52px] rounded-xl border-2 ${validClass}
        bg-[#0f1f38] flex items-center justify-center px-4 py-2
        transition-all duration-200
      `}>
        {hasLetters ? (
          <div className="flex gap-1 items-center flex-wrap justify-center">
            {wordLetters.map((l, i) => (
              <span
                key={`${l}-${wordIndices[i]}`}
                className="font-orbitron font-bold text-xl text-[#f6c90e] animate-tile-drop"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {l}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-slate-500 text-sm italic">Tap letters to build a word</span>
        )}
      </div>

      {/* Word length indicator */}
      {hasLetters && (
        <p className="text-xs text-slate-400">
          {word.length} letter{word.length !== 1 ? 's' : ''}
          {word.length >= 9 && ' 🌟'}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 w-full">
        <button
          onClick={onRemoveLast}
          disabled={!hasLetters}
          className="flex-1 py-2 rounded-xl border-2 border-[#1a3560] bg-[#0f1f38] text-sm font-medium text-slate-300
            disabled:opacity-40 disabled:cursor-not-allowed
            hover:border-[#2c5fa8] hover:bg-[#1a3560] active:scale-95 transition-all"
        >
          ⌫ Back
        </button>

        <button
          onClick={onClear}
          disabled={!hasLetters}
          className="flex-1 py-2 rounded-xl border-2 border-[#1a3560] bg-[#0f1f38] text-sm font-medium text-slate-300
            disabled:opacity-40 disabled:cursor-not-allowed
            hover:border-[#2c5fa8] hover:bg-[#1a3560] active:scale-95 transition-all"
        >
          Clear
        </button>

        <button
          onClick={onSubmit}
          disabled={!hasLetters || word.length < 2}
          className="flex-[2] py-2 rounded-xl font-semibold text-sm
            bg-[#f6c90e] text-[#070e1c]
            disabled:opacity-40 disabled:cursor-not-allowed
            hover:bg-[#ffd700] active:scale-95 transition-all
            shadow-[0_0_12px_rgba(246,201,14,0.3)]"
        >
          Lock in ✓
        </button>
      </div>
    </div>
  );
}
