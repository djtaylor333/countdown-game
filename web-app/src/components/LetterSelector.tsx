'use client';

interface Props {
  onPick: (type: 'consonant' | 'vowel') => void;
  letterCount: number;
  vowelCount: number;
  consonantCount: number;
  disabled?: boolean;
}

export default function LetterSelector({ onPick, letterCount, vowelCount, consonantCount, disabled }: Props) {
  const remaining = 9 - letterCount;
  const maxVowels = 6;
  const minVowelsNeeded = Math.max(0, 3 - vowelCount);
  const maxConsonantsNeeded = 9 - 3 - consonantCount; // at most 6 consonants total
  const tooManyVowels = vowelCount >= maxVowels;
  const canPickVowel = !disabled && !tooManyVowels && remaining > 0 && remaining > minVowelsNeeded;
  // Can pick consonant if we have space and won't end up with < 3 vowels
  const remainingAfterConsonant = remaining - 1;
  const vowelsStillNeeded = Math.max(0, 3 - vowelCount);
  const canPickConsonant = !disabled && remaining > 0 && remainingAfterConsonant >= vowelsStillNeeded && maxConsonantsNeeded >= 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-sm text-slate-400">
          Choose letter {letterCount + 1} of 9
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {vowelCount} vowel{vowelCount !== 1 ? 's' : ''} &bull; {consonantCount} consonant{consonantCount !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => canPickVowel && onPick('vowel')}
          disabled={!canPickVowel}
          className={`
            px-6 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-150
            ${canPickVowel
              ? 'bg-[#1e4176] border-2 border-[#2c5fa8] text-white hover:border-[#f6c90e] hover:bg-[#2c5fa8] hover:shadow-[0_0_12px_rgba(246,201,14,0.4)] active:scale-95'
              : 'bg-[#0f1f38] border-2 border-[#1a2f4e] text-slate-600 cursor-not-allowed'}
          `}
        >
          <span className="block text-lg font-bold font-rajdhani">V</span>
          Vowel
        </button>

        <button
          onClick={() => canPickConsonant && onPick('consonant')}
          disabled={!canPickConsonant}
          className={`
            px-6 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-150
            ${canPickConsonant
              ? 'bg-[#1e4176] border-2 border-[#2c5fa8] text-white hover:border-[#f6c90e] hover:bg-[#2c5fa8] hover:shadow-[0_0_12px_rgba(246,201,14,0.4)] active:scale-95'
              : 'bg-[#0f1f38] border-2 border-[#1a2f4e] text-slate-600 cursor-not-allowed'}
          `}
        >
          <span className="block text-lg font-bold font-rajdhani">C</span>
          Consonant
        </button>
      </div>

      {vowelCount < 3 && remaining > 0 && (
        <p className="text-xs text-yellow-500/80">
          Need at least {3 - vowelCount} more vowel{3 - vowelCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
