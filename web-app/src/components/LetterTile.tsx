'use client';

interface Props {
  letter: string;
  index: number;
  used?: boolean;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: (index: number) => void;
  animDelay?: number;
}

const sizeMap = {
  sm: 'text-xs sm:text-sm',
  md: 'text-sm sm:text-base',
  lg: 'text-base sm:text-xl',
};

export default function LetterTile({ letter, index, used, selected, size = 'md', onClick, animDelay = 0 }: Props) {
  const sizeClass = sizeMap[size];
  const baseClass = `letter-tile w-full ${sizeClass} font-tile rounded-md select-none`;
  const stateClass = selected ? 'selected' : used ? 'used' : '';
  const animClass = letter ? 'animate-tile-drop' : '';

  return (
    <button
      className={`${baseClass} ${stateClass} ${animClass}`}
      style={{ animationDelay: `${animDelay}ms` }}
      onClick={() => !used && onClick?.(index)}
      disabled={used}
      aria-label={letter ? `Letter ${letter}` : 'Empty tile'}
      aria-pressed={selected}
    >
      {letter}
    </button>
  );
}
